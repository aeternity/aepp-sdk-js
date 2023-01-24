export default function genArrayField<Input, Output, Binary>(
  itemHandler: {
    serialize: (value: Input, params: unknown) => Binary;
    deserialize: (value: Binary, params: unknown) => Output;
  },
): {
    serialize: (value: readonly Input[], params: unknown) => Binary[];
    deserialize: (value: Binary[], params: unknown) => Output[];
  } {
  return {
    serialize(items, params) {
      return items.map((item) => itemHandler.serialize(item, params));
    },

    deserialize(buffers, params) {
      return buffers.map((buffer) => itemHandler.deserialize(buffer, params));
    },
  };
}
