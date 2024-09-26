import { expect } from 'chai';
import { describe, it } from 'mocha';
import { encode, decode, Encoding, MemoryAccount } from '../../src';
import { deriveKey, derivePathFromKey, ED25519_CURVE } from '../../src/account/MnemonicFactory';
import { concatBuffers } from '../../src/utils/other';

describe('hd wallet', () => {
  const testMnemonicSeed = Buffer.from(
    'Git7bFJkmfC1Ho+6YFSFuxSzmDZydmjzk8FubrPDz4PmrkORlBDlfnPTk02Wq9Pj2ZdQ5cTA0SxHKGrq3xSjOw==',
    'base64',
  );
  const testWallet = {
    chainCode: Buffer.from('XZL45EKIQiLe9v/pkY37Bn3GiqLXZ5v2hIya6llA0QM=', 'base64'),
    secretKey: Buffer.from('I1lro/ANfEKuBUal0Glo++D5abkcFLIIihTDLcC8l3M=', 'base64'),
  };
  const testSeed = Buffer.from('coffee', 'hex');
  const testMasterKey = {
    secretKey: Buffer.from(
      '5af2c70ffa0910605a26e651fc041de7c8c5a096fbb4bdaff2c597f692e2c145',
      'hex',
    ),
    chainCode: Buffer.from(
      '33d93dbe5e720d399e642222497579164d3dbf8c3f28e2147ecff96afad35d32',
      'hex',
    ),
  };
  const testChildKey = {
    secretKey: Buffer.from(
      '23a15775578d7bb4828189ebcb220240b30f11d3b1aadf28dc54db071ca325bf',
      'hex',
    ),
    chainCode: Buffer.from(
      '1fa9899b84631aaadf1daba7f7cf780e2fecfb8dd34a2edf6568eb1a9bb2f627',
      'hex',
    ),
  };

  it('generates encrypted extended wallet key', () => {
    const masterKey = deriveKey(testMnemonicSeed, ED25519_CURVE);
    expect(derivePathFromKey(masterKey, [44, 457])).to.eql(testWallet);
  });

  it('generates correct master key', () => {
    const masterKey = deriveKey(testSeed, ED25519_CURVE);
    expect(masterKey).to.eql(testMasterKey);
  });

  it('derives correct child key', () => {
    const childKey = derivePathFromKey(testMasterKey, [0]);
    expect(childKey).to.eql(testChildKey);
  });

  describe('check on test vectors for ed25519 from SLIP-0010', () =>
    (
      [
        {
          seed: Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex'),
          tests: [
            {
              path: [],
              chain: Buffer.from(
                '90046a93de5380a72b5e45010748567d5ea02bbf6522f979e05c0d8d8ca9fffb',
                'hex',
              ),
              prv: Buffer.from(
                '2b4be7f19ee27bbf30c667b642d5f4aa69fd169872f8fc3059c08ebae2eb19e7',
                'hex',
              ),
              pub: Buffer.from(
                '00a4b2856bfec510abab89753fac1ac0e1112364e7d250545963f135f2a33188ed',
                'hex',
              ),
            },
            {
              path: [0],
              chain: Buffer.from(
                '8b59aa11380b624e81507a27fedda59fea6d0b779a778918a2fd3590e16e9c69',
                'hex',
              ),
              prv: Buffer.from(
                '68e0fe46dfb67e368c75379acec591dad19df3cde26e63b93a8e704f1dade7a3',
                'hex',
              ),
              pub: Buffer.from(
                '008c8a13df77a28f3445213a0f432fde644acaa215fc72dcdf300d5efaa85d350c',
                'hex',
              ),
            },
            {
              path: [0, 1],
              chain: Buffer.from(
                'a320425f77d1b5c2505a6b1b27382b37368ee640e3557c315416801243552f14',
                'hex',
              ),
              prv: Buffer.from(
                'b1d0bad404bf35da785a64ca1ac54b2617211d2777696fbffaf208f746ae84f2',
                'hex',
              ),
              pub: Buffer.from(
                '001932a5270f335bed617d5b935c80aedb1a35bd9fc1e31acafd5372c30f5c1187',
                'hex',
              ),
            },
            {
              path: [0, 1, 2],
              chain: Buffer.from(
                '2e69929e00b5ab250f49c3fb1c12f252de4fed2c1db88387094a0f8c4c9ccd6c',
                'hex',
              ),
              prv: Buffer.from(
                '92a5b23c0b8a99e37d07df3fb9966917f5d06e02ddbd909c7e184371463e9fc9',
                'hex',
              ),
              pub: Buffer.from(
                '00ae98736566d30ed0e9d2f4486a64bc95740d89c7db33f52121f8ea8f76ff0fc1',
                'hex',
              ),
            },
            {
              path: [0, 1, 2, 2],
              chain: Buffer.from(
                '8f6d87f93d750e0efccda017d662a1b31a266e4a6f5993b15f5c1f07f74dd5cc',
                'hex',
              ),
              prv: Buffer.from(
                '30d1dc7e5fc04c31219ab25a27ae00b50f6fd66622f6e9c913253d6511d1e662',
                'hex',
              ),
              pub: Buffer.from(
                '008abae2d66361c879b900d204ad2cc4984fa2aa344dd7ddc46007329ac76c429c',
                'hex',
              ),
            },
            {
              path: [0, 1, 2, 2, 1000000000],
              chain: Buffer.from(
                '68789923a0cac2cd5a29172a475fe9e0fb14cd6adb5ad98a3fa70333e7afa230',
                'hex',
              ),
              prv: Buffer.from(
                '8f94d394a8e8fd6b1bc2f3f49f5c47e385281d5c17e65324b0f62483e37e8793',
                'hex',
              ),
              pub: Buffer.from(
                '003c24da049451555d51a7014a37337aa4e12d41e485abccfa46b47dfb2af54b7a',
                'hex',
              ),
            },
          ],
        },
        {
          seed: Buffer.from(
            'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542',
            'hex',
          ),
          tests: [
            {
              path: [],
              chain: Buffer.from(
                'ef70a74db9c3a5af931b5fe73ed8e1a53464133654fd55e7a66f8570b8e33c3b',
                'hex',
              ),
              prv: Buffer.from(
                '171cb88b1b3c1db25add599712e36245d75bc65a1a5c9e18d76f9f2b1eab4012',
                'hex',
              ),
              pub: Buffer.from(
                '008fe9693f8fa62a4305a140b9764c5ee01e455963744fe18204b4fb948249308a',
                'hex',
              ),
            },
            {
              path: [0],
              chain: Buffer.from(
                '0b78a3226f915c082bf118f83618a618ab6dec793752624cbeb622acb562862d',
                'hex',
              ),
              prv: Buffer.from(
                '1559eb2bbec5790b0c65d8693e4d0875b1747f4970ae8b650486ed7470845635',
                'hex',
              ),
              pub: Buffer.from(
                '0086fab68dcb57aa196c77c5f264f215a112c22a912c10d123b0d03c3c28ef1037',
                'hex',
              ),
            },
            {
              path: [0, 2147483647],
              chain: Buffer.from(
                '138f0b2551bcafeca6ff2aa88ba8ed0ed8de070841f0c4ef0165df8181eaad7f',
                'hex',
              ),
              prv: Buffer.from(
                'ea4f5bfe8694d8bb74b7b59404632fd5968b774ed545e810de9c32a4fb4192f4',
                'hex',
              ),
              pub: Buffer.from(
                '005ba3b9ac6e90e83effcd25ac4e58a1365a9e35a3d3ae5eb07b9e4d90bcf7506d',
                'hex',
              ),
            },
            {
              path: [0, 2147483647, 1],
              chain: Buffer.from(
                '73bd9fff1cfbde33a1b846c27085f711c0fe2d66fd32e139d3ebc28e5a4a6b90',
                'hex',
              ),
              prv: Buffer.from(
                '3757c7577170179c7868353ada796c839135b3d30554bbb74a4b1e4a5a58505c',
                'hex',
              ),
              pub: Buffer.from(
                '002e66aa57069c86cc18249aecf5cb5a9cebbfd6fadeab056254763874a9352b45',
                'hex',
              ),
            },
            {
              path: [0, 2147483647, 1, 2147483646],
              chain: Buffer.from(
                '0902fe8a29f9140480a00ef244bd183e8a13288e4412d8389d140aac1794825a',
                'hex',
              ),
              prv: Buffer.from(
                '5837736c89570de861ebc173b1086da4f505d4adb387c6a1b1342d5e4ac9ec72',
                'hex',
              ),
              pub: Buffer.from(
                '00e33c0f7d81d843c572275f287498e8d408654fdf0d1e065b84e2e6f157aab09b',
                'hex',
              ),
            },
            {
              path: [0, 2147483647, 1, 2147483646, 2],
              chain: Buffer.from(
                '5d70af781f3a37b829f0d060924d5e960bdc02e85423494afc0b1a41bbe196d4',
                'hex',
              ),
              prv: Buffer.from(
                '551d333177df541ad876a60ea71f00447931c0a9da16f227c11ea080d7391b8d',
                'hex',
              ),
              pub: Buffer.from(
                '0047150c75db263559a70d5778bf36abbab30fb061ad69f69ece61a72b0cfa4fc0',
                'hex',
              ),
            },
          ],
        },
      ] as const
    ).forEach(({ seed, tests }, idx) => {
      describe(`vector ${idx + 1}`, () =>
        tests.forEach((test) =>
          it(`chain ${test.path}`, () => {
            const masterKey = deriveKey(seed, ED25519_CURVE);
            const { secretKey, chainCode } = derivePathFromKey(masterKey, test.path);
            expect(chainCode).to.eql(test.chain);
            expect(secretKey).to.eql(test.prv);
            const { address } = new MemoryAccount(encode(secretKey, Encoding.AccountSecretKey));
            expect(concatBuffers([Buffer.alloc(1, 0), decode(address)])).to.eql(test.pub);
          }),
        ));
    }));
});
