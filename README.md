# webextension-readinglists

A [WebExtension](https://wiki.mozilla.org/WebExtensions) for users of synchronized reading lists to add a Wikimedia wiki page from the browser.

Adds a page action on supported Wikimedia projects to add the current page to the default reading list for the logged in user.

Compatible with both Firefox and Chromium/Google Chrome courtesy of [webextension-polyfill](https://github.com/mozilla/webextension-polyfill).

See debug installation instructions for [Firefox](https://developer.mozilla.org/en-US/docs/Tools/about%3Adebugging) and [Chrome](https://developer.chrome.com/extensions/getstarted).

## i18n message fetching

This extension bundles message translations provided by the volunteer translators at [TranslateWiki.net](https://translatewiki.net) as part of MediaWiki's [ReadingLists extension](https://www.mediawiki.org/wiki/Extension:ReadingLists). These can be updated from the MediaWiki API at www.mediawiki.org using the `getMessages.js` script.

```
npm install
node getMessages.js
```

Note: Running the tests and i18n message fetching scripts requires Node.js 7.6.0 or newer.

## issues

Please file bugs or feature requests on Phabricator, Wikimedia's issue tracking software. ([link](https://phabricator.wikimedia.org/maniphest/task/edit/form/10/?title=&projects=reading-infrastructure-team-backlog))
