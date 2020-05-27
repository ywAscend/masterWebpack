const Path = require('path')

const HtmlWebpackPlugin = require('html-webpack-plugin')
//css抽取为单独文件
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
//css压缩
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin')
//每次构建前自动清理打包目录build
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
//const webpack = require('webpack')

//process.env.NODE_ENV = 'development'
process.env.NODE_ENV = 'prodution'


const commonCssConfig = [
    MiniCssExtractPlugin.loader,
    'css-loader',
    //css兼容
    {
        loader:'postcss-loader',
        options:{
            indent: 'postcss',
            plugins:()=>[
                require('postcss-preset-env')()   // package.json需配置 'browserslist'
            ]
        }
    }
]

/*

 tree shaking  “摇树”,去除无用代码
    前提：1.必须使用ES6模块化
         2.开启production环境
    作用：减少代码体积

在package.json中配置
    "sideEffects":false 所有代码都没还有副作用，都可以进行tree shaking
    问题： 可能会把 css/ @babel/polyfill 文件干掉
    "sideEffects": ["*.css","*.less"]

 */

 /**
  * 在开发模式中配置 tree shaking
  * 
  * 需要在webpack.config.js中配置：
  * optimization:{
  *     usedExports: true
  * }
  * 
  * 
  */

module.exports = {
    entry: './src/js/index.js',
    output:{
        filename:'js/built.[contenthash:10].js',
        path: Path.resolve(__dirname,'build')
    },
    module:{
        rules:[
          //js处理
          {
            test: /\.js$/, //js语法检查 eslint -->eslint-loader eslint-config-airbnb-base - eslint-plugin-import
            exclude:/node_modules/,
            enforce: 'pre',
            loader:'eslint-loader', //package.json 配置 "eslintConfig": {"extends":"airbnb-base"}
            options:{
                fix:true //自动修复
            }
          },
          {
            //以下loader只会匹配一个
            //注意不能有两个配置处理同一种类型文件，所以将eslint-loader拿到外层
            //优化生产环境打包速度
            oneOf:[
                    /**
                     * 正常来讲，一个文件只能被一个loader处理
                     * 当一个文件要被多个loader处理，那么一定要指定loader执行的先后顺序
                     * 先执行 esLint 再执行babel
                     */
                    {   //js兼容
                        test:/\.js$/, // babel: babel-loader-->@babel/core-->@babel/preset-env -- core-js -->@babel/poly-fill
                        exclude:/node_modules/,
                        loader:'babel-loader',
                        options:{
                            presets:[
                                [
                                    "@babel/preset-env",
                                    {
                                        useBuiltIns: 'usage', //按需加载
                                        corejs: 3, //指定corejs版本
                                        targets:{ //指定兼容到哪个版本
                                            "chrome":"60",
                                            "firefox":"60",
                                            "ie":"9",
                                            "safari":"10",
                                            "edge":"11"
                                        }
                                    }

                                ]
                            ],
                            //开启babel缓存
                            //第二次构建时，会读取之前的缓存
                            cacheDirectory: true
                        } 
                    },
                    //css样式
                    {
                        test:/\.css$/,
                        use: [...commonCssConfig]
                    },
                    {
                        test:/\.less$/,
                        use:[ ...commonCssConfig,'less-loader']
                    },
                    //图片
                    {
                        test:/\.(jpg|png|gif)$/,
                        loader:'url-loader',
                        options:{
                            limit:8*1024,
                            name:'[hash:10].[ext]',
                            esModule:false,
                            outputPath:'imgs'
                        }
                    },
                    {
                        test:/\.html$/,
                        loader:'html-loader'
                    },
                    //字体图标
                    {
                        test:/\.(ttf|woff|woff2|svg|eot)$/,
                        loader:'file-loader',
                        options:{
                            outputPath:'media'
                        }
                    }
            ]
          }
        ]
    },
    mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',
    plugins:[
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template:'./src/index.html',
            minify:{ //压缩html
                collapseWhitespace:true, //移除空格
                removeComments: true  //移除注释
            }
        }),
        new MiniCssExtractPlugin({
            filename: 'css/built.[contenthash:10].css' //重命名打包后的css
        }),
        new OptimizeCssAssetsWebpackPlugin(), //压缩css
        //HotModuleReplacementPlugin帮我们实现HMR
        //new webpack.HotModuleReplacementPlugin()
    ],
    devtool:'source-map',
    devServer:{
        contentBase: 'build',
        compress:true,
        port:3000,
        open:true,
        hot:true  //开启热加载
    },
     //在开发模式下配置 tree shakeing
    //  optimization: {
    //     usedExports: true
    // }

}