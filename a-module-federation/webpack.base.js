/**
 * Common webpack 5 configuration for every Module Federation app (shell + 4 remotes),
 * so all builds use identical loaders, targets and optimisation settings.
 */
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { ModuleFederationPlugin } = webpack.container;

const API_URL = process.env.API_URL || 'https://fakestoreapi.com';

module.exports = function createConfig({ dirname, name, port, exposes = {}, remotes = {}, isShell = false }) {
  const deps = require(path.join(dirname, 'package.json')).dependencies;

  return (env, argv) => {
    const isProd = argv.mode === 'production';
    return {
      entry: './src/index.js',
      output: {
        path: path.join(dirname, 'dist'),
        // Shell is served at "/" with deep links (/product/1); remotes resolve their own URL.
        publicPath: isShell ? '/' : 'auto',
        filename: isProd ? '[name].[contenthash:8].js' : '[name].js',
        uniqueName: name,
        clean: true,
      },
      devtool: isProd ? false : 'eval-cheap-module-source-map',
      resolve: { extensions: ['.js', '.jsx'] },
      module: {
        rules: [
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
      plugins: [
        new ModuleFederationPlugin({
          name,
          filename: 'remoteEntry.js',
          exposes,
          remotes,
          // React and the router must be single instances across all MFEs (shared hooks/context).
          shared: {
            react: { singleton: true, requiredVersion: deps.react },
            'react-dom': { singleton: true, requiredVersion: deps['react-dom'] },
            'react-router-dom': { singleton: true, requiredVersion: deps['react-router-dom'] },
          },
        }),
        new HtmlWebpackPlugin({
          template: path.join(__dirname, 'common', 'index.html'),
          title: isShell ? 'ShopMFE – Module Federation' : `ShopMFE – ${name} (standalone)`,
        }),
        new MiniCssExtractPlugin({ filename: isProd ? '[name].[contenthash:8].css' : '[name].css' }),
        new webpack.DefinePlugin({ 'process.env.API_URL': JSON.stringify(API_URL) }),
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
      },
      performance: { hints: false },
    };
  };
};

/** Remote URLs are injected at build time so the same code can point at local or cloud hosts. */
module.exports.remoteUrl = (envVar, fallback) => process.env[envVar] || fallback;
