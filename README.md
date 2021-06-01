# Test with Parcel and Gulp

This repo serves as an example of the integration between parcel and gulp.

## Why?
[Project-seed](https://github.com/developmentseed/project-seed) still works pretty well but for certain use cases it has some drawbacks.
It uses [Gulp](https://gulpjs.com/) as a task orchestrator (which is incredibly simple to use and its ecosystem of plugins make it very easy to perform different file transformations), and [Browserify](https://browserify.org/) as a bundler which is outdated tech and there's really no plugin replacement.

A more modern tool does all the building (task orchestration) and bundling (file processing) as one, so I was looking around.
Staring from scratch is always easier, but I wanted to see which tool stood up to the task of being included in a project already underway.

There are some things I'm looking for in a system like this:
- Asset import - Ability to import files as urls (like for images) and support for different file types (like json, md, etc)
- Structure configuration (I want the tool to fit my needs, not the other way around)
- Three shaking & code splitting
- Source maps and debug (Debug must be possible through VS Code for those who use it, but also through the browser debugger)
- Plugin system (To perform other file transformations - this can always be achieved with auxiliary scripts, but having it all together is better)
- Babel features support / code minification
- Dev server

### Parcel
[Parcel](https://v2.parceljs.org) is the tool better suited for this job. It handles almost all the requirements, except it doesn't allow for tasks dealing with files that will not be part of the final bundle. For example, [parcel's static file](https://github.com/elwin013/parcel-reporter-static-files-copy) plugin will just copy the files to the dist folder, [without watching them](https://github.com/elwin013/parcel-reporter-static-files-copy#flaws-and-problems) for changes.

The solution I arrived at was to keep using Gulp as a task orchestrator (where adding tasks is a breeze), and then add parcel as a gulp task to take care of all the bundling.
This repo contains a simple example project with the following use cases:

#### String placeholders
The `index.html` has string placeholders that are replaced during build. In this case it is used for SEO purposes, but can have other uses

```html
<title>{{appTitle}}</title>
<meta name='description' content='{{appDescription}}' />
```
This is achieved using [posthtml-expressions](https://github.com/posthtml/posthtml-expressions).

#### Data processing
One of the tasks Gulp performs is some data processing before starting the build/serve process.
This tasks results in a file which is copied to the dist directory and then accessed as a fetch request.

This specific task could be done by parcel, but if the processing task gets too complex, parcel would not be able to handle it internally, so a separate gulp task is handy for this.

```js
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
```

NOTE: This is the only instance where browser reload is not available. After changing one of these files (and the task running), you have to refresh the browser yourself in order for it to be reloaded (or trigger the fetch request again). This is because it is not possible to tap into Parcel's process and force a refresh.

#### Data processing 2
Another type of data processing is the creation of a file that is then imported by one of the scripts and ends up in the bundle.
This file is generated by a task and also gitingored.

```js
import { time } from './time.json';
```

#### Static files
The `static` directory includes files that are copied to `dist`, without any changes. Changes are watched and files are copied if anything changes.

#### Other
There are some other things going on. Check the source code of `app/scripts/main.js`.

# Running the project

Install the dependencies:
```
nvm install
yarn install
```

To run a development server: `yarn serve`
To build the site: `yarn build`

If you want to use any other parcel feature it is also possible. Example:
```
PARCEL_BUNDLE_ANALYZER=true yarn parcel build app/index.html
```