/**
 * gulp自动化构建工具
 */

// 先载入gulp包
var gulp = require('gulp');
// 自动添加CSS3私有前缀
var autoprefixer = require('gulp-autoprefixer');
// 给链接资源地址 添加版本号
var rev = require('gulp-rev');
// 给链接资源地址 添加版本号后，替换HTML中的链接
var revCollector = require('gulp-rev-collector');
// 在HTML中CSS、JS合并文件后生成新的文件，并且可以合并的同时改变路径和重命名
var useref = require('gulp-useref');
// 为功能执行添加条件判断
var gulpif = require('gulp-if');
// 重命名文件
var rename = require("gulp-rename");

// 1、LESS编译、压缩、合并CSS
var less = require('gulp-less'); // less编译
var cssnano = require('gulp-cssnano'); //CSS压缩、合并可以使用@import导包的方式
gulp.task('styles', function () {
    return gulp
        .src(['public/less/*.less', '!public/less/_*.less'], {base: './public'})
        .pipe(less())
        .pipe(cssnano())
        .pipe(autoprefixer())
        .pipe(rev())
        .pipe(gulp.dest('build/public'))
        .pipe(rev.manifest())
        .pipe(rename('css-manifest.json')) //防止rev-manifest.json文件后面覆盖前面的，所以需要改名
        .pipe(gulp.dest('build/rev'))
        .pipe(browserSync.reload({
	       stream: true
	    }));
});

// 2、js合并、压缩混淆
var concat = require('gulp-concat'); // js合并
var uglify = require('gulp-uglify'); // js压缩混淆
gulp.task('scripts', function() {
  return gulp
  	.src(['public/libs/*.js', 'scripts/**/*.js'], {base: './'})
    // 合并为新的all.js文件
    // .pipe(concat('all.js'))
    // .pipe(uglify())
    // .pipe(rev())
    .pipe(useref())  //合并文件
    .pipe(gulpif('*.js', uglify())) //判断如果是js文件，就进行压缩
    .pipe(gulpif('*.js', rev())) //判断如果不是js文件就不改名
    .pipe(gulp.dest('./build'))
    .pipe(rev.manifest())
    .pipe(rename('js-manifest.json'))
    .pipe(gulp.dest('build/rev'))
    .pipe(browserSync.reload({
        stream: true
    }));
});

// 3、图片(压缩)复制
var imagemin = require('gulp-imagemin'); //图片压缩
gulp.task('images', function(){
	return gulp
		.src(['public/images/**/*.*', 'uploads/**/*.*'], {base: './'})
        .pipe(imagemin())
		.pipe(gulp.dest('./build'))
		.pipe(browserSync.reload({
	      stream: true
	    }));
});

// 4、 将sass编译为CSS
var sass = require('gulp-sass'); // sass编译为CSS
gulp.task('sass', function() {
    return gulp.src("src/scss/*.scss")
        .pipe(sass())
        .pipe(rev())
        .pipe(gulp.dest("build/css"))
        .pipe(browserSync.stream())
        .pipe(browserSync.reload({
	      stream: true
	    }));
});

// 5、HTML压缩
var htmlmin = require('gulp-htmlmin'); // html压缩
gulp.task('html', function(){
    // {base: './src'} 表示./src目录下的所有文件或文件夹目录结构不动，原样的复制过来
	return gulp
		.src(['./index.html', './views/**/*.html'], {base: './'})
		.pipe(htmlmin({
            // 去掉换行/空格
			collapseWhitespace: true,
            // 去掉注释
			removeComments:true,
            // 去掉script标签中的type="text/javascript"属性
			removeScriptTypeAttributes:true,
            // 压缩html中的JS代码
            minifyJS:true,
            // 压缩html中的CSS代码
            minifyCSS:true
		}))
		.pipe(gulp.dest('./build'))
		.pipe(browserSync.reload({
	      stream: true
	    }));
});

// 6、替换操作
gulp.task('rev', ['styles', 'images', 'scripts', 'html'], function () {
    return gulp.src(['./build/rev/*.json', './build/**/*.html'], {base: './build'})
        .pipe(revCollector())
        .pipe(gulp.dest('./build'));
});

// 7、把其他的文件拷贝进来
gulp.task('other', function(){
    return gulp.src(['./api/*', './public/fonts/*', './public/libs/*', './views/*.html', './*.ico'], {base: './'})
        .pipe(gulp.dest('./build'));
})

// 8、合并HTML中的资源链接文件
gulp.task('useref', function () {
    return gulp.src('./index.html')
        .pipe(useref())
        .pipe(gulpif('*.css', cssnano()))
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulp.dest('./build'));
})

// 8、启动服务，监视文件变化
var browserSync = require('browser-sync').create(); // 启动服务监视文件
gulp.task('serve', ['other', 'rev', 'useref'], function() {
    // 设置启动服务的根目录
    browserSync.init({
        server: "./build"
    });

    gulp.watch("src/scss/*.scss", ['sass']);
    gulp.watch("src/styles/*.less", ['styles', 'rev']);
    gulp.watch("src/scripts/*.js", ['scripts', 'rev']);
    gulp.watch("src/*.html", ['html']);
    // .on('change', browserSync.reload); 这句代码作用：自动刷新
    // gulp.watch("src/*.html", ['html']).on('change', browserSync.reload);
});


// 任务名为：default，直接执行gulp命令即可， 后面的数组里的任务会在这个default执行之前执行
gulp.task('default', ['serve']);
