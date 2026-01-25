const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  entry: {
    divtable: ['./src/div-table.js', './src/div-table.css']
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].min.js',
    library: {
      name: 'DivTable',
      type: 'umd',
      export: 'default'
    },
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      },
      {
        test: /\.ttf$/,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].min.css'
    })
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: /@license/i
          }
        },
        extractComments: false
      }),
      new CssMinimizerPlugin()
    ]
  },
  resolve: {
    extensions: ['.js', '.json']
  },
  externals: {
    'monaco-editor': {
      commonjs: 'monaco-editor',
      commonjs2: 'monaco-editor',
      amd: 'monaco-editor',
      root: 'monaco'
    }
  }
};
