import { Field } from './field-types';
import { UnionToIntersection } from '../../utils/other';

type NullablePartial<
  T,
  NK extends keyof T = { [K in keyof T]: undefined extends T[K] ? K : never }[keyof T],
> = Partial<Pick<T, NK>> & Omit<T, NK>;

type Or<A, B> = A extends undefined ? B : A;

type TxParamsBySchemaInternal<SchemaLine> =
  UnionToIntersection<
  SchemaLine extends ReadonlyArray<infer Elem>
    ? Elem extends readonly [string, Field]
      ? NullablePartial<{ [k in Elem[0]]: Parameters<Elem[1]['serialize']>[0] }>
      : never
    : never
  >;

type GetFieldOrEmpty<Object, Key extends string> =
  Object extends { [key in Key]: any } ? Object[Key] : {};

type TxParamsBySchemaInternalParams<SchemaLine> =
  GetFieldOrEmpty<
  UnionToIntersection<
  SchemaLine extends ReadonlyArray<infer Elem>
    ? Elem extends readonly [string, Field]
      ? { options: Or<Parameters<Elem[1]['serialize']>[2], {}> }
      : never
    : never
  >,
  'options'
  >;

type TxParamsBySchema<SchemaLine> =
  TxParamsBySchemaInternal<SchemaLine> & TxParamsBySchemaInternalParams<SchemaLine>;

type TxParamsAsyncBySchemaInternal<SchemaLine> =
  UnionToIntersection<
  SchemaLine extends ReadonlyArray<infer Elem>
    ? Elem extends readonly [string, Field & { prepare: Function }]
      ? NullablePartial<{ [k in Elem[0]]: Parameters<Elem[1]['prepare']>[0] }>
      : TxParamsBySchemaInternal<[Elem]>
    : never
  >;

type TxParamsAsyncBySchemaInternalParams<SchemaLine> =
  GetFieldOrEmpty<
  UnionToIntersection<
  SchemaLine extends ReadonlyArray<infer Elem>
    ? Elem extends readonly [string, Field & { prepare: Function }]
      ? { options: Or<Parameters<Elem[1]['prepare']>[2], {}> } : {}
    : never
  >,
  'options'
  >;

type TxParamsAsyncBySchema<SchemaLine> =
  TxParamsAsyncBySchemaInternal<SchemaLine>
  & TxParamsAsyncBySchemaInternalParams<SchemaLine>
  & TxParamsBySchemaInternalParams<SchemaLine>;

type TxUnpackedBySchema<SchemaLine> =
  UnionToIntersection<
  SchemaLine extends ReadonlyArray<infer Elem>
    ? Elem extends readonly [string, Field]
      ? { [k in Elem[0]]: ReturnType<Elem[1]['deserialize']> }
      : never
    : never
  >;

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
