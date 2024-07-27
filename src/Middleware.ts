import { OperationOptions } from '@azure/core-client';
import { userAgentPolicyName, setClientRequestIdPolicyName } from '@azure/core-rest-pipeline';
import {
  genRequestQueuesPolicy, genCombineGetRequestsPolicy, genErrorFormatterPolicy,
  parseBigIntPolicy, genVersionCheckPolicy, genRetryOnFailurePolicy,
} from './utils/autorest';
import { Middleware as MiddlewareApi, MiddlewareOptionalParams, ErrorResponse } from './apis/middleware';

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
}
