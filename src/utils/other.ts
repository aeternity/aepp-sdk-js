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
 * @param key - Object key
 * @param object - object
 */
export function isKeyOfObject<T>(
  key: string | number | symbol,
  object: T,
): key is keyof T {
  return key in object;
}
