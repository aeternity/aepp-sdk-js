// js extension is required for mjs build
// @ts-expect-error see https://github.com/aeternity/aepp-calldata-js/issues/216
// eslint-disable-next-line import/extensions
import ContractByteArrayEncoder from '@aeternity/aepp-calldata/src/ContractByteArrayEncoder.js';
// @ts-expect-error see https://github.com/aeternity/aepp-calldata-js/issues/216
// eslint-disable-next-line import/extensions
import AciTypeResolver from '@aeternity/aepp-calldata/src/AciTypeResolver.js';
import canonicalize from 'canonicalize';
import { Encoded, decode } from './encoder';
import { hash, messagePrefixLength } from './crypto';
import { concatBuffers } from './other';

/**
 * Hashes arbitrary object, can be used to inline the aci hash to contract source code
 */
export function hashJson(data: unknown): Buffer {
  return hash(canonicalize(data) ?? '');
}

// TODO: move this type to calldata library https://github.com/aeternity/aepp-calldata-js/issues/215
// based on https://github.com/aeternity/aepp-calldata-js/blob/82b5a98f9b308482627da8d7484d213e9cf87151/src/AciTypeResolver.js#L129
export type AciValue = 'void' | 'unit' | 'int' | 'bool' | 'string' | 'bits' | 'hash' | 'signature'
| 'address' | 'contract_pubkey' | 'Chain.ttl' | 'Chain.ga_meta_tx' | 'Chain.paying_for_tx'
| 'Chain.base_tx' | 'AENS.pointee' | 'AENS.name' | 'MCL_BLS12_381.fr' | 'MCL_BLS12_381.fp'
| { 'Set.set': readonly [AciValue] }
| { bytes: number }
| { list: readonly [AciValue] }
| { map: readonly [AciValue, AciValue] }
| { tuple: readonly AciValue[] }
| { record: ReadonlyArray<{ name: string; type: AciValue }> }
| { variant: ReadonlyArray<{ [key: string]: readonly AciValue[] }> }
| { option: readonly [AciValue] }
| { oracle: readonly [AciValue, AciValue] }
| { oracle_query: readonly [AciValue, AciValue] };

export interface Domain {
  name?: string;
  version?: number;
  networkId?: string;
  contractAddress?: Encoded.ContractAddress;
}

// TODO: replace with api on calldata side https://github.com/aeternity/aepp-calldata-js/issues/216
export function encodeFateValue(
  value: unknown,
  aci: AciValue,
): Encoded.ContractBytearray {
  const contractByteArrayEncoder = new ContractByteArrayEncoder();
  const aciTypeResolver = new AciTypeResolver([]);
  aciTypeResolver.isCustomType = () => false;
  return contractByteArrayEncoder.encode(aciTypeResolver.resolveType(aci), value);
}

// TODO: replace with api on calldata side https://github.com/aeternity/aepp-calldata-js/issues/216
export function decodeFateValue(
  value: Encoded.ContractBytearray,
  aci: AciValue,
): Encoded.ContractBytearray {
  const contractByteArrayEncoder = new ContractByteArrayEncoder();
  const aciTypeResolver = new AciTypeResolver([]);
  aciTypeResolver.isCustomType = () => false;
  return contractByteArrayEncoder.decodeWithType(value, aciTypeResolver.resolveType(aci));
}

/**
 * Hashes domain object, can be used to inline domain hash to contract source code
 */
export function hashDomain(domain: Domain): Buffer {
  const domainAci = {
    record: [{
      name: 'name',
      type: { option: ['string'] },
    }, {
      name: 'version',
      type: { option: ['int'] },
    }, {
      name: 'networkId',
      type: { option: ['string'] },
    }, {
      name: 'contractAddress',
      type: { option: ['contract_pubkey'] },
    }],
  } as const;
  return hash(decode(encodeFateValue(domain, domainAci)));
}

export function hashTypedData(
  data: Encoded.ContractBytearray,
  aci: AciValue,
  domain: Domain,
): Buffer {
  return hash(concatBuffers([
    messagePrefixLength, new Uint8Array([0]), hashDomain(domain), hashJson(aci), hash(decode(data)),
  ]));
}
