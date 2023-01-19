import { describe, it } from 'mocha';
import { expect } from 'chai';
import SchemaTypes from '../../src/tx/builder/SchemaTypes';

describe('Schema', () => {
  it('types correct', () => {
    const required = {
      serialize: (a: number): Buffer => Buffer.from([a]),
      deserialize: (a: Buffer): number => a[0],
    };
    const schema = {
      12: {
        4: [
          ['required', required],
          ['optional', {
            ...required,
            serialize: (a?: number): Buffer => Buffer.from([a ?? 0]),
          }],
        ],
        6: [
          ['required', required],
          ['required2', required],
        ],
        8: [
          ['options', {
            ...required,
            serialize: (a: number, _: {}, { incBy }: { incBy: number }): Buffer => (
              Buffer.from([a + incBy])
            ),
          }],
        ],
        10: [
          ['prepare', {
            ...required,
            serialize: (a: number, _: {}, { incBy }: { incBy: number }): Buffer => (
              Buffer.from([a + incBy])
            ),
            prepare: async (a: number, _: {}, { mulBy }: { mulBy: number }): Promise<number> => (
              a * mulBy
            ),
          }],
        ],
      },
    } as const;
    type Schema = SchemaTypes<typeof schema>;
    type TxParams = Schema['TxParams'];
    type TxParamsAsync = Schema['TxParamsAsync'];
    type TxUnpacked = Schema['TxUnpacked'];

    let txParams: TxParams;
    // @ts-expect-error passing an undefined property
    txParams = { missed: 42 }; expect(txParams);
    txParams = { required: 42 }; expect(txParams);
    // @ts-expect-error missing required property
    txParams = { required2: 42 }; expect(txParams);
    txParams = { required: 42, optional: 43 }; expect(txParams);
    txParams = { options: 41, incBy: 10 }; expect(txParams);
    // @ts-expect-error prepare options missed in sync params
    txParams = { prepare: 41, incBy: 10, mulBy: 2 }; expect(txParams);

    let txParamsAsync: TxParamsAsync;
    // @ts-expect-error passing an undefined property
    txParamsAsync = { missed: 42 }; expect(txParamsAsync);
    txParamsAsync = { required: 42 }; expect(txParamsAsync);
    // @ts-expect-error missing required property
    txParamsAsync = { required2: 42 }; expect(txParamsAsync);
    txParamsAsync = { required: 42, optional: 43 }; expect(txParamsAsync);
    txParamsAsync = { options: 41, incBy: 10 }; expect(txParamsAsync);
    txParamsAsync = { prepare: 41, incBy: 10, mulBy: 2 }; expect(txParamsAsync);

    let txUnpacked: TxUnpacked;
    // @ts-expect-error passing an undefined property
    txUnpacked = { missed: 42 }; expect(txUnpacked);
    // @ts-expect-error optional is required in unpacked
    txUnpacked = { required: 42 }; expect(txUnpacked);
    // @ts-expect-error missing required property
    txUnpacked = { required2: 42 }; expect(txUnpacked);
    txUnpacked = { required: 42, optional: 43 }; expect(txUnpacked);
    // @ts-expect-error options missed in unpacked
    txUnpacked = { options: 41, incBy: 10 }; expect(txUnpacked);
    // @ts-expect-error prepare options missed in unpacked
    txUnpacked = { prepare: 41, incBy: 10, mulBy: 2 }; expect(txUnpacked);
  });
});
