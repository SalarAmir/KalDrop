const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
  entry: {
    popup: './Extension/popup/popup.js',
    content: './Extension/content/content.js',
    background: './Extension/background/background.js'
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
        { from:'Extension/popup', to: 'popup'},
        { from: 'Extension/manifest.json', to: 'manifest.json' }
      ]
    })
  ],
  devtool: 'cheap-module-source-map'
};