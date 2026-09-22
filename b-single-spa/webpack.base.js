/**
 * Common webpack 5 configuration for every Single-SPA application.
 * Each app is emitted as ONE SystemJS module (output.library.type = "system") with a
 * stable file name, which the root-config's import map points to. React, ReactDOM and
 * single-spa are externals: they are loaded once by SystemJS from the import map.
 */
const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const API_URL = process.env.API_URL || 'https://fakestoreapi.com';

module.exports = function createConfig({ dirname, name, port, filename, extraPlugins = [], devServer = {} }) {
  return (env, argv) => {
    const isProd = argv.mode === 'production';
    return {
      entry: './src/index.js',
      output: {
        path: path.join(dirname, 'dist'),
        filename,
        library: { type: 'system' },
        uniqueName: name,
        publicPath: '',
        clean: true,
      },
      externals: ['react', 'react-dom', 'react-dom/client', 'single-spa'],
      devtool: isProd ? false : 'eval-cheap-module-source-map',
      resolve: { extensions: ['.js', '.jsx'] },
      module: {
        rules: [
          { parser: { system: false } }, // leave SystemJS globals alone
          {
            test: /\.jsx?$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [
                  ['@babel/preset-env', { targets: '>0.5%, last 2 versions, not dead' }],
                  ['@babel/preset-react', { runtime: 'automatic' }],
                ],
              },
            },
          },
          { test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] },
        ],
      },
      optimization: { splitChunks: false }, // one file per app, referenced by the import map
      plugins: [
        new MiniCssExtractPlugin({ filename: '[name].css' }),
        new webpack.DefinePlugin({ 'process.env.API_URL': JSON.stringify(API_URL) }),
        ...extraPlugins,
        process.env.ANALYZE &&
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: path.join(dirname, 'dist', 'bundle-report.html'),
            generateStatsFile: true,
            statsFilename: path.join(dirname, 'dist', 'stats.json'),
            openAnalyzer: false,
          }),
      ].filter(Boolean),
      devServer: {
        port,
        historyApiFallback: true,
        headers: { 'Access-Control-Allow-Origin': '*' },
        ...devServer,
      },
      performance: { hints: false },
    };
  };
};
