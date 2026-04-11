const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const pkg = require('./package.json');

const loadLocalEnv = () => {
	const envPath = path.join(__dirname, '.env.local');
	if (!fs.existsSync(envPath)) {
		return;
	}

	const text = fs.readFileSync(envPath, 'utf8');
	for (const rawLine of text.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) {
			continue;
		}

		const separatorIndex = line.indexOf('=');
		if (separatorIndex <= 0) {
			continue;
		}

		const key = line.slice(0, separatorIndex).trim();
		if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
			continue;
		}

		const value = line.slice(separatorIndex + 1).trim();
		process.env[key] = value;
	}
};

loadLocalEnv();

const googleSheetsApiKey = process.env.GOOGLE_SHEETS_API_KEY || '';

module.exports = (env, argv) => ({
	mode: argv.mode || 'development',
	devtool: argv.mode === 'production' ? false : 'inline-source-map',
	entry: './src/client/browser.tsx',
	output: {
		path: path.join(__dirname, 'out', 'browser'),
		filename: 'browser.js',
		publicPath: '',
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx', '.css'],
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: 'ts-loader',
				options: {
					transpileOnly: true,
					compilerOptions: {
						noEmit: false,
					},
				},
			},
			{
				test: /\.css$/,
				use: [MiniCssExtractPlugin.loader, 'css-loader'],
			},
		],
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: 'browser.css',
		}),
		new webpack.DefinePlugin({
			__APP_VERSION__: JSON.stringify(pkg.version),
			__GOOGLE_SHEETS_API_KEY__: JSON.stringify(googleSheetsApiKey),
		}),
	],
});