export default class UI {
  constructor(test) {
    this.screenName = document.getElementById('screenName');
    this.screenNamePrefix = document.querySelector('.controls .input-field .prefix');
    this.headerScreenName = document.querySelector('.header-screen_name');
    this.screenName.addEventListener('keyup', this.updateHeaderScreenName);

    this.checkButton = document.getElementById('check');
    this.test = test;
    this.checkButton.addEventListener('click', this.handleCheckClick);
  }
  updateHeaderScreenName = (evt) => {
    if (evt.which === 13) {
      return this.handleCheckClick();
    }
    const classes = this.screenNamePrefix.classList;
    if (!this.screenName.value) {
      classes.remove('invalid');
      classes.remove('valid');
      this.headerScreenName.innerText = '@username';
      return false;
    }

    if (!this.screenName.validity.patternMismatch) {
      classes.remove('invalid');
      classes.add('valid');
    } else {
      classes.remove('valid');
      classes.add('invalid');
    }
    this.headerScreenName.innerText = `@${this.screenName.value}`;
    return false;
  };
  handleCheckClick = () => {
    if (this.screenName.validity.valid) {
      this.test(this.screenName.value);
    } else {
      const toolTip = M.Tooltip.init(this.screenName);
      toolTip.isHovered = true;
      toolTip.open();
      window.setTimeout(() => {
        toolTip.close();
        toolTip.destroy();
      }, 5000);
    }
  };
}
