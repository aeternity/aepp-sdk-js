export default function withDefault<Input, Output, Binary>(
  defaultValue: Input,
  field: {
    serialize: (value: Input, params: unknown) => Binary;
    deserialize: (value: Binary, params: unknown) => Output;
  },
): {
  serialize: (value: Input | undefined, params: unknown) => Binary;
  deserialize: (value: Binary, params: unknown) => Output;
} {
  return {
    ...field,

    serialize(value, params) {
      return field.serialize(value ?? defaultValue, params);
    },
  };
}
