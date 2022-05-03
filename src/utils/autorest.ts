import { RestError } from '@azure/core-rest-pipeline'
import { AdditionalPolicyConfig } from '@azure/core-client'

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
