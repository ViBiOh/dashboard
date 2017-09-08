Feature('Login');

Scenario('Basic auth error', (I, loginPage) => {
  I.amOnPage('/login');
  loginPage.basicLogin('admin', 'invalid');
  I.waitForVisible('[data-error]', 5);
  I.seeElement('[data-error]');
});

Scenario('Basic auth success', (I, loginPage) => {
  I.amOnPage('/login');
  loginPage.basicLogin('admin', 'admin');
  I.waitForVisible('[data-search]', 5);
  I.see('vibioh/dashboard');
});
