import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path'; 

const __dirname = path.dirname(new URL(import.meta.url).pathname)

export default {
  entry: {
    home: './src/js/home.js',
    map: './src/js/map.js', 
    game: './src/js/game.js', 
  }, 
  devServer: {
    static: './docs',
    proxy: { 
      '/api': `http://localhost:3000`, 
    }, 
    watchFiles: ['./src/html/*'], 
  },
  devtool: 'inline-source-map', 
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'public'),
    clean: true, 
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      }, { 
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/html/home.html',
      inject: true,
      chunks: ['home'],
      filename: 'index.html', 
    }),
    new HtmlWebpackPlugin({
      template: './src/html/map.html',
      inject: true,
      chunks: ['map'],
      filename: 'map/index.html', 
    }),
    new HtmlWebpackPlugin({
      template: './src/html/game.html',
      inject: true,
      chunks: ['game'],
      filename: 'game/index.html', 
    }),
  ], 
};