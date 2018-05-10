const MESSAGE_KEYS = {
    enableSync: 'readinglists-browser-enable-sync-prompt',
    entryLimitExceeded: 'readinglists-browser-list-entry-limit-exceeded',
    errorIntro: 'readinglists-browser-error-intro',
    infoLinkText: 'readinglists-browser-extension-info-link-text',
    loginButtonText: 'login',
    loginPrompt: 'readinglists-browser-login-prompt',
    success: 'readinglists-browser-add-entry-success'
}

const ALLMESSAGES_QUERY = {
    action: 'query',
    format: 'json',
    formatversion: '2',
    meta: 'allmessages',
    amenableparser: ''
};

function objToQueryString(obj) {
    return Object.keys(obj).map(key => `${key}=${obj[key]}`).join('&');
}

function getReadingListsUrlForOrigin(origin, next) {
    let result = `${origin}/api/rest_v1/data/lists/`;
    if (next) {
        result = result.concat(`?next=${next}`);
    }
    return result;
}

function readingListPostEntryUrlForOrigin(origin, listId, token) {
    return `${origin}/api/rest_v1/data/lists/${listId}/entries/?csrf_token=${encodeURIComponent(token)}`;
}

function csrfFetchUrlForOrigin(origin) {
    return `${origin}/w/api.php?action=query&format=json&formatversion=2&meta=tokens&type=csrf`;
}

function geti18nMessageUrl(origin, keys) {
    return `${origin}/w/api.php?${objToQueryString(Object.assign(ALLMESSAGES_QUERY, { ammessages: keys.join('|') }))}`;
}

function fetchBundledMessagesForLang(lang) {
    return fetch(browser.extension.getURL(`i18n/${lang}.json`));
}

function getBundledMessage(lang, keys) {
    return fetchBundledMessagesForLang(lang).then(res => res.json()).then(res => {
        const result = {};
        keys.forEach(key => {
            result[key] = res[key];
        });
        return result;
    });
}

/**
 * Get UI messages from the MediaWiki API (in the user's preferred UI lang), falling back to bundled
 * English strings if this fails.
 * @param {string} origin the origin of the site URL
 * @param {Array[string]} keys message keys to request
 */
function geti18nMessages(origin, keys) {
    return fetch(geti18nMessageUrl(origin, keys), { credentials: 'same-origin' })
    .then(res => {
        if (!res.ok) {
            throw res;
        } else {
            return res.json();
        }
    })
    .then(res => {
        if (res.query && res.query.allmessages && res.query.allmessages.length) {
            const result = {};
            res.query.allmessages.forEach(messageObj => {
                result[messageObj.name] = messageObj.content;
            });
            return result;
        } else {
            return getBundledMessage('en', keys);
        }
    });
}

function getCurrentTab() {
    return browser.tabs.query({currentWindow: true, active: true}).then(tabs => tabs[0]);
}

function getCsrfToken(origin) {
    return fetch(csrfFetchUrlForOrigin(origin), { credentials: 'same-origin' })
    .then(res => res.json())
    .then(res => res.query.tokens.csrftoken);
}

function getDefaultListId(url, next) {
    return fetch(getReadingListsUrlForOrigin(url.origin, next), { credentials: 'same-origin' })
    .then(res => {
        if (res.status < 200 || res.status > 399) {
            return res.json().then(res => {
                // Must be thrown from here for Firefox
                throw res;
            });
        } else {
            return res.json();
        }
    })
    .then(res => {
        if (res.status < 200 || res.status > 399) {
            // Must be thrown from here for Chrome
            throw res;
        } else {
            const defaultList = res.lists.filter(list => list.default)[0];
            if (defaultList) {
                return defaultList.id;
            } else if (res.next) {
                return getDefaultListId(url, res.next);
            } else {
                throw new Error("no default list");
            }
        }
    });
}

function parseTitleFromUrl(href) {
    const url = new URL(href);
    return url.searchParams.has('title') ? url.searchParams.get('title') : url.pathname.replace('/wiki/', '');
}

function show(id) {
    // Use setTimeout to work around an extension popup resizing bug on Chrome
    // see https://bugs.chromium.org/p/chromium/issues/detail?id=428044
    setTimeout(() => { document.getElementById(id).style.display = 'block' }, 200);
}

