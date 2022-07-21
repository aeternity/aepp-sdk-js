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
        'tx-builder',
        'wallet',
      ],
    ],
  },
};
