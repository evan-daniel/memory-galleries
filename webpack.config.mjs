import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path'; 

const __dirname = path.dirname(new URL(import.meta.url).pathname)

export default {
  mode: 'development', 
  entry: {
    home: './src/js/home.js',
    map: './src/js/map.js', 
    game: './src/js/game.js', 
  }, 
  devServer: {
    static: './dist',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true, 
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
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