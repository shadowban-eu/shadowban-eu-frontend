/* eslint-disable no-console */
import i18next from 'i18next';
import XHRBackend from 'i18next-xhr-backend';
import BrowserLanguageDetector from 'i18next-browser-languagedetector';

const updateContent = (element) => {
  console.log(i18next.t('checkUser.message'));
};

const changeLng = (lng) => {
  i18next.changeLanguage(lng);
};

i18next.on('languageChanged', () => {
  updateContent();
});

const load = () => i18next
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

export default load;
