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

function parseTitleFromUrl(url) {
    return url.searchParams.has('title') ? url.searchParams.get('title') : url.pathname.replace('/wiki/', '');
}

function show(id) {
    // Use setTimeout to work around an extension popup resizing bug on Chrome
    // see https://bugs.chromium.org/p/chromium/issues/detail?id=428044
    setTimeout(() => { document.getElementById(id).style.display = 'block' }, 200);
}

function constructLoginUrl(url) {
    let result = `${url.origin}/wiki/Special:UserLogin?returnto=${encodeURIComponent(parseTitleFromUrl(url))}`;
    if (url.search) {
        result = result.concat(`&returntoquery=${encodeURIComponent(url.search.slice(1))}`);
    }
    return result;
}

function showLoginPage(url) {
    browser.tabs.update({ url: constructLoginUrl(url) });
}

function showLoginPrompt(tab, url) {
    return getCanonicalPageTitle(tab).then(title => {
        document.getElementById('loginButton').onclick = () => showLoginPage(url, title);
        show('loginPromptContainer');
    });
}

function showAddToListSuccessMessage() {
    show('addToListSuccessContainer');
}

function showAddToListFailureMessage(res) {
    document.getElementById('failureReason').textContent = res.detail ? res.detail : res.title ? res.title : res.type ? res.type : typeof res === 'object' ? JSON.stringify(res) : res;
    show('addToListFailedContainer');
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

function handleAddPageToListResult(res) {
    if (res.id) showAddToListSuccessMessage(); else showAddToListFailureMessage(res);
}

function getCanonicalPageTitle(tab) {
    return browser.tabs.sendMessage(tab.id, { type: 'wikiExtensionGetPageTitle' }).then(res => parseTitleFromUrl(new URL(res.href)));
}

function addPageToDefaultList(tab, url, listId, token) {
    return getCanonicalPageTitle(tab)
    .then(title => fetch(readingListPostEntryUrlForOrigin(url.origin, listId, token), getAddToListPostOptions(url, title)))
    .then(res => res.json())
    .then(res => handleAddPageToListResult(res));
}

function handleTokenResult(tab, url, token) {
    return token === '+\\' ? showLoginPrompt(tab, url) : getDefaultListId(url).then(listId => addPageToDefaultList(tab, url, listId, token));
}

function handleClick(tab, url) {
    return getCsrfToken(url.origin).then(token => handleTokenResult(tab, url, token));
}

// Attempt a query first so this doesn't break unit testing
if (browser.tabs.query({})) {
    getCurrentTab().then(tab => {
        return handleClick(tab, new URL(tab.url))
        .catch(err => showAddToListFailureMessage(err));
    });
}

module.exports = {
    testing: {
        mobileToCanonicalHost,
        getAddToListPostBody,
        constructLoginUrl,
        parseTitleFromUrl
    }
};
