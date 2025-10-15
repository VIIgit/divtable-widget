const path = require('path');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: {
    divtable: './src/div-table.js'
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
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.ttf$/,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    new MonacoWebpackPlugin({
      languages: ['javascript', 'typescript', 'json'],
      features: [
        'coreCommands',
        'find',
        'bracketMatching',
        'suggest',
        'hover'
      ]
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
      })
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
