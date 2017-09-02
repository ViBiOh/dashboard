Feature('Login');

Scenario('Basic auth login', (I, loginPage) => {
  I.amOnPage('/login');
  loginPage.basicLogin('admin', 'admin');
  I.see('vibioh/dashboard');
});
