import path from 'path';
import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import pkg from './package.json' with { type: 'json' };
import babelConfig from './babel.config.js';

const { dependencies } = pkg;

function configure(filename, opts = {}) {
  const isNode = opts.target.includes('node');
  return (env) => ({
    entry: `./src/index${isNode ? '' : '-browser'}.ts`,
    mode: 'production',
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.(js|ts)$/,
          include: path.resolve(import.meta.dirname, 'src'),
          loader: 'babel-loader',
          options: { ...babelConfig, browserslistEnv: opts.target.split(':')[1] },
        },
      ],
    },
    optimization: {
      minimize: !isNode,
    },
    resolve: {
      extensions: ['.ts', '.js'],
      extensionAlias: { '.js': ['.ts', '.js'] },
      fallback: isNode
        ? {}
        : {
            buffer: path.resolve(import.meta.dirname, 'node_modules/buffer/index.js'),
            child_process: false,
            os: false,
            path: false,
            'fs/promises': false,
            url: false,
          },
    },
    plugins: [
      ...(isNode
        ? []
        : [
            new webpack.ProvidePlugin({
              process: 'process',
              Buffer: ['buffer', 'Buffer'],
            }),
          ]),
      ...(env.REPORT
        ? [
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              reportFilename: `${filename}.html`,
              openAnalyzer: false,
            }),
          ]
        : []),
    ],
    output: {
      path: path.resolve(import.meta.dirname, 'dist'),
      filename,
      library: {
        name: 'Aeternity',
        type: 'umd',
      },
    },
    externals: Object.fromEntries(
      Object.keys(dependencies).map((dependency) => [dependency, dependency]),
    ),
    ...opts,
  });
}

export default [
  configure('aepp-sdk.cjs', { target: 'browserslist:node' }),
  configure('aepp-sdk.browser.cjs', { target: 'browserslist:browser' }),
  configure('aepp-sdk.browser-script.cjs', {
    target: 'browserslist:browser',
    externals: undefined,
  }),
];
