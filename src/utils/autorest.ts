import { RestError, PipelineResponse } from '@azure/core-rest-pipeline';
import { AdditionalPolicyConfig, FullOperationResponse, OperationOptions } from '@azure/core-client';
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
        requestQueues.set(key, req.catch(() => {}));
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
        const prefix = `${new URL(error.request.url).pathname.slice(1)} error`;

        if (error.response?.bodyAsText == null) {
          if (error.message === '') error.message = `${prefix}: ${error.code}`;
          throw error;
        }

        const body = (error.response as FullOperationResponse).parsedBody;
        error.message = prefix;
        const message = body == null ? ` ${error.response.status} status code` : getMessage(body);
        if (message !== '') error.message += `:${message}`;
        throw error;
      }
    },
  },
  position: 'perCall',
});

export const genVersionCheckPolicy = (
  name: string,
  versionCb: (options: OperationOptions) => Promise<string>,
  geVersion: string,
  ltVersion: string,
): AdditionalPolicyConfig => ({
  policy: {
    name: 'version-check',
    async sendRequest(request, next) {
      if (request.headers.has('__version-check')) {
        request.headers.delete('__version-check');
        return next(request);
      }
      const options = { requestOptions: { customHeaders: { '__version-check': 'true' } } };
      const args = [await versionCb(options), geVersion, ltVersion] as const;
      if (!semverSatisfies(...args)) throw new UnsupportedVersionError(name, ...args);
      return next(request);
    },
  },
  position: 'perCall',
});

export const genRetryOnFailurePolicy = (
  retryCount: number,
  retryOverallDelay: number,
): AdditionalPolicyConfig => ({
  policy: {
    name: 'retry-on-failure',
    async sendRequest(request, next) {
      const retryCode = request.headers.get('__retry-code') ?? NaN;
      request.headers.delete('__retry-code');
      const statusesToNotRetry = [200, 400, 403, 410, 500].filter((c) => c !== +retryCode);

      const intervals = new Array(retryCount).fill(0)
        .map((_, idx) => ((idx + 1) / retryCount) ** 2);
      const intervalSum = intervals.reduce((a, b) => a + b, 0);
      const intervalsInMs = intervals.map((e) => Math.floor((e / intervalSum) * retryOverallDelay));

      let error = new RestError('Not expected to be thrown');
      for (let attempt = 0; attempt <= retryCount; attempt += 1) {
        if (attempt !== 0) {
          await pause(intervalsInMs[attempt - 1]);
          const urlParsed = new URL(request.url);
          urlParsed.searchParams.set('__sdk-retry', attempt.toString());
          request.url = urlParsed.toString();
        }
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
