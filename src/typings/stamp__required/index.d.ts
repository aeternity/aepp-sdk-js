/* eslint-disable @typescript-eslint/no-invalid-void-type */
/* eslint-disable max-len */

declare module '@stamp/required' {
  import { Stamp } from '@stamp/compose'
  import stampit from '@stamp/it'
  type StampMethodRequired = (this: Stamp | void, settings: stampit.Composable) => Stamp | stampit.Composable
  export const required: StampMethodRequired
}
