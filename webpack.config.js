const path = require('path');
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');


const outputDirectory = 'dist';

module.exports = {
  entry: './client/index.js',
  output: {
    path: path.join(__dirname, outputDirectory),
    filename: 'main.js'
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [
        {
            test: /\.js$/,
            loader: 'babel-loader',
            exclude: /node_modules/,
            include: [
              path.resolve(__dirname, "client")
            ],
        },
        {
            test: /\.css$/,
            exclude: /node_modules/,
            include: [
              path.resolve(__dirname, "client")
            ],
            use: [
                { loader: 'style-loader' },
                {
                    loader: 'css-loader',
                    options: {
                        sourceMap: true
                    }
                 },
                 {
                     loader: 'postcss-loader',
                     options: {
                         ident: 'postcss',
                         plugins: () => [
                             autoprefixer({})
                         ]
                     }
                  }
            ]
        },
        {
            exclude: /node_modules/,
            include: [
              path.resolve(__dirname, "client")
            ],
            test: /\.(png|jpe?g|gif)$/,
            loader: 'url-loader?limit=10000&name=img/[name].[ext]'
        }
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx']
  },
  devServer: {
    port: 3003,
    open: true,
    writeToDisk: true,
    historyApiFallback: true,
    proxy: {
      '/blog': 'http://localhost:80',
      '/public': 'http://localhost:80',
      '/**': 'http://localhost:80'
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: __dirname + '/public/index.html',
      filename: 'index.html',
      inject: 'body'
    })
  ]
};
