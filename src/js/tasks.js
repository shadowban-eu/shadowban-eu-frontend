import i18next from 'i18next';

/**
 * @typedef {TaskData}
 * @property {String} id                - String id that will be put onto task item's
 *                                        collapsible header in `data-task-id`
 * @property {Number} idx               - Index for sorting. Lower indexes will be put higher
 *                                        in the <ul>, i.e. idx: 0 will be top-most <li>
 * @property {String} ?message          - Initial message that will be displayed on
 *                                        Collapsible header. Deaults to empty String, when falsy
 * @property {String} icon              - String value for material design icon
 *                                        (innerText of <i> Element)
 * @property {Bool}   ?nonInterActive   - Whether `collapsible-non-interactive` attribute
 *                                        should be added to the Collapsible, thus making
 *                                        it non-clickable. Defaults to false
 * @property {Object} ?description      - Description data for task item. If omitted, the
 *                                        Collapsible will not have a `.collapsible-body`.
 * @property {String} description.title - String shown as title of description (.collapsible-body)
 * @property {String} description.text  - String shown as description text (.collapsible-body)
 * @property {Object} ?faq              - FAQ data for task item. If omitted, the task item will not
 *                                        have FAQ/TechInfo Collapsible in its description.
 * @property {String} faq.id            - id of FAQ <ul> element
 */
const construct = () => [{
  id: 'checkUser',
  idx: 0, // used to determine place in list; 0 = top-most item
  message: i18next.t('tasks:checkUser.message'),
  icon: '',
  nonInteractive: true
}, {
  id: 'checkBarrier',
  idx: 4,
  message: i18next.t('tasks:checkBarrier.message'),
  icon: 'contact_support',
  nonInteractive: false,
  description: {
    title: i18next.t('tasks:checkBarrier.description.title'),
    text: i18next.t('tasks:checkBarrier.description.text')
  },
  faq: { id: 'barrierFAQ' }
}, {
  id: 'checkSuggest',
  idx: 1,
  message: i18next.t('tasks:checkSuggest.message'),
  icon: 'contact_support',
  nonInteractive: false,
  description: {
    title: i18next.t('tasks:checkSuggest.description.title'),
    text: i18next.t('tasks:checkSuggest.description.text')
  }
}, {
  id: 'checkSearch',
  idx: 2,
  message: i18next.t('tasks:checkSearch.message'),
  icon: 'contact_support',
  nonInteractive: false,
  description: {
    title: i18next.t('tasks:checkSearch.description.title'),
    text: i18next.t('tasks:checkSearch.description.text')
  },
  faq: { id: 'searchFAQ' }
}, {
  id: 'checkConventional',
  idx: 3,
  message: i18next.t('tasks:checkConventional.message'),
  icon: 'contact_support',
  nonInteractive: false,
  description: {
    title: i18next.t('tasks:checkConventional.description.title'),
    text: i18next.t('tasks:checkConventional.description.text')
  },
  faq: { id: 'threadFAQ' }
}];

export default construct;
