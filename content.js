browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'wikiExtensionGetPageTitle') {
        return Promise.resolve({ title: new URL(document.querySelector('link[rel=edit]').href).searchParams.get('title') });
    }
});
