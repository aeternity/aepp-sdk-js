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

type TxParamsBySchema<SchemaItem> =
  TxParamsBySchemaInternal<SchemaItem> & TxParamsBySchemaInternalParams<SchemaItem>;

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
  ? Or<Parameters<SchemaItemValues['prepare']>[2], {}> : never
>;

type TxParamsAsyncBySchema<SchemaItem> =
  TxParamsAsyncBySchemaInternal<SchemaItem>
  & TxParamsAsyncBySchemaInternalParams<SchemaItem>
  & TxParamsBySchemaInternalParams<SchemaItem>;

type TxUnpackedBySchema<SchemaItem> = {
  -readonly [key in keyof SchemaItem]: SchemaItem[key] extends Field
    ? ReturnType<SchemaItem[key]['deserialize']>
    : never;
};

type TxNotCombined<Schema, Mode extends 'params' | 'params-async' | 'unpacked'> = {
  [tag in keyof Schema]: {
    [ver in keyof Schema[tag]]: Mode extends 'params'
      ? TxParamsBySchema<Schema[tag][ver]>
      : Mode extends 'params-async'
        ? TxParamsAsyncBySchema<Schema[tag][ver]>
        : Mode extends 'unpacked'
          ? TxUnpackedBySchema<Schema[tag][ver]>
          : never
  }
};

type ConvertToUnion<Schema> = {
  [key in keyof Schema]: Schema[key][keyof Schema[key]]
}[keyof Schema];

export default interface SchemaTypes<Schema> {
  TxParams: ConvertToUnion<TxNotCombined<Schema, 'params'>>;
  TxParamsAsync: ConvertToUnion<TxNotCombined<Schema, 'params-async'>>;
  TxUnpacked: ConvertToUnion<TxNotCombined<Schema, 'unpacked'>>;
}
