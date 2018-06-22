/**
 * Maps an Array of `id`s to task Objects, which all have the same,
 * supplied `status` and `message`
 * @param  {Array<String>} ids
 * @param  {Object<String: String>} data
 * @return {Array<Object>}
 */
const tasksFromIdArray = (ids, data) => {
  return ids.map(taskId => ({
    id: taskId,
    status: data.status,
    msg: data.message
  }));
};

const resetTasks = (screenName) => {
  const tasks = [{
    id: 'checkUser',
    status: 'running',
    msg: `Looking up user @${screenName}`
  }].concat(tasksFromIdArray([
    'checkSearch',
    'checkConventional',
    'getRefTweet',
    'checkRefTweet'
  ], {
    status: 'pending',
    message: 'Waiting for user.'
  }));
  window.ui.setTask(...tasks);
};

export default {
  resetTasks
};
