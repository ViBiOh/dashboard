let I;

module.exports = {
  _init() {
    I = actor();
  },

  basicIcon: '[data-login-basic]',
  error: '[data-error]',
  submit: '[data-basic-auth-submit]',
  fields: {
    login: '#login',
    password: '#password',
  },

  basicLogin(login, password) {
    I.click(this.basicIcon);
    I.fillField(this.fields.login, login);
    I.fillField(this.fields.password, password);
    I.click(this.submit);
  },
};
