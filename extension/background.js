const projectHosts = [
    'wikipedia.org',
    'wikivoyage.org'
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
    } else {
        browser.pageAction.hide(tab.id);
    }
}
  
browser.tabs.query({}).then((tabs) => {
    for (let tab of tabs) initializePageAction(tab);
});
  
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => initializePageAction(tab));
