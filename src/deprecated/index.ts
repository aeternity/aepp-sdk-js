export * from './methods';

/**
 * @deprecated use NamePointer from apis/node instead
 * @hidden
 */
export interface Pointer {
  key: string;
  id: string;
}

/**
 * @deprecated use genSalt instead
 * @hidden
 */
export function salt(): number {
  return Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER));
}

/**
 * @deprecated use genSalt instead
 * @hidden
 */
export const createSalt = salt;
