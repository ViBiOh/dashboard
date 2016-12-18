#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const mkdirp = require('mkdirp');
const Mustache = require('mustache');
const utils = require('js-utils');

const promiseReadFile = utils.asyncifyCallback(fs.readFile);
const promiseWriteFile = utils.asyncifyCallback(fs.writeFile);
const promiseMkdirP = utils.asyncifyCallback(mkdirp);

const options = require('yargs')
  .reset()
  .options('template', {
    alias: 't',
    required: true,
    type: 'String',
    describe: 'Input',
  })
  .options('bust', {
    alias: 'b',
    required: false,
    type: 'String',
    describe: 'Cache-buster (commit SHA-1)',
  })
  .options('partials', {
    alias: 'p',
    required: false,
    type: 'String',
    describe: 'Partials',
  })
  .options('js', {
    alias: 'j',
    required: false,
    type: 'String',
    describe: 'Inline JavaScript',
  })
  .options('css', {
    alias: 'c',
    required: false,
    type: 'String',
    describe: 'Inline CSS',
  })
  .options('output', {
    alias: 'o',
    required: false,
    type: 'String',
    describe: 'Output',
  })
  .help('help')
  .strict()
  .argv;

const OUTPUT_INDEX_SCHEMA = Math.max(0, options.template.indexOf('*'));
const requiredPromises = [];

function handleError(error, reject) {
  if (error) {
    reject(error);
  }
}

function displaySuccess(output) {
  console.log(output);
}

function displayError(error) {
  if (error instanceof Error) {
    console.error(error.stack);
  } else {
    console.error(error);
  }
  process.exit(1);
}

function inline(pattern) {
  if (pattern) {
    return new Promise((resolve, reject) => {
      glob(pattern, {}, (error, files) => {
        handleError(error, reject);

        Promise.all(files.map(file => promiseReadFile(file, 'utf-8')))
          .then(contents => resolve(contents.join('')))
          .catch(reject);
      });
    });
  }
  return Promise.resolve('');
}

function partialPromise(partialFile, partialObj) {
  return new Promise((resolve, reject) => {
    promiseReadFile(partialFile, 'utf-8').then(partialContent => {
      partialObj[path.basename(partialFile)] = partialContent;
      resolve();
    }).catch(reject);
  });
}

function mustachePromise(mustacheFile, template) {
  return new Promise((resolve, reject) => {
    promiseReadFile(mustacheFile, 'utf-8')
      .then(resolve)
      .catch((error) => {
        resolve('{}');
        console.warn(`Unable to read ${mustacheFile} for template ${template} with reason ${error}`);
      });
  });
}

function templatePromise(template, partials) {
  return new Promise((resolve, reject) => {
    Promise.all([
      promiseReadFile(template, 'utf-8'),
      mustachePromise(path.join(path.dirname(template), 'mustache.json'), template),
    ]).then((values) => {
      const data = JSON.parse(values[1]);
      if (options.bust) {
        data.version = options.bust;
      }

      const rendered = Mustache.render(values[0], data, partials);
      if (options.output) {
        const outputFile = path.join(options.output, template.substring(OUTPUT_INDEX_SCHEMA));
        promiseMkdirP(path.dirname(outputFile))
          .then(() => promiseWriteFile(outputFile, rendered).then(() => resolve(outputFile)))
          .catch(reject);
      } else {
        resolve(rendered);
      }
    }).catch(reject);
  });
}

if (options.partials) {
  requiredPromises.push(new Promise((resolve, reject) => {
    glob(options.partials, {}, (error, partials) => {
      handleError(error, reject);

      const partialObj = {};
      Promise.all(partials.map(partial => partialPromise(partial, partialObj)))
        .then(() => resolve(partialObj))
        .catch(reject);
    });
  }));
} else {
  requiredPromises.push(Promise.resolve({}));
}

requiredPromises.push(inline(options.js));
requiredPromises.push(inline(options.css));

new Promise((resolve, reject) => {
  Promise.all(requiredPromises).then((required) => {
    const partials = required[0];
    partials.inlineJs = `<script type="text/javascript">${required[1]}</script>`;
    partials.inlineCss = `<style type="text/css">${required[2]}</style>`;

    glob(options.template, {}, (error, templates) => {
      handleError(error, reject);

      Promise.all(templates.map(template => templatePromise(template, partials)))
        .then(values => resolve(values.join('\n')))
        .catch(reject);
    });
  }).catch(reject);
}).then(displaySuccess).catch(displayError);
