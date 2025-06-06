import '..';
import { describe, it } from 'mocha';
import { assert, expect } from 'chai';
import { encodeVarUInt } from '../../src/utils/crypto';
import {
  buildTxHash,
  decode,
  Encoded,
  verifyMessageSignature,
  isEncoded,
  hash,
  genSalt,
  verifySignature,
  hashMessage,
  Encoding,
} from '../../src';

const address = 'ak_Gd6iMVsoonGuTF8LeswwDDN2NF5wYHAoTRtzwdEcfS32LWoxm';

const txBinaryAsArray = [
  248, 76, 12, 1, 160, 35, 120, 248, 146, 183, 204, 130, 194, 210, 115, 158, 153, 78, 201, 149, 58,
  163, 100, 97, 241, 235, 90, 74, 73, 165, 176, 222, 23, 179, 210, 58, 232, 160, 63, 40, 35, 12, 40,
  65, 38, 215, 218, 236, 136, 133, 42, 120, 160, 179, 18, 191, 241, 162, 198, 203, 209, 173, 89,
  136, 202, 211, 158, 59, 12, 122, 1, 1, 1, 132, 84, 101, 115, 116,
];
const txBinary = Buffer.from(txBinaryAsArray);
const signatureAsArray = [
  95, 146, 31, 37, 95, 194, 36, 76, 58, 49, 167, 156, 127, 131, 142, 248, 25, 121, 139, 109, 59,
  243, 203, 205, 16, 172, 115, 143, 254, 236, 33, 4, 43, 46, 16, 190, 46, 46, 140, 166, 76, 39, 249,
  54, 38, 27, 93, 159, 58, 148, 67, 198, 81, 206, 106, 237, 91, 131, 27, 14, 143, 178, 130, 2,
];
const signature = Buffer.from(signatureAsArray);

const txRaw =
  "tx_+QTlCwH4QrhA4xEWFIGZUVn0NhnYl9TwGX30YJ9/Y6x6LHU6ALfiupJPORvjbiUowrNgLtKnvt7CvtweY0N/THhwn8WUlPJfDrkEnPkEmSoBoQFj/aG9TnbDDSLtstOaR3E1i0Tcexu1UutStbkmXRBdzAG5A/j5A/VGAqAmKh8Xm79E6zTwogrUezzUmpJlC5Cdjc1KXtWLnJIrbvkC+/kBKqBo8mdjOP9QiDmrpHdJ7/qL6H7yhPIH+z2ZmHAc1TiHxYRtYWluuMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoP//////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC4QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD5AcuguclW8osxSan1mHqlBfPaGyIJzFc5I0AGK7bBvZ+fmeqEaW5pdLhgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA///////////////////////////////////////////uQFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQD//////////////////////////////////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////////////////////////////////+4zGIAAGRiAACEkYCAgFF/uclW8osxSan1mHqlBfPaGyIJzFc5I0AGK7bBvZ+fmeoUYgAAwFdQgFF/aPJnYzj/UIg5q6R3Se/6i+h+8oTyB/s9mZhwHNU4h8UUYgAAr1dQYAEZUQBbYAAZWWAgAZCBUmAgkANgA4FSkFlgAFFZUmAAUmAA81tgAIBSYADzW1lZYCABkIFSYCCQA2AAGVlgIAGQgVJgIJADYAOBUoFSkFZbYCABUVFZUICRUFCAkFCQVltQUIKRUFBiAACMVoUzLjIuMIMEAAGGWa0Z+ZAAAAQBgxgX+IQ7msoAuGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAILnJVvKLMUmp9Zh6pQXz2hsiCcxXOSNABiu2wb2fn5nqAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB95HF6'";
const expectedHash = 'th_HZMNgTvEiyKeATpauJjjeWwZcyHapKG8bDgy2S1sCUEUQnbwK';

