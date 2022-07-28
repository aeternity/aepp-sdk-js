// TODO: remove after solving https://github.com/axic/bip32-path/issues/5

declare module 'bip32-path' {
  interface BipPath {
    toPathArray: () => number[];
    /**
     * returns a text encoded path. Set to noRoot to true to omit the m/ prefix.
     * Set oldStyle true to use h instead of ' for marking hardened nodes.
     */
    toString: (noRoot: boolean, oldStyle: boolean) => string;

    /**
     * returns true if the input is a valid path string
     */
    validateString: (path: string) => boolean;

    /**
     * returns true if the input is a valid binary path array
     */
    validatePathArray: (path: string) => boolean;
  }

  /**
   * creates an instance from a path written as text.
   * Set reqRoot to true if the m/ prefix is mandatory.
   */
  export const fromString: (text: string, reqRoot?: boolean) => BipPath;

  /**
   * creates an instance from a binary path array
   */
  export const fromPathArray: (path: string) => BipPath;
}
