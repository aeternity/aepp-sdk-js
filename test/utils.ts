import BigNumber from 'bignumber.js';
import { expect } from 'chai';
import { AensName, Node } from '../src';

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

export function assertNotNull<T>(value: T): asserts value is NonNullable<T> {
  expect([undefined, null]).to.not.include(value);
}

export function ensureEqual<T>(value: any, equalTo: T): asserts value is T {
  expect(value).to.equal(equalTo);
}

type Cls = abstract new (...args: any) => any;

export function ensureInstanceOf<T extends Cls>(
  value: any,
  cls: T,
): asserts value is InstanceType<T> {
  expect(value).to.be.an.instanceOf(cls);
}

export type ChainTtl =
  | { FixedTTL: [bigint] }
  | { RelativeTTL: [bigint] }
  | { AbsoluteTTL: [bigint] };

export type InputNumber = number | bigint | string | BigNumber;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function checkOnlyTypes(cb: Function): void {}

export function bindRequestTracker(node: Node): () => string[] {
  const name = `tracker-${randomString(6)}`;
  const requestUrls: string[] = [];
  node.pipeline.addPolicy(
    {
      name,
      async sendRequest(request, next) {
        requestUrls.push(request.url);
        return next(request);
      },
    },
    { phase: 'Deserialize' },
  );
  return () => {
    node.pipeline.removePolicy({ name });
    return requestUrls;
  };
}

export function bindRequestCounter(
  node: Node,
): (params?: { filter?: string[]; exclude?: string[] }) => number {
  const getRequestUrls = bindRequestTracker(node);
  return ({ filter = [], exclude = [] } = {}) =>
    getRequestUrls()
      .filter((url) => !exclude.some((p) => url.includes(p)))
      .filter((url) => filter.length === 0 || filter.some((p) => url.includes(p))).length;
}

export function indent(strings: TemplateStringsArray, ...values: unknown[]): string {
  const code = String.raw({ raw: strings }, ...values);
  const lines = code.split('\n');
  if (lines[0] === '') lines.shift();
  const spaces = lines[0].split('').findIndex((c) => c != ' ');
  return lines
    .map((line) => {
      if (line === '') return line;
      if (line.slice(0, spaces) !== ' '.repeat(spaces)) {
        throw new Error(`Unexpected formatting: "${line.slice(0, spaces)}"`);
      }
      return line.slice(spaces);
    })
    .join('\n');
}
