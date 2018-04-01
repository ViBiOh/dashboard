/* eslint-disable import/no-extraneous-dependencies */
import { JSDOM } from 'jsdom';
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

global.document = new JSDOM('<html><body></body></html>').window.document;
global.window = document.defaultView;
global.navigator = window.navigator;

configure({ adapter: new Adapter() });
