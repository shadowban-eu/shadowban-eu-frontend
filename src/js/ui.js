export default class UI {
  constructor(test) {
    this.screenName = document.getElementById('screenName');
    this.screenNamePrefix = document.querySelector('.controls .input-field .prefix');
    this.headerScreenName = document.querySelector('.header-screen_name');
    this.screenName.addEventListener('keyup', this.updateHeaderScreenName);
    this.screenName.addEventListener('click', evt => evt.stopPropagation());

    this.checkButton = document.getElementById('check');
    this.test = test;
    this.checkButton.addEventListener('click', this.handleCheckClick);

    this.stage = document.querySelector('#stage .collapsible');
    this.taskCollapsible = null;
  }
  updateHeaderScreenName = (evt) => {
    if (evt.which === 13) {
      return this.handleCheckClick(evt);
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
  handleCheckClick = (evt) => {
    evt.stopPropagation();
    if (this.screenName.validity.valid) {
      this.showTasks();
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
  showTasks = () => {
    this.taskCollapsible = M.Collapsible.init(this.stage);
    this.taskCollapsible.open(0);
  };
  updateTask = (task, msg) => {
    const taskEl = this.stage.querySelector(`[data-task-id="${task.id}"]`);
    const taskIcon = taskEl.querySelector('.material-icons');
    const taskIconClasses = taskIcon.classList;
    switch (task.status) {
      case 'running':
        taskIconClasses.add('gears');
        taskIcon.innerText = '';
        break;
      case 'pending':
        taskIconClasses.remove('gears');
        taskIcon.innerText = 'access_time';
        break;
      case 'ok':
        taskIconClasses.remove('gears');
        taskIcon.innerText = 'check';
        break;
      case 'ban':
        taskIconClasses.remove('gears');
        taskIcon.innerText = 'error_outline';
        break;
      default:
        break;
    }
    if (msg) {
      taskEl.querySelector('.task-message').innerText = msg;
    }
    taskEl.dataset.taskStatus = task.status;
  }
}
