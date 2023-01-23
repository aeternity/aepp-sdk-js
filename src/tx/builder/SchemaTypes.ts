import { Field } from './field-types';
import { UnionToIntersection } from '../../utils/other';

type NullablePartial<
  T,
  NK extends keyof T = { [K in keyof T]: undefined extends T[K] ? K : never }[keyof T],
> = Partial<Pick<T, NK>> & Omit<T, NK>;

type Or<A, B> = A extends undefined ? B : A;

type TxParamsBySchemaInternal<SchemaItem> = NullablePartial<{
  -readonly [key in keyof SchemaItem]: SchemaItem[key] extends Field
    ? Parameters<SchemaItem[key]['serialize']>[0]
    : never;
}>;

type TxParamsBySchemaInternalParams<
  SchemaItem,
  SchemaItemValues = SchemaItem[keyof SchemaItem],
> = UnionToIntersection<
SchemaItemValues extends Field
  ? Or<Parameters<SchemaItemValues['serialize']>[2], {}> : never
>;

type TxParamsBySchema<SchemaItem> = SchemaItem extends Object
  ? TxParamsBySchemaInternal<SchemaItem> & TxParamsBySchemaInternalParams<SchemaItem> : never;

type TxParamsAsyncBySchemaInternal<SchemaItem> = NullablePartial<{
  -readonly [key in keyof SchemaItem]: SchemaItem[key] extends Field & { prepare: Function }
    ? Parameters<SchemaItem[key]['prepare']>[0]
    : SchemaItem[key] extends Field
      ? Parameters<SchemaItem[key]['serialize']>[0]
      : never;
}>;

type TxParamsAsyncBySchemaInternalParams<
  SchemaItem,
  SchemaItemValues = SchemaItem[keyof SchemaItem],
> = UnionToIntersection<
SchemaItemValues extends Field & { prepare: Function }
  ? Or<Parameters<SchemaItemValues['prepare']>[2], {}> : {}
>;

type TxParamsAsyncBySchema<SchemaItem> = SchemaItem extends Object
  ? TxParamsAsyncBySchemaInternal<SchemaItem>
  & TxParamsAsyncBySchemaInternalParams<SchemaItem>
  & TxParamsBySchemaInternalParams<SchemaItem>
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
