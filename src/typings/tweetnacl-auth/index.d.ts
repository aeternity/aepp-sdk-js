// TODO: remove after solving https://github.com/dchest/tweetnacl-auth-js/issues/3

declare module 'tweetnacl-auth' {
  interface Api {
    /**
     * Authenticates the given message with the secret key.
     * (In other words, returns HMAC-SHA-512-256 of the message under the key.)
     */
    (message: Uint8Array, key: Uint8Array): Uint8Array;
    /**
     * Returns HMAC-SHA-512 (without truncation) of the message under the key
     */
    full: (message: Uint8Array, key: Uint8Array) => Uint8Array;
  }

  const api: Api;

  export default api;
}
