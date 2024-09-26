export default function withFormatting<Input, Output, Binary, Params, Options>(
  format: (v: Input | undefined) => Input,
  field: {
    serialize: (value: Input, params: Params, options: Options) => Binary;
    deserialize: (value: Binary) => Output;
  },
): {
  serialize: (value: Input | undefined, params: Params, options: Options) => Binary;
  deserialize: (value: Binary) => Output;
} {
  return {
    ...field,

    serialize(value, params, options) {
      return field.serialize(format(value), params, options);
    },
  };
}
