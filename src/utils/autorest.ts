import { RestError, PipelineResponse, PipelinePolicy } from '@azure/core-rest-pipeline';
import {
  AdditionalPolicyConfig,
  FullOperationResponse,
  OperationOptions,
  createSerializer as createSerializerOrig,
} from '@azure/core-client';
import { pause } from './other.js';
import semverSatisfies from './semver-satisfies.js';
import { InternalError, UnexpectedTsError, UnsupportedVersionError } from './errors.js';

const bigIntPrefix = '_sdk-big-int-';

export const createSerializer = (
  ...args: Parameters<typeof createSerializerOrig>
): ReturnType<typeof createSerializerOrig> => {
  const serializer = createSerializerOrig(...args);
  const { serialize, deserialize } = serializer;
  return Object.assign(serializer, {
    serialize(
      ...[mapper, object, objectName, options]: Parameters<typeof serialize>
    ): ReturnType<typeof serialize> {
      // @ts-expect-error we are extending autorest with BigInt support
      if (mapper.type.name !== 'BigInt' || object == null) {
        return serialize.call(this, mapper, object, objectName, options);
      }
      if (typeof object !== 'bigint') {
        objectName ??= mapper.serializedName;
        throw new Error(`${objectName} with value ${object} must be of type bigint.`);
      }
      return object.toString();
    },

    deserialize(
      ...[mapper, responseBody, objectName, options]: Parameters<typeof deserialize>
    ): ReturnType<typeof deserialize> {
      // @ts-expect-error we are extending autorest with BigInt support
      if (mapper.type.name !== 'BigInt' || responseBody == null) {
        if (typeof responseBody === 'string' && responseBody.startsWith(bigIntPrefix)) {
          console.warn(`AeSdk internal error: BigInt value ${responseBody} handled incorrectly`);
          responseBody = +responseBody.replace(bigIntPrefix, '');
        }
        const result = deserialize.call(this, mapper, responseBody, objectName, options);
        // TODO: remove after fixing https://github.com/aeternity/ae_mdw/issues/1891
        // and https://github.com/aeternity/aeternity/issues/4386
        if (result instanceof Date) return new Date(+result / 1000);
        return result;
      }
      if (typeof responseBody === 'number' && responseBody > Number.MAX_SAFE_INTEGER) {
        throw new InternalError(`Number ${responseBody} is not accurate to be converted to BigInt`);
      }
      return BigInt(responseBody.toString().replace(bigIntPrefix, ''));
    },
  });
};

const safeLength = Number.MAX_SAFE_INTEGER.toString().length;
const bigIntPropertyRe = new RegExp(String.raw`("\w+":\s*)(\d{${safeLength},})(\s*[,}])`, 'm');
const bigIntArrayItemRe = new RegExp(String.raw`([[,]\s*)(\d{${safeLength},})\b`, 'm');
export const parseBigIntPolicy: PipelinePolicy = {
  name: 'parse-big-int',
  async sendRequest(request, next) {
    const response = await next(request);
    if (response.bodyAsText == null) return response;
    // TODO: replace with https://caniuse.com/mdn-javascript_builtins_json_parse_reviver_parameter_context_argument when it gets support in FF and Safari
    response.bodyAsText = response.bodyAsText.replaceAll(
      new RegExp(bigIntPropertyRe, 'g'),
      (matched) => {
        const match = matched.match(bigIntPropertyRe);
        if (match == null) throw new UnexpectedTsError();
        const [, name, value, end] = match;
        return [
          name,
          +value > Number.MAX_SAFE_INTEGER ? `"${bigIntPrefix}${value}"` : value,
          end,
        ].join('');
      },
    );
    // FIXME: may break strings inside json
    response.bodyAsText = response.bodyAsText.replaceAll(
      new RegExp(bigIntArrayItemRe, 'g'),
      (matched) => {
        const match = matched.match(bigIntArrayItemRe);
        if (match == null) throw new UnexpectedTsError();
        const [, prefix, value] = match;
        return `${prefix}"${bigIntPrefix}${value}"`;
      },
    );
    return response;
  },
};

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
        requestQueues.set(
          key,
          req.catch(() => {}),
        );
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
        if (
          !(error instanceof RestError) ||
          error.request == null ||
          error.message.startsWith('Error ')
        )
          throw error;
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
  ignoreVersion: boolean,
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
      if (!semverSatisfies(...args)) {
        const error = new UnsupportedVersionError(name, ...args);
        if (ignoreVersion) console.warn(error.message);
        else throw error;
      }
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
      if (request.headers.get('__no-retry') != null) {
        request.headers.delete('__no-retry');
        return next(request);
      }

      const retryCode = request.headers.get('__retry-code') ?? NaN;
      request.headers.delete('__retry-code');
      const statusesToNotRetry = [200, 400, 403, 410, 500].filter((c) => c !== +retryCode);

      const intervals = new Array(retryCount)
        .fill(0)
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
