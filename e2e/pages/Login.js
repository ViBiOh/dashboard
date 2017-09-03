let I;

module.exports = {
  _init() {
    I = actor();
  },

  basicIcon: '[data-login-basic]',
  fields: {
    login: '#login',
    password: '#password',
  },
  submit: '[data-basic-auth-submit]',

  basicLogin(login, password) {
    I.click(this.basicIcon);
    I.fillField(this.fields.login, login);
    I.fillField(this.fields.password, password);
    I.click(this.submit);
  },
};
