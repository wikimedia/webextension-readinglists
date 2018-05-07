const jsonfile = require('jsonfile');
const preq = require('preq');

const DEFAULT_LANGS = [ 'en' ];

const API_BASE_URL = `https://www.mediawiki.org/w/api.php`;

const MESSAGE_KEYS = [
    'login',
    'readinglists-browser-add-entry-success',
    'readinglists-browser-enable-sync-prompt',
    'readinglists-browser-error-intro',
    'readinglists-browser-extension-info-link-text',
    'readinglists-browser-list-entry-limit-exceeded',
    'readinglists-browser-login-prompt'
];

const ALLMESSAGES_QUERY = {
    action: 'query',
    format: 'json',
    formatversion: '2',
    meta: 'allmessages',
    ammessages: MESSAGE_KEYS.join('|'),
    amenableparser: ''
};

function objToQueryString(obj) {
    return Object.keys(obj).map(key => `${key}=${obj[key]}`).join('&');
}

function allMessagesRequestUriForLang(lang) {
    return `${API_BASE_URL}?${objToQueryString(Object.assign(ALLMESSAGES_QUERY, { amlang: lang }))}`;
}

async function getMessages(langs) {
    const messages = {};

    await Promise.all(langs.map(async lang => {
        await preq.get({ uri: allMessagesRequestUriForLang(lang) }).then(res => {
            if (!(res.body && res.body.query && res.body.query.allmessages)) return;
            messages[lang] = {};
            res.body.query.allmessages.forEach(messageObj => messages[lang][messageObj.name] = messageObj.content);
        });
    }));

    return messages;
}

getMessages(DEFAULT_LANGS).then(messages => {
    Object.keys(messages).forEach(lang => jsonfile.writeFile(`i18n/${lang}.json`, messages[lang], { spaces: 2 }, err => {}));
    console.log('Wrote messages to i18n/[lang].json');
});
