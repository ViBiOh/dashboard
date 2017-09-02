let I;

module.exports = {
  _init() {
    I = actor();
  },

  basicIcon: '[data-auth-basic]',
  fields: {
    login: '#login',
    password: '#password',
  },
  submit: '[data-auth-basic-submit]',

  basicLogin(login, password) {
    I.click(this.basicIcon);
    I.fillField(this.fields.login, login);
    I.fillField(this.fields.password, password);
    I.click(this.submit);
  },
};
