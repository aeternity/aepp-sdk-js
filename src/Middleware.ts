import { OperationArguments, OperationOptions, OperationSpec } from '@azure/core-client';
import { userAgentPolicyName, setClientRequestIdPolicyName } from '@azure/core-rest-pipeline';
import {
  genRequestQueuesPolicy, genCombineGetRequestsPolicy, genErrorFormatterPolicy,
  parseBigIntPolicy, genVersionCheckPolicy, genRetryOnFailurePolicy,
} from './utils/autorest';
import { Middleware as MiddlewareApi, MiddlewareOptionalParams, ErrorResponse } from './apis/middleware';
import { operationSpecs } from './apis/middleware/middleware';
import { IllegalArgumentError, InternalError } from './utils/errors';
import { MiddlewarePage, isMiddlewareRawPage } from './utils/MiddlewarePage';

export default class Middleware extends MiddlewareApi {
  /**
   * @param url - Url for middleware API
   * @param options - Options
   * @param options.ignoreVersion - Don't ensure that the middleware is supported
   * @param options.retryCount - Amount of extra requests to do in case of failure
   * @param options.retryOverallDelay - Time in ms to wait between all retries
   */
  constructor(
    url: string,
    {
      ignoreVersion = false, retryCount = 3, retryOverallDelay = 800, ...options
    }: MiddlewareOptionalParams & {
      ignoreVersion?: boolean;
      retryCount?: number;
      retryOverallDelay?: number;
    } = {},
  ) {
    let version: string | undefined;
    const getVersion = async (opts: OperationOptions): Promise<string> => {
      if (version != null) return version;
      version = (await this.getStatus(opts)).mdwVersion;
      return version;
    };

    // eslint-disable-next-line constructor-super
    super(url, {
      allowInsecureConnection: true,
      additionalPolicies: [
        ...ignoreVersion ? [] : [
          genVersionCheckPolicy('middleware', getVersion, '1.81.0', '2.0.0'),
        ],
        genRequestQueuesPolicy(),
        genCombineGetRequestsPolicy(),
        genRetryOnFailurePolicy(retryCount, retryOverallDelay),
        genErrorFormatterPolicy((body: ErrorResponse) => ` ${body.error}`),
      ],
      ...options,
    });
    this.pipeline.addPolicy(parseBigIntPolicy, { phase: 'Deserialize' });
    this.pipeline.removePolicy({ name: userAgentPolicyName });
    this.pipeline.removePolicy({ name: setClientRequestIdPolicyName });
    // TODO: use instead our retry policy
    this.pipeline.removePolicy({ name: 'defaultRetryPolicy' });
  }

  /**
   * Get a middleware response by path instead of a method name and arguments.
   * @param pathWithQuery - a path to request starting with `/v3/`
   */
  async requestByPath<Response = unknown>(pathWithQuery: string): Promise<Response> {
    const queryPos = pathWithQuery.indexOf('?');
    const path = pathWithQuery.slice(0, queryPos === -1 ? pathWithQuery.length : queryPos);
    const query = pathWithQuery.slice(queryPos === -1 ? pathWithQuery.length : queryPos + 1);

    const operationSpec = operationSpecs.find((os) => {
      let p = path;
      if (os.path == null) return false;
      const groups = os.path.replace(/{\w+}/g, '{param}').split('{param}');
      while (groups.length > 0) {
        const part = groups.shift();
        if (part == null) throw new InternalError(`Unexpected operation spec path: ${os.path}`);
        if (!p.startsWith(part)) return false;
        p = p.replace(part, '');
        if (groups.length > 0) p = p.replace(/^[\w.]+/, '');
      }
      return p === '';
    });
    if (operationSpec == null) {
      throw new IllegalArgumentError(`Can't find operation spec corresponding to ${path}`);
    }

    return this.sendOperationRequest({}, {
      ...operationSpec,
      path,
      urlParameters: operationSpec.urlParameters
        ?.filter(({ parameterPath }) => parameterPath === '$host'),
      queryParameters: Array.from(new URLSearchParams(query)).map(([key, value]) => ({
        parameterPath: ['options', key],
        mapper: {
          defaultValue: value.toString(),
          serializedName: key,
          type: {
            name: 'String',
          },
        },
      })),
    });
  }

  override async sendOperationRequest<T>(
    operationArguments: OperationArguments,
    operationSpec: OperationSpec,
  ): Promise<T> {
    const response = await super.sendOperationRequest(operationArguments, operationSpec);
    if (!isMiddlewareRawPage(response)) return response as T;
    return new MiddlewarePage(response, this) as T;
  }
}
