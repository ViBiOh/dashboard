Feature('Login');

Scenario('Basic auth error', (I, loginPage) => {
  I.amOnPage('/login');
  loginPage.basicLogin('admin', 'invalid');
  I.waitForVisible(loginPage.error, 5);
  I.seeElement(loginPage.error);
  I.see('invalid credentials for admin');
});

Scenario('Basic auth success', (I, loginPage, listPage) => {
  I.amOnPage('/login');
  loginPage.basicLogin('admin', 'admin');
  I.waitForVisible(listPage.search, 5);
  I.see('vibioh/dashboard');
});
