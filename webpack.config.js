const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    publicPath: '/', // Ensures that assets are served from the root
    webassemblyModuleFilename: 'wasm/[hash].wasm',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.wasm$/,
        type: 'webassembly/async',
        // Webpack 5 handles WASM natively
      },
      {
        test: /gto_.*\.js$/, // Target only gto_*.js files
        type: 'javascript/auto', // Prevent Webpack from interpreting them as modules
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],
  resolve: {
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
      path: require.resolve('path-browserify'),
      fs: false,
      vm: require.resolve('vm-browserify'),
    },
    alias: {
      wasm: path.resolve(__dirname, 'public/wasm'),
    },
  },
  experiments: {
    asyncWebAssembly: true,
    topLevelAwait: true,
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 'auto',
    historyApiFallback: true,
    open: true,
  },
  performance: {
    maxAssetSize: 5000000, // 5 MB
    maxEntrypointSize: 5000000, // 5 MB
  },
};