export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'account',
        'aens',
        'aepp',
        'chain',
        'channel',
        'compiler',
        'contract',
        'middleware',
        'deps',
        'deps-dev',
        'node',
        'oracle',
        'release',
        'tx-builder',
        'wallet',
      ],
    ],
  },
  ignores: [(message) => /^Bumps \[.+]\(.+\) from .+ to .+\.$/m.test(message)],
};
