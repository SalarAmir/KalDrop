const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: {
    popup: './Extension/popup/popup.js',
    login: './Extension/popup/login.js',
    content: './Extension/content/content.js',
    background: './Extension/background/background.js',
    manage: './Extension/popup/manage.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js'
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      }
    }]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'Extension/popup', to: 'popup'},
        { from: 'Extension/manifest.json', to: 'manifest.json' }
      ]
    }),
    new Dotenv(),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    })
  ],
  resolve: {
    fallback: {
      "path": require.resolve("path-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/"),
      "util": require.resolve("util/"),
      "process": require.resolve("process/browser"),
    }
  },
  devtool: 'cheap-module-source-map'
};