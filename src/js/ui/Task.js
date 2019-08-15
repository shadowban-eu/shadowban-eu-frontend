export default class Task {
  // results
  static container = document.querySelector('#tasks');
  static template = document.getElementById('task-item-template');

  constructor(task) {
    this.id = task.id;
    this.listItem = Task.createListItem(task);

    Task.container.insertAdjacentElement('beforeend', this.listItem);
  }

  update(status, msg) {
    const iconClassList = this.icon.classList;

    // icon
    switch (status) {
      case 'running':
        this.icon.innerText = '';
        break;
      case 'pending':
        iconClassList.remove('gears');
        this.icon.innerText = 'access_time';
        break;
      case 'ok':
        iconClassList.remove('gears');
        this.icon.innerText = 'check';
        break;
      case 'ban':
        iconClassList.remove('gears');
        this.icon.innerText = 'error_outline';
        break;
      case 'reset':
        iconClassList.remove('gears');
        this.icon.innerText = 'contact_support';
        break;
      case 'warn':
        iconClassList.remove('gears');
        this.icon.innerText = 'error_outline';
        break;
      default:
        break;
    }
    // message
    if (msg) {
      // messageElement.children.forEach(child => messageElement.removeChild(child));
      const htmlMessage = `<span>${msg}</span>`;
      // Yes, innerHTML is a security issue.
      // But this is ok since we are using hardcoded values, only.
      this.messageElement.innerHTML = htmlMessage;
    }
    // -task-status
    this.element.dataset.taskStatus = status;
  }

  static createListItem(task) {
    const item = Task.template.firstElementChild.cloneNode(true);
    const header = item.querySelector('[data-task-component="header"]');
    const message = item.querySelector('[data-task-component="message"] span');
    const description = item.querySelector('[data-task-component="description"]');
    // const faq = item.querySelector('[data-task-component="faq"]');
    const icon = item.querySelector('[data-task-component="icon"]');

    // set task id
    header.dataset.taskId = task.id;
    // collapsible header shall not be clickable; sometimes
    if (task.nonInteractive) {
      header.setAttribute('collapsible-non-interactive', '');
    }

    // set initial message
    message.innerText = task.message;
    // set the icon
    icon.innerText = task.icon || '';

    // if there's no description, there also won't
    // be an FAQ; we're done
    if (!task.description) {
      description.remove();
      return item;
    }

    description.querySelector('h5').innerText = task.description.title;
    description.querySelector('p').innerHTML = task.description.text;
    return item;
  }
}
