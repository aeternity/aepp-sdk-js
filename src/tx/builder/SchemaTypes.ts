import { Field as OriginalField } from './field-types';
import { UnionToIntersection } from '../../utils/other';

// TODO: figure out why this override is necessary
export interface Field extends OriginalField {
  serialize: (...args: any[]) => any;
}

type NullablePartial<
  T,
  NK extends keyof T = { [K in keyof T]: undefined extends T[K] ? K : never }[keyof T],
> = Partial<Pick<T, NK>> & Omit<T, NK>;

type Or<A, B> = A extends undefined ? B : A;

type TxParamsBySchemaInternal<SchemaItem> = {
  -readonly [key in keyof SchemaItem]: SchemaItem[key] extends Field
    ? Parameters<SchemaItem[key]['serialize']>[0]
    : never;
};

type TxParamsBySchemaInternalParams<
  SchemaItem,
  SchemaItemValues = SchemaItem[keyof SchemaItem],
> = UnionToIntersection<
SchemaItemValues extends Field
  ? Or<Parameters<SchemaItemValues['serialize']>[2], {}> : never
>;

type PickIsRec<SchemaItem, Recursive extends boolean> = {
  [Key in keyof SchemaItem
  as SchemaItem[Key] extends Field & { recursiveType: true }
    ? (Recursive extends true ? Key : never)
    : (Recursive extends true ? never : Key)]: SchemaItem[Key];
};

type TxParamsBySchema<SchemaItem> = SchemaItem extends Object
  ? TxParamsBySchemaInternal<PickIsRec<SchemaItem, true>> &
  NullablePartial<TxParamsBySchemaInternal<PickIsRec<SchemaItem, false>>> &
  TxParamsBySchemaInternalParams<PickIsRec<SchemaItem, false>>
  : never;

type TxParamsAsyncBySchemaInternal<SchemaItem> = {
  -readonly [key in keyof SchemaItem]: SchemaItem[key] extends Field & { prepare: Function }
    ? Parameters<SchemaItem[key]['prepare']>[0]
    : SchemaItem[key] extends Field
      ? Parameters<SchemaItem[key]['serialize']>[0]
      : never;
};

type TxParamsAsyncBySchemaInternalParams<
  SchemaItem,
  SchemaItemValues = SchemaItem[keyof SchemaItem],
> = UnionToIntersection<
SchemaItemValues extends Field & { prepare: Function }
  ? Or<Parameters<SchemaItemValues['prepare']>[2], {}> : {}
>;

type TxParamsAsyncBySchema<SchemaItem> = SchemaItem extends Object
  ? TxParamsAsyncBySchemaInternal<PickIsRec<SchemaItem, true>>
  & NullablePartial<TxParamsAsyncBySchemaInternal<PickIsRec<SchemaItem, false>>>
  & TxParamsAsyncBySchemaInternalParams<PickIsRec<SchemaItem, false>>
  & TxParamsBySchemaInternalParams<PickIsRec<SchemaItem, false>>
  : never;

type TxUnpackedBySchema<SchemaItem> = {
  -readonly [key in keyof SchemaItem]: SchemaItem[key] extends Field
    ? ReturnType<SchemaItem[key]['deserialize']>
    : never;
};

export default interface SchemaTypes<
  Schema extends readonly any[],
  SchemaItems = Schema[number],
> {
  TxParams: TxParamsBySchema<SchemaItems>;
  TxParamsAsync: TxParamsAsyncBySchema<SchemaItems>;
  TxUnpacked: TxUnpackedBySchema<SchemaItems>;
}
