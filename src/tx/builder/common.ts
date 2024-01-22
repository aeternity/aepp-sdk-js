import { decode as rlpDecode, encode as rlpEncode } from 'rlp';
import { Field, BinaryData } from './field-types';
import { ArgumentError, DecodeError, SchemaNotFoundError } from '../../utils/errors';
import {
  Encoding, Encoded, encode, decode,
} from '../../utils/encoder';
import { readInt } from './helpers';

type Schemas = ReadonlyArray<{
  tag: { constValue: number } & Field;
  version: { constValue: number } & Field;
}>;

export function getSchema(
  schemas: Schemas,
  Tag: { [key: number]: string },
  tag: number,
  version: number | undefined,
): Array<[string, Field]> {
  const subSchemas = schemas.filter((s) => s.tag.constValue === tag);
  if (subSchemas.length === 0) throw new SchemaNotFoundError(`${Tag[tag]} (${tag})`, 0);
  version ??= Math.max(...subSchemas.map((s) => s.version.constValue));
  const schema = subSchemas.find((s) => s.version.constValue === version);
  if (schema == null) throw new SchemaNotFoundError(`${Tag[tag]} (${tag})`, version);
  return Object.entries(schema);
}

export function packRecord<E extends Encoding>(
  schemas: Schemas,
  Tag: { [key: number]: string },
  params: {
    tag: number;
    version?: number;
    [k: string]: unknown;
  },
  extraParams: { [k: string]: unknown },
  encoding: E,
): Encoded.Generic<E> {
  const schema = getSchema(schemas, Tag, params.tag, params.version);
  const binary = schema.map(([key, field]) => (
    field.serialize(params[key], { ...params, ...extraParams }, params)
  ));
  return encode(rlpEncode(binary), encoding);
}

export function unpackRecord(
  schemas: Schemas,
  Tag: { [key: number]: string },
  encodedRecord: Encoded.Any,
  expectedTag: number | undefined,
  extraParams: { [k: string]: unknown },
): unknown {
  const binary = rlpDecode(decode(encodedRecord));
  const tag = +readInt(binary[0] as Buffer);
  const version = +readInt(binary[1] as Buffer);
  const schema = getSchema(schemas, Tag, tag, version);
  if (expectedTag != null && expectedTag !== tag) {
    throw new DecodeError(`Expected ${Tag[expectedTag]} tag, got ${Tag[tag]} instead`);
  }
  if (binary.length !== schema.length) {
    throw new ArgumentError('RLP length', schema.length, binary.length);
  }
  return Object.fromEntries(
    schema.map(([name, field], index) => [
      name, field.deserialize(binary[index] as BinaryData, extraParams),
    ]),
  );
}
