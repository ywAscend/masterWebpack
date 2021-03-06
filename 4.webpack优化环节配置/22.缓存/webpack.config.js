const Path = require('path')

const HtmlWebpackPlugin = require('html-webpack-plugin')
//css抽取为单独文件
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
//css压缩
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin')

//process.env.NODE_ENV = 'development'
process.env.NODE_ENV = 'prodution'

/**
 *  缓存： babel 缓存
 *      cacheDirectory: true
 *      --> 让第二次打包构建速度更快
 *  
 *  文件资源缓存
 *      hash： 每次webpack构建时会生成一个唯一的hash值
 *      问题： 因为js和css同时使用一个hash值
 *            如果重新打包，会导致所有缓存失效（可能只改动一个文件）
 *      chunkhash: 根据chunk生成的hash值，如果打包来源于同一个chunk,那么hash值就一样
 *      问题：js和css的hash值还是一样
 *            因为css是在js中被引进入的，多以同属于同一个chunk
 *      什么是chunk？ 
 *          以一个入口文件 index.js,引入其他依赖（js|css）,这些依赖会跟入口文件形成一个文件，
 *          这一个文件就叫做chunk，也叫代码块。所有根据入口文件引入东西都会生成一个chunk
 *      contenthash: 根据文件的内容生成hash值。不同文件hash值一定不一样
 *      --> 让代码上线运行缓存更好使用
 * 
 */

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
        new OptimizeCssAssetsWebpackPlugin() //压缩css
    ],
    devtool:'source-map',
    devServer:{
        contentBase: 'build',
        compress:true,
        port:3000,
        open:true,
        hot:true  //开启热加载
    }
}