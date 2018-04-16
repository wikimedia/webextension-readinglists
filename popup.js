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

function parseTitleFromUrl(url) {
    return url.searchParams.has('title') ? url.searchParams.get('title') : url.pathname.replace('/wiki/', '');
}

function show(id) {
    // Use setTimeout to work around an extension popup resizing bug on Chrome
    // see https://bugs.chromium.org/p/chromium/issues/detail?id=428044
    setTimeout(() => { document.getElementById(id).style.display = 'block' }, 50);
}

function showLoginPage(url) {
    let loginUrl = `${url.origin}/wiki/Special:UserLogin?returnto=${encodeURIComponent(parseTitleFromUrl(url))}`;
    if (url.search) {
        loginUrl = loginUrl.concat(`&returntoquery=${encodeURIComponent(url.search.slice(1))}`);
    }
    browser.tabs.update({ url: loginUrl });
}

function showLoginPrompt(url) {
    document.getElementById('loginButton').onclick = (element) => showLoginPage(url);
    show('loginPromptContainer');
}

function showAddToListSuccessMessage() {
    show('addToListSuccessContainer');
}

function showAddToListFailureMessage(res) {
    document.getElementById('failureReason').textContent = res.detail ? res.detail : res.title ? res.title : res.type ? res.type : res;
    show('addToListFailedContainer');
}

function mobileToCanonicalHost(url) {
    url.hostname = url.hostname.replace(/^m\./, '').replace('.m.', '.');
    return url;
}

function getAddToListPostBody(url) {
    return `project=${mobileToCanonicalHost(url).origin}&title=${encodeURIComponent(parseTitleFromUrl(url))}`;
}

function getAddToListPostOptions(url) {
    return {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        credentials: 'same-origin',
        body: getAddToListPostBody(url)
    }
}

function handleAddPageToListResult(res) {
    if (res.id) showAddToListSuccessMessage(); else showAddToListFailureMessage(res);
}

function addPageToDefaultList(url, listId, token) {
    return fetch(readingListPostEntryUrlForOrigin(url.origin, listId, token), getAddToListPostOptions(url))
    .then(res => res.json())
    .then(res => handleAddPageToListResult(res));
}

function handleTokenResult(url, token) {
    return token === '+\\' ? showLoginPrompt(url) : getDefaultListId(url).then(listId => addPageToDefaultList(url, listId, token));
}

function handleClick(url) {
    return getCsrfToken(url.origin).then(token => handleTokenResult(url, token));
}

browser.tabs.query({currentWindow: true, active: true}).then(tabs => {
    return handleClick(new URL(tabs[0].url))
    .catch(err => showAddToListFailureMessage(err));
});
