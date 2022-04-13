interface SomeFunction {
  (): unknown
  compose?: unknown
}

declare module '@stamp/is' {
  export const isStamp: <T extends object = object>(value: unknown) => value is T
  export const isFunction: <T extends Function = SomeFunction>(value: unknown) => value is T
  export const isDescriptor: (value: unknown) => value is object
  export const isComposable: (value: unknown) => value is object
  export const isObject: (value: unknown) => value is object
  export const isPlainObject: (value: unknown) => value is {}
  export const isArray: (arg: any) => arg is any[]
  export const isString: (value: unknown) => value is string
}
