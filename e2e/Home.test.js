Feature('Home');

Scenario('Welcome page', (I) => {
  I.amOnPage('/');
  I.see('dashboard');
});
