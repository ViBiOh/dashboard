/* eslint-disable import/no-extraneous-dependencies */
import { jsdom } from 'jsdom';

global.document = jsdom('<html><body></body></html>');
global.window = document.defaultView;
global.navigator = window.navigator;
