export default (complete) => {
  const markup = document.getElementById('qf-setting-toast-template');
  return M.toast({
    html: markup.innerHTML,
    displayLength: Infinity,
    classes: 'qf-setting-toast',
    completeCallback: complete
  });
};
