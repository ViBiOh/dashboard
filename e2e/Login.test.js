Feature('Login');

Scenario('Basic auth error', (I, loginPage) => {
  I.amOnPage('/login');
  loginPage.basicLogin('admin', 'invalid');
  I.seeElement('#error');
});

Scenario('Basic auth success', (I, loginPage) => {
  I.amOnPage('/login');
  loginPage.basicLogin('admin', 'admin');
  I.waitForVisible('#search', 5);
  I.see('vibioh/dashboard');
});
