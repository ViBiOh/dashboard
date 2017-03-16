/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import webdriver, { By } from 'selenium-webdriver';
import test from 'selenium-webdriver/testing';

test.describe('Google Search', function sequence() {
  let driver;

  this.timeout(30000);

  beforeEach(() => {
    driver = new webdriver.Builder()
      .withCapabilities(webdriver.Capabilities.chrome())
      .usingServer('http://localhost:4445/wd/hub')
      .build();
  });

  afterEach(() => {
    driver.quit();
  });

  test.it('should work', (done) => {
    driver.get('https://www.google.com');

    const searchBox = driver.findElement(By.name('q'));
    searchBox.sendKeys('simple programmer');
    searchBox.getAttribute('value').then((value) => {
      expect(value).to.equal('simple programmer');
      done();
    });
  });
});