function showLoginPage(url, title) {
    let loginUrl = `${url.origin}/wiki/Special:UserLogin?returnto=${encodeURIComponent(title)}`;
    if (url.search) {
        loginUrl = loginUrl.concat(`&returntoquery=${encodeURIComponent(url.search.slice(1))}`);
    }
    browser.tabs.update({ url: loginUrl });
}

function showLoginPrompt(tab, url) {
    return geti18nMessages(url.origin, [ MESSAGE_KEYS.loginPrompt, MESSAGE_KEYS.loginButtonText ])
    .then(messages => getCanonicalPageTitle(tab)
    .then(title => {
        document.getElementById('loginPromptText').textContent = messages[MESSAGE_KEYS.loginPrompt];
        document.getElementById('loginButton').textContent = messages[MESSAGE_KEYS.loginButtonText];
        document.getElementById('loginButton').onclick = () => showLoginPage(url, title);
        show('loginPromptContainer');
    }));
}

function showAddToListSuccessMessage(tab, url) {
    return geti18nMessages(url.origin, [ MESSAGE_KEYS.success ])
    .then(messages => getCanonicalPageTitle(tab)
    .then(title => {
        const message = messages[MESSAGE_KEYS.success].replace('$1', title.replace(/_/g, ' '));
        document.getElementById('successText').textContent = message;
        show('addToListSuccessContainer');
    }));
}

function showAddToListFailureMessage(url, res) {
    return geti18nMessages(url.origin, [
        MESSAGE_KEYS.enableSync,
        MESSAGE_KEYS.infoLinkText,
        MESSAGE_KEYS.entryLimitExceeded,
        MESSAGE_KEYS.errorIntro
    ])
    .then(messages => {
        let message;
        if (res.title === 'readinglists-db-error-not-set-up') {
            message = messages[MESSAGE_KEYS.enableSync];
            const learnMoreLink = document.getElementById('learnMoreLink');
            learnMoreLink.textContent = messages[MESSAGE_KEYS.infoLinkText];
            learnMoreLink.onclick = () => browser.tabs.create({ url: learnMoreLink.href });
            document.getElementById('learnMoreLinkContainer').style.display = 'block';
        } else if (res.title === 'readinglists-db-error-entry-limit') {
            const maxEntries = si.query.general['readinglists-config'].maxEntriesPerList;
            message = messages[MESSAGE_KEYS.entryLimitExceeded].replace('$1', maxEntries.toString());
        } else {
            const detail = res.detail ? res.detail : res.title ? res.title : res.type ? res.type : typeof res === 'object' ? JSON.stringify(res) : res;
            message = messages[MESSAGE_KEYS.errorIntro].replace('$1', detail);
        }
        document.getElementById('failureReason').textContent = message;
        show('addToListFailedContainer');
    });
}

function mobileToCanonicalHost(url) {
    url.hostname = url.hostname.replace(/^m\./, '').replace('.m.', '.');
    return url;
}

function getAddToListPostBody(url, title) {
    return `project=${mobileToCanonicalHost(url).origin}&title=${encodeURIComponent(title)}`;
}

function getAddToListPostOptions(url, title) {
    return {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        credentials: 'same-origin',
        body: getAddToListPostBody(url, title)
    }
}

function handleAddPageToListResult(tab, url, res) {
    if (res.id) showAddToListSuccessMessage(tab, url); else showAddToListFailureMessage(url, res);
}

function getCanonicalPageTitle(tab) {
    return browser.tabs.sendMessage(tab.id, { type: 'wikiExtensionGetPageTitle' }).then(res => parseTitleFromUrl(res.href));
}

function addPageToDefaultList(tab, url, listId, token) {
    return getCanonicalPageTitle(tab)
    .then(title => fetch(readingListPostEntryUrlForOrigin(url.origin, listId, token), getAddToListPostOptions(url, title)))
    .then(res => res.json())
    .then(res => handleAddPageToListResult(tab, url, res));
}

function handleTokenResult(tab, url, token) {
    return token === '+\\' ? showLoginPrompt(tab, url) : getDefaultListId(url).then(listId => addPageToDefaultList(tab, url, listId, token));
}

function handleClick(tab, url) {
    return getCsrfToken(url.origin).then(token => handleTokenResult(tab, url, token));
}

getCurrentTab().then(tab => {
    const url = new URL(tab.url);
    return handleClick(tab, url)
    .catch(err => showAddToListFailureMessage(url, err));
});
