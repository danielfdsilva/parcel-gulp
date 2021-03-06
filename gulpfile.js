const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const gulp = require('gulp');
const del = require('del');
const portscanner = require('portscanner');
const log = require('fancy-log');

// /////////////////////////////////////////////////////////////////////////////
// --------------------------- Variables -------------------------------------//
// ---------------------------------------------------------------------------//

// Environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const readPackage = () => JSON.parse(fs.readFileSync('package.json'));

// Set the version in an env variable.
process.env.APP_VERSION = readPackage().version;
process.env.APP_BUILD_TIME = Date.now();

const parcelCli = path.join(__dirname, './node_modules/parcel/lib/cli.js');
const parcelConfig = path.join(__dirname, '.parcelrc');

// /////////////////////////////////////////////////////////////////////////////
// ----------------------- Watcher and custom tasks --------------------------//
// ---------------------------------------------------------------------------//

// Function to register file watching
function watcher() {
  // Custom watch processes.
  gulp.watch(['data/*'], dataProcessing);
  // -- Other watch listeners would be added here.

  // ---
  // Watch static files. DO NOT REMOVE.
  gulp.watch(['static/**/*'], copyFiles);
}

// Example function: Create a json file with the current time.
// This example is used to create a file that is added to the source folder (and
// gitignored). This file is then imported into the js code so it needs to be in
// the source folder.
async function timeFile() {
  // Create time file.
  await fs.writeJSON('./app/scripts/time.json', {
    time: Date.now(),
    foo: 'bar'
  });
}

// Example function: Read a CSV and convert to json.
// The resulting file is stored in the dist directory and loaded by the app as
// if it were part of an api.
async function dataProcessing() {
  // This is a dummy task performed with node fs. A better approach would be to
  // use the gulp stream api.
  const readings = await fs.readFile('./data/readings.csv', 'utf-8');
  const result = readings.split('\n').map((r) => {
    const [city, temp] = r.split(/, ?/);
    return { city, temp };
  });

  await fs.ensureDir('./dist/api/');

  await fs.writeJSON('./dist/api/readings.json', { entries: result });
}

// /////////////////////////////////////////////////////////////////////////////
// ---------------------------- Base tasks -----------------------------------//
// ---------------------------------------------------------------------------//

function clean() {
  // Remove build cache and dist.
  return del(['dist', '.parcel-cache']);
}

// Simple task to copy the static files to the dist directory. The static
// directory will be watched so that files are copied when anything changes.
function copyFiles() {
  return gulp.src('static/**/*').pipe(gulp.dest('dist'));
}

// Below are the parcel related tasks. One for the build process and other to
// start the development server.
const parcelTarget = './app/index.html';

function parcelServe(cb) {
  portscanner.findAPortNotInUse(9000, 9999, function (error, port) {
    if (port !== 9000) {
      log.warn(`  Port 9000 is busy.`);
    }

    const args = ['--config', parcelConfig, '--port', port, '--open'];

    // Run parcel in serve mode using the same stdio that started gulp. This is
    // needed to ensure the output is colored and behaves correctly.
    spawn('node', [parcelCli, 'serve', parcelTarget, ...args], {
      stdio: 'inherit'
    });
    cb(error);
  });
}

function parcelBuild(cb) {
  // Build the app using parcel. Since the build task finishes, we have to
  // listen for it to mark the gulp task as finished.
  const args = ['--config', parcelConfig];
  const pr = spawn('node', [parcelCli, 'build', parcelTarget, ...args], {
    stdio: 'inherit'
  });
  pr.on('close', () => cb());
}

// //////////////////////////////////////////////////////////////////////////////
// ---------------------------- Task export -----------------------------------//
// ----------------------------------------------------------------------------//

module.exports.clean = clean;

// Task orchestration used during the development process.
module.exports.serve = gulp.series(
  gulp.parallel(
    // Additional tasks:
    dataProcessing,
    timeFile,

    // Task to copy the files.
    copyFiles
  ),
  gulp.parallel(watcher, parcelServe)
);

// Task orchestration used during the production process.
module.exports.default = gulp.series(
  clean,
  gulp.parallel(
    // Additional tasks:
    dataProcessing,
    timeFile,

    // Task to copy the files.
    copyFiles
  ),
  parcelBuild
);
