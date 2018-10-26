const supportedHosts = ["wikipedia.org", "wikivoyage.org"];

const supportedNamespaces = [
  0 // NS_MAIN
];

function isSupportedHost(hostname) {
  for (let i = 0; i < supportedHosts.length; i++) {
    const host = supportedHosts[i];
    if (hostname.endsWith(host)) {
      return true;
    }
  }
  return false;
}

function isSupportedNamespace(ns) {
  return supportedNamespaces.includes(ns);
}

function isSavablePage(path, params) {
  return (
    path.includes("/wiki/") ||
    (path.includes("index.php") && params.has("title"))
  );
}

function shouldShowPageAction(url, ns) {
  return (
    isSupportedHost(url.hostname) &&
    isSupportedNamespace(ns) &&
    isSavablePage(url.pathname, url.searchParams)
  );
}

function initializePageAction(tab) {
  const url = new URL(tab.url);
  browser.tabs
    .sendMessage(tab.id, { type: "wikiExtensionGetPageNamespace" })
    .then(res => {
      if (shouldShowPageAction(url, res.ns)) {
        browser.pageAction.show(tab.id);
      } else {
        browser.pageAction.hide(tab.id);
      }
    });
}

browser.tabs.query({}).then(tabs => {
  for (let tab of tabs) initializePageAction(tab);
});

browser.tabs.onUpdated.addListener((id, changeInfo, tab) =>
  initializePageAction(tab)
);
