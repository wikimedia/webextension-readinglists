browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'wikiExtensionGetPageTitle') {
        return Promise.resolve({ href: document.querySelector('link[rel=canonical]').href });
    }
});
