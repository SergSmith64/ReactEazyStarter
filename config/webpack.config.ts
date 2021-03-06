import * as webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import StylelintPlugin from 'stylelint-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';

import pathes from './pathes';
import getStyleRules from './styles';

const isProduction = process.env.NODE_ENV === 'production';

const mode = process.env.NODE_ENV === 'development' ? 'development' : process.env.NODE_ENV === 'production' ? 'production' : 'development';

const extensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.sass', '.scss', '.less', '.json'];

const config: webpack.Configuration = {
	mode,
	devtool: isProduction ? 'source-map' : '#eval-source-map',
	context: pathes.appDir,
	entry: {
		app: [!isProduction && 'react-hot-loader/patch', pathes.appEntry].filter(Boolean),
	},
	target: 'web',
	resolve: {
		extensions,
	},
	output: {
		filename: 'js/[name].js',
		path: pathes.outputDir,
		publicPath: '/',
		chunkFilename: 'js/[name].js',
	},
	module: {
		rules: [
			{
				enforce: 'pre',
				test: /\.[jt]s(x)?$/,
				exclude: /node_modules/,
				use: ['eslint-loader'],
			},
			{
				test: /\.[jt]s(x)?$/,
				exclude: /node_modules/,
				use: ['react-hot-loader/webpack', 'babel-loader', 'ts-loader'],
			},
			...getStyleRules({ type: 'css', modules: true }),
			...getStyleRules({ type: 'sass', modules: true }),
			...getStyleRules({ type: 'less', modules: true }),
			{
				test: /\.svg$/,
				issuer: {
					test: /\.[jt]s(x)?$/,
				},
				use: [
					{
						loader: '@svgr/webpack',
					},
				],
			},
			{
				test: /\.(png|jpg|gif|svg)$/,
				use: [
					{
						loader: 'file-loader',
						options: {
							name: 'images/[name].[ext]',
						},
					},
				],
			},
			{
				test: /\.(mov|mp4|webm)$/,
				use: [
					{
						loader: 'file-loader',
						options: {
							name: 'videos/[name].[ext]',
						},
					},
				],
			},
			{
				test: /\.(woff|woff2|eot|ttf|otf)$/,
				use: [
					{
						loader: 'file-loader',
						options: {
							name: 'fonts/[name].[ext]',
						},
					},
				],
			},
		],
	},
	plugins: [
		new StylelintPlugin({
			failOnError: false,
			files: '**/*.(c|sa|sc|le)ss',
			fix: true,
			configFile: 'stylelint.config.js',
		}),
		new HtmlWebpackPlugin({
			template: pathes.template,
			minify: isProduction && {
				removeComments: true,
				removeEmptyElements: false,
			},
		}),
		new MiniCssExtractPlugin({
			filename: 'css/[name].[hash].[id].css',
			chunkFilename: 'css/[chunkhash].[id].css',
		}),
		new webpack.HotModuleReplacementPlugin(),
	],
	optimization: {
		minimize: isProduction,
		splitChunks: {
			automaticNameDelimiter: '.',
			chunks: 'all',
			cacheGroups: {
				vendor: {
					test: /[\\/]node_modules[\\/]/,
					name(module) {
						// get the name. E.g. node_modules/packageName/not/this/part.js
						// or node_modules/packageName
						const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];

						// npm package names are URL-safe, but some servers don't like @ symbols
						return `vendors.${packageName.replace('@', '')}`;
					},
				},
			},
		},
		minimizer: [
			new CleanWebpackPlugin(),
			new TerserPlugin({
				cache: true,
				parallel: true,
				terserOptions: {
					output: {
						comments: false,
					},
				},
				extractComments: false,
			}),
			new OptimizeCSSAssetsPlugin({
				cssProcessor: require('cssnano'),
				cssProcessorPluginOptions: {
					preset: [
						'default',
						{
							discardComments: {
								removeAll: true,
							},
						},
					],
				},
			}),
		],
	},

	devServer: {
		hot: true,
		historyApiFallback: true,
		stats: {
			children: false,
			maxModules: 0,
		},
		open: true,
	},
};

export default config;
