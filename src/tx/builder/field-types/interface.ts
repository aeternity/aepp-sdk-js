export type BinaryData =
  | Buffer
  | Buffer[]
  | Buffer[][]
  | Array<[Buffer, Array<[Buffer, Buffer[]]>]>;

export interface Field {
  serialize: (value: any, options: any, parameters: any) => BinaryData;
  prepare?: (value: any, options: any, parameters: any) => Promise<any>;
  deserialize: (value: BinaryData, options: any) => any;
  recursiveType?: boolean;
}
