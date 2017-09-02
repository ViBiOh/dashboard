Feature('Login');

Scenario('Basic auth login', (I, loginPage) => {
  I.amOnPage('/login');
  loginPage.basicLogin('admin', 'admin');
  I.waitUrlEquals('/', 5);
  I.see('vibioh/dashboard');
});