describe('crypto', () => {
  describe('encodeVarUInt', () =>
    (
      [
        ['1 byte', 42, '2A'],
        ['2 bytes', 59886, 'fdeee9'],
        ['4 bytes', 526697443, 'fee3c3641f'],
        ['7 bytes', 3236795759157736, 'ffe8616f3dd97f0b00'],
        ['MAX_SAFE_INTEGER', Number.MAX_SAFE_INTEGER, 'ffffffffffffff1f00'],
      ] as const
    ).forEach(([name, value, expected]) => {
      it(`encodes ${name}`, () => {
        expect(encodeVarUInt(value)).to.eql(Buffer.from(expected, 'hex'));
      });
    }));

  describe('isEncoded', () => {
    it('rejects invalid encoded data', () => {
      expect(isEncoded('test')).to.equal(false);
      expect(
        isEncoded('th_11111111111111111111111111111111273Yts', Encoding.AccountAddress),
      ).to.equal(false);
      expect(isEncoded('ak_11111111111111111111111111111111273Yts', Encoding.TxHash)).to.equal(
        false,
      );
    });

    it('returns true for a valid address', () => {
      const maybeValue: string = 'ak_11111111111111111111111111111111273Yts';
      const result = isEncoded(maybeValue, Encoding.AccountAddress);
      expect(result).to.equal(true);
      // @ts-expect-error `result` is not checked yet
      let value: Encoded.AccountAddress = maybeValue;
      if (result) value = maybeValue;
      expect(value);
    });

    it('correctly checks against multiple encodings', () => {
      const maybeValue: string = 'th_HZMNgTvEiyKeATpauJjjeWwZcyHapKG8bDgy2S1sCUEUQnbwK';
      const result = isEncoded(maybeValue, Encoding.Name, Encoding.TxHash);
      expect(result).to.equal(true);
      // @ts-expect-error `result` is not checked yet
      let value: Encoded.Name | Encoded.TxHash = maybeValue;
      if (result) value = maybeValue;
      expect(value);
    });
  });

  describe('verify', () => {
    it('should verify tx with correct signature', () => {
      const result = verifySignature(txBinary, signature, address);
      assert.isTrue(result);
    });
  });

  describe('messages', () => {
    const message = 'test';
    const messageSignatureAsHex =
      'c910daedceebb658f49ad862b2032e6b455143ebc1d698e9018ac4cf2d76f65fefda254893b0f56203b4cef1ff549f72ef155d58792fd52d0c1b6e210525e207';
    const messageSignature = Buffer.from(messageSignatureAsHex, 'hex');

    const messageNonASCII = 'tæst';
    const messageNonASCIISignatureAsHex =
      'faa1bdb8a88c529be904036382705ed207bbdde00ece3bdb541f5986d57aebe7babe315a4d95f5882165c28bf41f6149430509ded1cc7dcd9b134e0e1d73cd0b';
    const messageNonASCIISignature = Buffer.from(messageNonASCIISignatureAsHex, 'hex');

    const longMessage = 'test'.repeat(256);
    const longMessageHash = Buffer.from('J9bibOHrlicf0tYQxe1lW69LdDAxETwPmrafKjjQwvs=', 'base64');

    it('calculates a hash of a long message', () =>
      expect(hashMessage(longMessage)).to.eql(longMessageHash));

    describe('verify', () => {
      it('should verify message', () => {
        const result = verifyMessageSignature(message, messageSignature, address);
        assert.isTrue(result);
      });

      it('should verify message with non-ASCII chars', () => {
        const result = verifyMessageSignature(messageNonASCII, messageNonASCIISignature, address);
        assert.isTrue(result);
      });
    });
  });

  it('hashing produces 256 bit blake2b byte buffers', () => {
    const h = hash('foobar');
    expect(h).to.be.a('Uint8Array');
    expect(Buffer.from(h).toString('hex')).to.equal(
      '93a0e84a8cdd4166267dbe1263e937f08087723ac24e7dcc35b3d5941775ef47',
    );
  });

  it('salt produces random sequences every time', () => {
    const salt1 = genSalt();
    const salt2 = genSalt();
    expect(salt1).to.be.a('Number');
    expect(salt2).to.be.a('Number');
    expect(salt1).to.not.be.equal(salt2);
  });

  it('Can produce tx hash', () => {
    expect(buildTxHash(decode(txRaw))).to.equal(expectedHash);
  });
});
