const projectHosts = [
    'wikipedia.org',
    'wikidata.org',
    'wikivoyage.org',
    'wiktionary.org',
    'wikibooks.org',
    'mediawiki.org',
    'wikisource.org',
    'wikiversity.org',
    'wikinews.org',
    'wikiquote.org',
    'meta.wikimedia.org',
    'incubator.wikimedia.org',
    'commons.wikimedia.org',
    'species.wikimedia.org'
];

function isSupportedHost(hostname) {
    for (let i = 0; i < projectHosts.length; i++) {
        const host = projectHosts[i];
        if (hostname.endsWith(host)) {
            return true;
        }
    }
    return false;
}

function isSavablePage(path, params) {
    return path.includes('/wiki/') || (path.includes('index.php') && params.has('title'));
}

function initializePageAction(tab) {
    const url = new URL(tab.url);
    if (isSupportedHost(url.hostname) && isSavablePage(url.pathname, url.searchParams)) {
        browser.pageAction.show(tab.id);
    }
}

// Attempt a query first so this doesn't break unit testing
if (browser.tabs.query({})) {
    browser.tabs.query({}).then((tabs) => {
        for (let tab of tabs) initializePageAction(tab);
    });
}
  
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => initializePageAction(tab));

module.exports = {
    testing: {
        isSupportedHost,
        isSavablePage
    }
}
