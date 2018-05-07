const assert = require('assert');
const { URL } = require('url');

const popup = require('../popup').testing;
const mobileToCanonicalHost = popup.mobileToCanonicalHost;
const getAddToListPostBody = popup.getAddToListPostBody;
const constructLoginUrl = popup.constructLoginUrl;
const parseTitleFromUrl = popup.parseTitleFromUrl;
const parseDefaultListId = popup.parseDefaultListId;

describe('popup.js', () => {

    it('converts mobile to canonical hostnames', () => {
        assert.deepEqual(mobileToCanonicalHost(new URL('https://en.m.wikivoyage.org')), new URL('https://en.wikivoyage.org'));
        assert.deepEqual(mobileToCanonicalHost(new URL('https://m.mediawiki.org')), new URL('https://mediawiki.org'));
        assert.deepEqual(mobileToCanonicalHost(new URL('https://de.wikibooks.org')), new URL('https://de.wikibooks.org'));
    });

    it('parses title from /wiki/ path or index.php \'title\' param', () => {
        assert.deepEqual(parseTitleFromUrl(new URL('https://en.wikipedia.org/wiki/Foobar')), 'Foobar');
        assert.deepEqual(parseTitleFromUrl(new URL('https://fr.wikipedia.org/w/index.php?title=Paso_Fino')), 'Paso_Fino');
    });

    it('constructs login URLs with returnto and returntoquery params as needed', () => {
        assert.deepEqual(constructLoginUrl(new URL('https://en.wikipedia.org/wiki/Curling')),
            `https://en.wikipedia.org/wiki/Special:UserLogin?returnto=Curling`);
        assert.deepEqual(constructLoginUrl(new URL('https://en.wikipedia.org/wiki/Curling?foo=bar')),
            `https://en.wikipedia.org/wiki/Special:UserLogin?returnto=Curling&returntoquery=foo%3Dbar`);
    });

    it('produces expected POST body', () => {
        assert.deepEqual(getAddToListPostBody(new URL('https://en.wikipedia.org/wiki/Foobar'), 'Foobar'),
            'project=https://en.wikipedia.org&title=Foobar');
        assert.deepEqual(getAddToListPostBody(new URL('https://de.m.wikipedia.org/wiki/Otto_Wagner'), 'Otto_Wagner'),
            'project=https://de.wikipedia.org&title=Otto_Wagner');
        assert.deepEqual(getAddToListPostBody(new URL('https://fr.wikipedia.org/w/index.php?title=Paso_Fino'), 'Paso_Fino'),
            'project=https://fr.wikipedia.org&title=Paso_Fino');
    });

});
