/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { jsdom } from 'jsdom';

const DEFAULT_HTML = '<html><body></body></html>';
global.document = jsdom(DEFAULT_HTML);
global.window = document.defaultView;
global.navigator = window.navigator;

global.then = (callback, timeout = 4) => new Promise(resolve => setTimeout(resolve, timeout))
  .then(callback);
