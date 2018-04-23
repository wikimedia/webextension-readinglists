function getReadingListsUrlForOrigin(origin) {
    return `${origin}/api/rest_v1/data/lists/`;
}

function readingListSetupUrlForOrigin(origin, token) {
    return `${origin}/api/rest_v1/data/lists/setup?csrf_token=${encodeURIComponent(token)}`;
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

function getDefaultListId(url) {
    return fetch(getReadingListsUrlForOrigin(url.origin), { credentials: 'same-origin' })
    .then(res => {
        if (!res.ok) {
            return setUpReadingListsForUser(url)
            .then(res => getDefaultListId(url));
        }
        return res.json()
        .then(res => res.lists.filter(list => list.default)[0].id);
    })
}

function setUpReadingListsForUser(url) {
    return getCsrfToken(url.origin)
    .then(token => fetch(readingListSetupUrlForOrigin(url.origin, token), { method: 'POST', credentials: 'same-origin' }));
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
    return getCanonicalPageTitle(tab).then(title => {
        document.getElementById('loginButton').onclick = (element) => showLoginPage(url, title);
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
    return browser.tabs.sendMessage(tab.id, { type: 'wikiExtensionGetPageTitle' }).then(res => parseTitleFromUrl(res.href));
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

getCurrentTab().then(tab => {
    return handleClick(tab, new URL(tab.url))
    .catch(err => showAddToListFailureMessage(err));
});
