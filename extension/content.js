browser.runtime.onMessage.addListener(message => {
  if (message.type === "wikiExtensionGetPageTitle") {
    return Promise.resolve({
      href: document.querySelector("link[rel=canonical]").href
    });
  }
});

browser.runtime.onMessage.addListener(message => {
  if (message.type === "wikiExtensionGetPageNamespace") {
    // Equivalent to `mw.config.get( 'wgNamespaceNumber' )`. We have to scrape the
    // value from the script source because content scripts do not share an execution
    // environment with other JavaScript code.
    const nodes = document.querySelectorAll("script");
    for (let i = 0; i < nodes.length; i++) {
      const match = /"wgNamespaceNumber":\s*(\d+)/.exec(nodes[i].innerText);
      if (match) {
        return Promise.resolve({ ns: parseInt(match[1], 10) });
      }
    }
  }
});
