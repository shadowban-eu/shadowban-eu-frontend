export default class UI {
  constructor(test) {
    // user handle input and title synchronisation
    this.screenName = document.getElementById('screenName');
    this.screenNameLabel = document.querySelector('label[for="screenName"]');
    this.screenNamePrefix = document.querySelector('.controls .input-field .prefix');
    this.headerScreenName = document.querySelector('.header-screen_name');
    this.screenName.addEventListener('keyup', this.updateHeaderScreenName, true);
    this.screenName.addEventListener('click', evt => evt.stopPropagation());

    // button, initiating test
    this.checkButton = document.getElementById('check');
    this.checkButton.addEventListener('click', this.handleCheckClick);

    // results
    this.stage = document.querySelector('#stage .collapsible');

    // custom click handler for Materialize Collapsibles
    const handleCollapsibleClick = M.Collapsible.prototype._handleCollapsibleClick;
    M.Collapsible.prototype._handleCollapsibleClick = function _handleCollapsibleClick(evt) {
      evt.stopPropagation();
      // ignore link clicks
      if (evt.target.tagName === 'A') {
        return;
      }
      // ignore everything that's not child of #tasks
      const taskElement = evt.path.filter(element => element.id === 'tasks')[0];
      if (!taskElement) {
        return;
      }

      for (const element of evt.path) {
        const taskId = element.dataset.taskId;
        if (taskId && taskId !== 'checkUser' && taskId !== 'getRefTweet') {
          handleCollapsibleClick.call(this, evt);
          break;
        }
      }
    };
    // Keyboard events disabled entirely
    M.Collapsible.prototype._handleCollapsibleKeydown = () => {};

    this.resultsCollapsible = M.Collapsible.init(this.stage);
    this.stageOpen = false;

    // ban type explanations
    this.tasks = document.querySelector('#tasks');
    this.tasksCollapsible = M.Collapsible.init(this.tasks);

    // actual test function
    this.test = test;
    this.showTasks();
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
      this.checkButton.focus(); // remove focus from input field, to close mobile screen kbd
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
      this.resultsCollapsible.open(0);
    }
  };

  unhandledError = () => {
    const incompleteTasks = Array.from(document.querySelectorAll(
      '[data-task-status="pending"],[data-task-status="running"]'
    ));
    window._tsk = incompleteTasks;
    const taskUpdates = incompleteTasks.map(x => ({
      id: x.dataset.taskId,
      status: 'warn',
      msg: 'A server error occured. Failed to test. Please try again later.'
    }));
    this.updateTask(...taskUpdates);
  };

  // update task info; takes one or more objects
  updateTask = (...tasks) => {
    tasks.forEach((task) => {
      const taskEls = Array.isArray(task.id) ? task.id : [task.id];
      for (let i = 0; i < taskEls.length; i += 1) {
        const taskEl = this.stage.querySelector(`[data-task-id="${taskEls[i]}"]`);
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
          case 'warn':
            taskIconClasses.remove('gears');
            taskIcon.innerText = 'error_outline';
            break;
          default:
            break;
        }
        // message
        if (task.msg) {
          const messageElement = taskEl.querySelector('.task-message');
          // messageElement.children.forEach(child => messageElement.removeChild(child));
          const htmlMessage = `<span>${task.msg}</span>`;
          // Yes, innerHTML is a security issue.
          // But this is ok since we are using hardcoded values, only.
          messageElement.innerHTML = htmlMessage;
        }
        // -task-status
        taskEl.dataset.taskStatus = task.status;
      }
    });
  };

  initFromLocation = (location) => {
    const isRoot = location.pathname === '/';
    const searchMatch = location.search.match(/^(\?(?:@|%40)?)([A-Za-z0-9_]{1,15})$/);
    if (isRoot && searchMatch) {
      this.screenName.value = searchMatch[2];
      this.screenNameLabel.classList.add('active');
      this.updateHeaderScreenName({
        stopPropagation: () => {},
        which: 20
      });
    }
  };

  // resets tasks to initial state (do this before each test!)
  reset = screenName => this.updateTask({
    id: 'checkUser',
    status: 'running',
    msg: `Looking up user @${screenName}`
  }, {
    id: ['checkSearch', 'checkConventional', 'checkRefTweet'],
    status: 'pending',
    msg: 'Waiting for user.'
  });

  // Prevents running multiple tests at the same time (disables button/{Enter} on handle <input>);
  // otherwise the updateTask() calls would mess up the results
  lock = () => { this.checkButton.disabled = true; };

  // Enable button/{Enter} event
  release = () => { this.checkButton.disabled = false; };
}
