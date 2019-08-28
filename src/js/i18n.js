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
        ns: ['common', 'tasks', 'functionality'],
        defaultNS: 'common',
        backend: {
          // load from i18next-gitbook repo
          loadPath: `${process.env.BASE_HREF}/i18n/{{lng}}/{{ns}}.json`,
          crossDomain: false
        }
      });

    I18N.setupInterpolationDefaultsTheHackyWay();

    // i18next.on('languageChanged', () => {
    //   I18N.resetElements();
    // });
  }

  static setupInterpolationDefaultsTheHackyWay() {
    i18next.options.interpolation.defaultVariables = {
      screenName: i18next.t('common:screenNameDefault')
    };
  }

  static changeLng(lng) {
    i18next.changeLanguage(lng);
  }

  static getSingleValue(key) {
    return i18next.t(key);
  }

  /**
   * Sets innerHTML of an `element` to the
   * text/translation of that target's .dataset.i18n value
   * @param {HTMLElement} ...elements - Elements whose text shall be set
   */
  static updateElements(...elements) {
    elements.forEach((el) => {
      el.innerHTML = i18next.t(el.dataset.i18n); // eslint-disable-line
    });
  }

  static updateWithInterpolation(element, interpolation) {
    element.innerHTML = i18next.t(element.dataset.i18n, interpolation); // eslint-disable-line
  }

  static resetElements() {
    I18N.updateElements(...Array.from(document.querySelectorAll('[data-i18n]')));
  }
}
