module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'aens',
        'aepp',
        'chain',
        'channel',
        'compiler',
        'contract',
        'deps',
        'node',
        'oracle',
        'release',
        'tx-builder',
        'wallet',
      ],
    ],
  },
};
