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
]

function isSupportedHost(hostname) {
    for (let i = 0; i < projectHosts.length; i++) {
        const host = projectHosts[i];
        if (hostname.endsWith(host)) {
            return true;
        }
    }
    return false;
}

function initializePageAction(tab) {
    if (isSupportedHost(new URL(tab.url).hostname)) browser.pageAction.show(tab.id);
}
  
browser.tabs.query({}).then((tabs) => {
    for (let tab of tabs) initializePageAction(tab);
});
  
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => initializePageAction(tab));
