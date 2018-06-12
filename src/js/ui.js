export default class UI {
  constructor(test) {
    this.screenName = document.getElementById('screenName');
    this.screenNamePrefix = document.querySelector('.controls .input-field .prefix');
    this.headerScreenName = document.querySelector('.header-screen_name');
    this.screenName.addEventListener('keyup', this.updateHeaderScreenName, true);
    this.screenName.addEventListener('click', evt => evt.stopPropagation());

    this.checkButton = document.getElementById('check');
    this.test = test;
    this.release();

    this.stage = document.querySelector('#stage .collapsible');
    // crow bar approach to disable click and keydown handlers on Collapsible
    M.Collapsible.prototype._handleCollapsibleClick = () => {};
    M.Collapsible.prototype._handleCollapsibleKeydown = () => {};

    this.taskCollapsible = M.Collapsible.init(this.stage);
    this.taskCollapsible._removeEventHandlers();
    this.stageOpen = false;

    this.locked = false;
  }

  updateHeaderScreenName = (evt) => {
    evt.stopPropagation();
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
    if (this.locked) {
      return;
    }

    if (this.screenName.validity.valid) {
      this.showTasks();
      this.reset();
      this.lock();
      this.test(this.screenName.value)
        .then(this.release)
        .catch(this.release);
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
    if (!this.stageOpen) {
      this.stageOpen = true;
      this.taskCollapsible.open(0);
    }
  };

  updateTask = (...tasks) => {
    tasks.forEach((task) => {
      const taskEl = this.stage.querySelector(`[data-task-id="${task.id}"]`);
      const taskIcon = taskEl.querySelector('.material-icons');
      const taskIconClasses = taskIcon.classList;
      // icon
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
      // message
      if (task.msg) {
        taskEl.querySelector('.task-message').innerText = task.msg;
      }
      // -task-status
      taskEl.dataset.taskStatus = task.status;
    });
  };

  reset = () => this.updateTask({
    id: 'getRefTweet',
    status: 'running',
    msg: 'Getting reference tweet...'
  }, {
    id: 'checkRefTweet',
    status: 'pending',
    msg: 'Waiting for reference tweet.'
  });

  lock = () => {
    this.checkButton.removeEventListener('click', this.handleCheckClick);
    this.checkButton.setAttribute('locked', '');
    this.locked = true;
  };

  release = () => {
    this.checkButton.addEventListener('click', this.handleCheckClick);
    this.checkButton.removeAttribute('locked');
    this.locked = false;
  };
}
