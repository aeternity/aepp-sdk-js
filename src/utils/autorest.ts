import { RestError, PipelineResponse } from '@azure/core-rest-pipeline'
import { AdditionalPolicyConfig } from '@azure/core-client'
import { pause } from './other'

export const genRequestQueuesPolicy = (): AdditionalPolicyConfig => {
  const requestQueues = new Map<string, Promise<unknown>>()

  return {
    policy: {
      name: 'request-queues',
      async sendRequest (request, next) {
        const key = request.headers.get('__queue')
        request.headers.delete('__queue')
        const getResponse = async (): Promise<PipelineResponse> => await next(request)
        if (key == null) return await getResponse()
        const req = (requestQueues.get(key) ?? Promise.resolve()).then(getResponse, getResponse)
        // TODO: remove after fixing https://github.com/aeternity/aeternity/issues/3803
        // gap to ensure that node won't reject the nonce
        requestQueues.set(key, req.then(async () => await pause(750)))
        return await req
      }
    },
    position: 'perCall'
  }
}

export const genCombineGetRequestsPolicy = (): AdditionalPolicyConfig => {
  const pendingGetRequests = new Map<string, Promise<PipelineResponse>>()

  return {
    policy: {
      name: 'combine-requests',
      async sendRequest (request, next) {
        if (request.method !== 'GET') return await next(request)
        const key = JSON.stringify([request.url, request.body])
        const response = pendingGetRequests.get(key) ?? next(request)
        pendingGetRequests.set(key, response)
        try {
          return await response
        } finally {
          pendingGetRequests.delete(key)
        }
      }
    },
    position: 'perCall'
  }
}

export const genErrorFormatterPolicy = (
  getMessage: (b: any) => string
): AdditionalPolicyConfig => ({
  policy: {
    name: 'error-formatter',
    async sendRequest (request, next) {
      try {
        return await next(request)
      } catch (error) {
        if (!(error instanceof RestError) || error.request == null) throw error
        if (error.response?.bodyAsText == null) throw error

        let body
        try {
          body = JSON.parse(error.response.bodyAsText)
        } catch (e) {
          throw error
        }
        error.message = `${new URL(error.request.url).pathname.slice(1)} error`
        const message = getMessage(body)
        if (message !== '') error.message += `:${message}`
        throw error
      }
    }
  },
  position: 'perCall'
})
