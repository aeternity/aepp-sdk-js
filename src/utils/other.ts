import { RestError } from '@azure/core-rest-pipeline';

export const pause = async (duration: number): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve, duration);
});

export const mapObject = <InputV, OutputV>(
  object: { [k: string]: InputV },
  fn: (
    value: [string, InputV], index: number, array: Array<[string, InputV]>
  ) => [number | string, OutputV],
): { [k: string]: OutputV } => Object.fromEntries(Object.entries(object).map(fn));

// remove after dropping webpack4 support
const isWebpack4Buffer = (() => {
  try {
    Buffer.concat([Uint8Array.from([])]);
    return false;
  } catch (error) {
    return true;
  }
})();

export const concatBuffers = isWebpack4Buffer
  ? (list: readonly Uint8Array[], totalLength?: number): Buffer => (
    Buffer.concat(list.map((el) => Buffer.from(el)), totalLength)
  )
  : Buffer.concat;

/**
 * Object key type guard
 * @param key - Maybe object key
 * @param object - Object
 */
export function isKeyOfObject<T extends object>(
  key: string | number | symbol,
  object: T,
): key is keyof T {
  return key in object;
}

/**
 * Array item type guard
 * @param item - Maybe array item
 * @param array - Array
 */
export function isItemOfArray<T>(item: any, array: readonly T[]): item is T {
  return array.includes(item);
}

export function isAccountNotFoundError(error: Error): boolean {
  return error instanceof RestError && error.statusCode === 404
    && error.message.includes('Account not found');
}

// based on https://stackoverflow.com/a/50375286/6176994
export type UnionToIntersection<Union> =
  (Union extends any ? (k: Union) => void : never) extends ((k: infer Intersection) => void)
    ? Intersection : never;

export function ensureError(error: unknown): asserts error is Error {
  if (error instanceof Error) return;
  throw error;
}
