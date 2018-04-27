browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'wikiExtensionGetPageTitle') {
        return Promise.resolve({ href: document.querySelector('link[rel=canonical]').href });
    }
});
