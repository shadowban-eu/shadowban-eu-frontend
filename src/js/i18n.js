/* eslint-disable no-console */
import i18next from 'i18next';
import XHRBackend from 'i18next-xhr-backend';
import BrowserLanguageDetector from 'i18next-browser-languagedetector';

export default class I18N {
  static async init() {
    await i18next
      .use(XHRBackend)
      .use(BrowserLanguageDetector)
      .init({
        fallbackLng: 'en-US',
        debug: process.env.NODE_ENV === 'development',
        ns: ['tasks'],
        defaultNS: 'tasks',
        backend: {
          // load from i18next-gitbook repo
          loadPath: `${process.env.BASE_HREF}/i18n/{{lng}}/{{ns}}.json`,
          crossDomain: false
        }
      });

    i18next.on('languageChanged', () => {
      // some super-master function that resets ALL
      // possible values. Might as well trigger a complete
      // UI reset; tbd...
      // resetContent();
    });
  }

  static changeLng(lng) {
    i18next.changeLanguage(lng);
  }

  /**
   * Sets innerHTML of an `element` to the
   * text/translation provided by `key`
   * @param {HTMLElement} element - Element whose text shall be set
   * @param {String}      key     - i18n key to get text from
   */
  static updateElement(element, key) {
    element.innerHTML = i18next.t(key); // eslint-disable-line
  }
}
