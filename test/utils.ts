import BigNumber from 'bignumber.js';
import { expect } from 'chai';
import { AensName } from '../src';

export function randomString(len: number): string {
  const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let string = '';
  for (let i = 0; i < len; i += 1) {
    const randomPoz = Math.floor(Math.random() * charSet.length);
    string += charSet.charAt(randomPoz);
  }
  return string;
}

export function randomName(length: number = 15): AensName {
  return `${randomString(length)}.chain`;
}

export function assertNotNull(value: any): asserts value {
  expect([undefined, null]).to.not.include(value);
}

export function ensureEqual<T>(value: any, equalTo: T): asserts value is T {
  expect(value).to.be.equal(equalTo);
}

export type ChainTtl = { FixedTTL: [bigint] }
| { RelativeTTL: [bigint] } | { AbsoluteTTL: [bigint] };

export type InputNumber = number | bigint | string | BigNumber;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function checkOnlyTypes(cb: Function): void {}
