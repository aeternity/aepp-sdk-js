module.exports = {
  presets: [
    ['@babel/preset-env', {
      include: [
        '@babel/plugin-proposal-nullish-coalescing-operator',
        '@babel/plugin-proposal-logical-assignment-operators',
      ],
    }],
    '@babel/preset-typescript',
  ],
  plugins: [
    ['@babel/plugin-transform-runtime', { corejs: 3 }],
  ],
};
