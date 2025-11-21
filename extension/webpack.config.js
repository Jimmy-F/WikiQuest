const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    popup: './src/popup/index.tsx',
    content: './src/content/index.ts',
    background: './src/background/index.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/popup/popup.html',
      filename: 'popup.html',
      chunks: ['popup']
    }),
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'src/content/content.css', to: 'content.css' },
        { from: 'src/dashboard-sync.js', to: 'dashboard-sync.js' },
        { from: 'src/clear-storage.html', to: 'clear-storage.html' },
        { from: 'src/debug.html', to: 'debug.html' },
        { from: 'src/debug.js', to: 'debug.js' },
        { from: 'icons', to: 'icons', noErrorOnMissing: true }
      ]
    })
  ],
  devtool: 'cheap-module-source-map'
};
