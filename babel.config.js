module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        include: [
          // compatibility with create-react-app@4
          '@babel/plugin-proposal-nullish-coalescing-operator',
          // compatibility with vue-cli-plugin-browser-extension@0.25
          '@babel/plugin-proposal-logical-assignment-operators',
          // compatibility with @vue/cli@4
          '@babel/plugin-proposal-class-properties',
          '@babel/plugin-proposal-private-methods',
        ],
      },
    ],
    '@babel/preset-typescript',
  ],
  plugins: [
    ['@babel/plugin-transform-runtime', { corejs: 3 }],
    'babel-plugin-transform-import-meta',
  ],
};
