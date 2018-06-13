export default class UI {
  constructor(test) {
    // user handle input and title synchronisation
    this.screenName = document.getElementById('screenName');
    this.screenNamePrefix = document.querySelector('.controls .input-field .prefix');
    this.headerScreenName = document.querySelector('.header-screen_name');
    this.screenName.addEventListener('keyup', this.updateHeaderScreenName, true);
    this.screenName.addEventListener('click', evt => evt.stopPropagation());

    // button, initiating test
    this.checkButton = document.getElementById('check');
    this.checkButton.addEventListener('click', this.handleCheckClick);

    // results
    this.stage = document.querySelector('#stage .collapsible');
    // crow bar approach to disable click and keydown handlers on Collapsible
    // BEWARE: This disables handlers for all instances of Collapsibles.
    //         Explicit opening (.open) still works, but you will have to find another
    //         approach, if you need interactive ones
    M.Collapsible.prototype._handleCollapsibleClick = () => {};
    M.Collapsible.prototype._handleCollapsibleKeydown = () => {};

    this.taskCollapsible = M.Collapsible.init(this.stage);
    this.taskCollapsible._removeEventHandlers();
    this.stageOpen = false;

    // actual test function
    this.test = test;
  }

  // user handle input, title sync
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

  // click handler for test initiator button
  handleCheckClick = (evt) => {
    evt.stopPropagation();
    if (this.checkButton.disabled) {
      return;
    }

    if (this.screenName.validity.valid) {
      this.showTasks();
      this.reset(this.screenName);
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

  // open/show results list
  showTasks = () => {
    if (!this.stageOpen) {
      this.stageOpen = true;
      this.taskCollapsible.open(0);
    }
  };

  // update task info; takes one or more objects
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

  // resets tasks to initial state (do this before each test!)
  reset = screenName => this.updateTask({
    id: 'checkUser',
    status: 'running',
    msg: `Looking up user @${screenName}`
  }, {
    id: 'checkConventional',
    status: 'pending',
    msg: 'Waiting for user.'
  }, {
    id: 'getRefTweet',
    status: 'pending',
    msg: 'Waiting for user.'
  }, {
    id: 'checkRefTweet',
    status: 'pending',
    msg: 'Waiting for reference tweet.'
  });

  // Prevents running multiple tests at the same time (disables button/{Enter} on handle <input>);
  // otherwise the updateTask() calls would mess up the results
  lock = () => { this.checkButton.disabled = true; };

  // Enable button/{Enter} event
  release = () => { this.checkButton.disabled = false; };
}
