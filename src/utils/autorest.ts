import { RestError, PipelineResponse, PipelinePolicy } from '@azure/core-rest-pipeline';
import { AdditionalPolicyConfig } from '@azure/core-client';
import { pause } from './other';
import semverSatisfies from './semver-satisfies';
import { UnsupportedVersionError } from './errors';

export const genRequestQueuesPolicy = (): AdditionalPolicyConfig => {
  const requestQueues = new Map<string, Promise<unknown>>();

  return {
    policy: {
      name: 'request-queues',
      async sendRequest(request, next) {
        const key = request.headers.get('__queue');
        request.headers.delete('__queue');
        const getResponse = async (): Promise<PipelineResponse> => next(request);
        if (key == null) return getResponse();
        const req = (requestQueues.get(key) ?? Promise.resolve()).then(getResponse);
        // TODO: remove pause after fixing https://github.com/aeternity/aeternity/issues/3803
        // gap to ensure that node won't reject the nonce
        requestQueues.set(key, req.then(async () => pause(750), () => {}));
        return req;
      },
    },
    position: 'perCall',
  };
};

export const genCombineGetRequestsPolicy = (): AdditionalPolicyConfig => {
  const pendingGetRequests = new Map<string, Promise<PipelineResponse>>();

  return {
    policy: {
      name: 'combine-get-requests',
      async sendRequest(request, next) {
        if (request.method !== 'GET') return next(request);
        const key = JSON.stringify([request.url, request.body]);
        const response = pendingGetRequests.get(key) ?? next(request);
        pendingGetRequests.set(key, response);
        try {
          return await response;
        } finally {
          pendingGetRequests.delete(key);
        }
      },
    },
    position: 'perCall',
  };
};

export const genAggressiveCacheGetResponsesPolicy = (): AdditionalPolicyConfig => {
  const getRequests = new Map<string, Promise<PipelineResponse>>();

  return {
    policy: {
      name: 'aggressive-cache-get-responses',
      async sendRequest(request, next) {
        if (request.method !== 'GET') return next(request);
        const key = JSON.stringify([request.url, request.body]);
        const response = getRequests.get(key) ?? next(request);
        getRequests.set(key, response);
        return response;
      },
    },
    position: 'perCall',
  };
};

export const genErrorFormatterPolicy = (
  getMessage: (b: any) => string,
): AdditionalPolicyConfig => ({
  policy: {
    name: 'error-formatter',
    async sendRequest(request, next) {
      try {
        return await next(request);
      } catch (error) {
        if (!(error instanceof RestError) || error.request == null) throw error;
        if (error.response?.bodyAsText == null) throw error;

        let body;
        try {
          body = JSON.parse(error.response.bodyAsText);
        } catch (e) {
          throw error;
        }
        error.message = `${new URL(error.request.url).pathname.slice(1)} error`;
        const message = getMessage(body);
        if (message !== '') error.message += `:${message}`;
        throw error;
      }
    },
  },
  position: 'perCall',
});

export const genVersionCheckPolicy = (
  name: string,
  ignorePath: string,
  versionPromise: Promise<string | Error>,
  geVersion: string,
  ltVersion: string,
): PipelinePolicy => ({
  name: 'version-check',
  async sendRequest(request, next) {
    if (new URL(request.url).pathname === ignorePath) return next(request);
    const version = await versionPromise;
    if (version instanceof Error) throw version;
    const args = [version, geVersion, ltVersion] as const;
    if (!semverSatisfies(...args)) throw new UnsupportedVersionError(name, ...args);
    return next(request);
  },
});

export const genRetryOnFailurePolicy = (
  retryCount: number,
  retryOverallDelay: number,
): AdditionalPolicyConfig => ({
  policy: {
    name: 'retry-on-failure',
    async sendRequest(request, next) {
      const statusesToNotRetry = [200, 400, 403, 500];

      const intervals = new Array(retryCount).fill(0)
        .map((_, idx) => ((idx + 1) / retryCount) ** 2);
      const intervalSum = intervals.reduce((a, b) => a + b);
      const intervalsInMs = intervals.map((el) => (el / intervalSum) * retryOverallDelay);

      let error = new RestError('Not expected to be thrown');
      for (let attempt = 0; attempt <= retryCount; attempt += 1) {
        if (attempt !== 0) await pause(intervalsInMs[attempt - 1]);
        try {
          return await next(request);
        } catch (e) {
          if (!(e instanceof RestError)) throw e;
          if (statusesToNotRetry.includes(e.response?.status ?? 0)) throw e;
          error = e;
        }
      }
      throw error;
    },
  },
  position: 'perCall',
});
