export default class Task {
  // results
  static container = document.querySelector('#tasks');

  static template = document.getElementById('task-item-template');

  constructor(taskData) {
    // create task item
    const {
      listItem,
      ...components
    } = Task.createTaskElement(taskData);

    // raw tasks object from /src/tasks.js
    this.taskData = taskData;
    // data-task-id on collapsible element
    this.id = taskData.id;
    // <li> Element, created from template
    this.listItem = listItem;
    // data-task-component Elements of this task item
    this.components = components;

    // add task item
    Task.container.insertAdjacentElement('beforeend', this.listItem);
  }

  update(status, msg) {
    // icon
    const { icon } = this.components;
    switch (status) {
      case 'running':
        icon.classList.add('gears');
        icon.innerText = '';
        break;
      case 'pending':
        icon.classList.remove('gears');
        icon.innerText = 'access_time';
        break;
      case 'ok':
        icon.classList.remove('gears');
        icon.innerText = 'check';
        break;
      case 'ban':
        icon.classList.remove('gears');
        icon.innerText = 'error_outline';
        break;
      case 'reset':
        icon.classList.remove('gears');
        icon.innerText = 'contact_support';
        break;
      case 'warn':
        icon.classList.remove('gears');
        icon.innerText = 'contact_support';
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
      this.components.message.innerHTML = htmlMessage;
    }
    // -task-status
    this.listItem.dataset.taskStatus = status;
  }

  static createTaskElement(task) {
    const listItem = Task.template.firstElementChild.cloneNode(true);
    const header = listItem.querySelector('[data-task-component="header"]');
    const message = listItem.querySelector('[data-task-component="message"]');
    const description = listItem.querySelector('[data-task-component="description"]');
    const faq = listItem.querySelector('[data-task-component="faq"]');
    const icon = listItem.querySelector('[data-task-component="icon"]');
    const hint = listItem.querySelector('[data-task-component="hint"]');

    // set task id
    listItem.dataset.taskId = task.id;
    // collapsible header shall not be clickable; sometimes
    if (task.nonInteractive) {
      header.setAttribute('collapsible-non-interactive', '');
    }

    // set initial message
    message.innerHTML = `<span>${task.message}</span>`;
    // set the icon
    icon.innerText = task.icon || '';

    // if there's no description, there also won't
    // be an FAQ; we're done
    if (!task.description) {
      description.remove();
      hint.remove();
      return {
        listItem,
        header,
        message,
        icon
      };
    }
    description.querySelector('h5').innerText = task.description.title;
    description.querySelector('p').innerHTML = task.description.text;

    if (!task.faq || !task.faq.id) {
      faq.remove();
      return {
        listItem,
        header,
        message,
        icon,
        hint
      };
    }

    faq.id = task.faq.id;

    return {
      listItem,
      header,
      message,
      description,
      icon,
      faq,
      hint
    };
  }
}
