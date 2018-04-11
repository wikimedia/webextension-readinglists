const assert = require('assert');
const { URL } = require('url');

const background = require('../background');
const isSupportedHost = background.testing.isSupportedHost;
const isSavablePage = background.testing.isSavablePage;

describe('background.js', () => {

    it('detects supported and unsupported hosts', () => {
        assert.ok(isSupportedHost('en.wikipedia.org'));
        assert.ok(isSupportedHost('fr.wikivoyage.org'));
        assert.ok(isSupportedHost('www.wikidata.org'));
        assert.ok(isSupportedHost('www.mediawiki.org'));
        assert.ok(isSupportedHost('wikidata.org'));
        assert.ok(isSupportedHost('mediawiki.org'));
        assert.ok(isSupportedHost('species.wikimedia.org'));
        assert.ok(!isSupportedHost('wikimediafoundation.org'));
        assert.ok(!isSupportedHost('wikimedia.org'));
        assert.ok(!isSupportedHost('gerrit.wikimedia.org'));
        assert.ok(!isSupportedHost('www.google.com'));
    });

    it('detects valid page URLs', () => {
        const validPage = (url) => isSavablePage(new URL(url).pathname, new URL(url).searchParams);
        assert.ok(validPage('https://en.wikipedia.org/wiki/Bananas_Foster'));
        assert.ok(validPage('https://en.wikipedia.org/w/index.php?title=Bananas_Foster'));
        assert.ok(!validPage('https://is.wikipedia.org/api/rest_v1/feed/announcements'));
        assert.ok(!validPage('https://fr.wikipedia.org/w/api.php?action=query&meta=tokens'));
    });

});
