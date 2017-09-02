let I;

module.exports = {
  _init() {
    I = actor();
  },

  basicIcon: {
    css: '[data-auth-basic]',
  },
  fields: {
    login: '#login',
    pass: '#password',
  },
  submit: {
    css: '[data-auth-basic-submit]',
  },

  basicLogin(login, password) {
    I.click(this.basicIcon);
    I.fillField(this.fields.login, login);
    I.fillField(this.fields.password, password);
    I.click(this.submit);
  },
};
