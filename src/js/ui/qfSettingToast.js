export default (onClick, onComplete) => {
  const markup = document.getElementById('qf-setting-toast-template');
  const toast = M.toast({
    html: markup.innerHTML,
    displayLength: Infinity,
    classes: 'qf-setting-toast',
    completeCallback: onComplete
  });
  toast.el.querySelector('button.toast-action').addEventListener('click', onClick);
  return toast;
};
