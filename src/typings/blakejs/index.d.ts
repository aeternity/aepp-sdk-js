declare module 'blakejs/blake2b.js' {
  interface Context {
    b: Uint8Array;
    h: Uint32Array;
    t: number;
    c: number;
    outlen: number;
  }

  export type Data = Buffer | Uint8Array | string;

  type Key = Uint8Array | null;

  export const blake2b: (data: Data, key?: Key, outlen?: number) => Uint8Array;

  export const blake2bFinal: (context: Context) => Uint8Array;

  export const blake2bHex: (data: Data, key?: Key, outlen?: number) => string;

  export const blake2bInit: (outlen?: number, key?: Key) => Context;

  export const blake2bUpdate: (context: Context, data: Data) => void;
}
