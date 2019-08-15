export default class Task {
  // results
  static container = document.querySelector('#tasks');
  static template = document.getElementById('task-item-template');

  constructor(task) {
    // create task item
    const {
      listItem,
      ...components
    } = Task.createTaskElement(task);

    // raw tasks object from /src/tasks.js
    this.task = task;
    // data-task-id on collapsible element
    this.id = task.id;
    // <li> Element, created from template
    this.listItem = listItem;
    // data-task-component Elements of this task item
    this.components = components;

    // add task item
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

  static createTaskElement(task) {
    const listItem = Task.template.firstElementChild.cloneNode(true);
    const header = listItem.querySelector('[data-task-component="header"]');
    const message = listItem.querySelector('[data-task-component="message"] span');
    const description = listItem.querySelector('[data-task-component="description"]');
    // const faq = listItem.querySelector('[data-task-component="faq"]');
    const icon = listItem.querySelector('[data-task-component="icon"]');

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
      return {
        listItem,
        header,
        message,
        description,
        icon
      };
    }

    description.querySelector('h5').innerText = task.description.title;
    description.querySelector('p').innerHTML = task.description.text;
    return {
      listItem,
      header,
      message,
      description,
      icon
    };
  }
}
