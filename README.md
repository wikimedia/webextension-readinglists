# webextension-readinglists
A [WebExtension](https://wiki.mozilla.org/WebExtensions) for users of synchronized reading lists to add a Wikimedia wiki page from the browser.

Adds a page action on supported Wikimedia projects to add the current page to the default reading list for the logged in user. 

Compatible with both Firefox and Chromium/Google Chrome courtesy of [webextension-polyfill](https://github.com/mozilla/webextension-polyfill).

See debug installation instructions for [Firefox](https://developer.mozilla.org/en-US/docs/Tools/about%3Adebugging) and [Chrome](https://developer.chrome.com/extensions/getstarted).

## Testing (requires Node.js)
Running the unit tests requires Node.js. Unit tests are run with [mocha](https://github.com/mochajs/mocha). Browser API mocking is provided by [sinon-chrome](https://github.com/acvetkov/sinon-chrome).

```
npm install
npm test
```

Note: Running the tests and i18n message fetching scripts requires Node.js 7.6.0 or newer.
