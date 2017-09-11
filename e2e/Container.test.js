Feature('Container');

Scenario('Container', (I, loginPage, listPage, containerPage) => {
  I.amOnPage('/login');
  loginPage.basicLogin('admin', 'admin');
  I.waitForVisible(listPage.search, 5);
  I.see('vibioh/dashboard');
  I.click('vibioh/dashboard');
  I.waitForVisible(containerPage.name, 5);
  I.see('Config');
  I.see('HostConfig');
  I.see('Monitoring');
});
