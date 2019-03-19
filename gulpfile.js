const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const ts = require('gulp-typescript');
const spawn = require('child_process').spawn;

const path = require('path');
const JSON_FILES = ['src/*.json', 'src/**/*.json', 'package.json'];

// pull in the project TypeScript config
const tsProject = ts.createProject('./tsconfig.json');

const compileTypeScript = () => {
  const tsResult = tsProject
    .src()
    .pipe(tsProject())
    .on("error",()=>{/*handle the error here*/});

  return tsResult.js.pipe(gulp.dest('dist'));
};

const runDevelopmentServer = function() {
  return nodemon({
    script: 'dist/app.js',
    ext: 'js',
  })
  .once('exit', () => {
    process.exit();
  });
};

gulp.task('clean', function() {
  return spawn('rm', ['-rf', path.join(__dirname, 'dist')]);
});

gulp.task('assets', function() {
  return gulp.src(JSON_FILES).pipe(gulp.dest('dist'));
});

gulp.task('tsc', gulp.series('clean', compileTypeScript, 'assets'));

gulp.task('watch', () => {
  return gulp.watch('src/**/*.ts', compileTypeScript);
});


gulp.task('start', gulp.series('tsc', gulp.parallel('watch', runDevelopmentServer)));

gulp.task('default', gulp.series('watch', 'assets'));
