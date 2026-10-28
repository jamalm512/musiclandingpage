import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import subscribe from '../api/subscribe.js';
import preview from '../api/preview.js';
import links from '../api/links.js';
import location from '../api/location.js';
import callback from '../api/callback.js';
import nowPlaying from '../api/now-playing.js';

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
const originalNow = Date.now;
afterEach(() => {
  globalThis.fetch = originalFetch;
  Date.now = originalNow;
  for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
  Object.assign(process.env, originalEnv);
});

function response() {
  return {
    statusCode: 200, headers: {}, body: undefined,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; },
    status(value) { this.statusCode = value; return this; },
    json(value) { this.body = value; return this; },
  };
}
function request(body = {}, extra = {}) {
  return { method: 'POST', headers: { host: 'jxxmalmusik.com', origin: 'https://jxxmalmusik.com' }, body, ...extra };
}
function configured() {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-only-not-a-credential';
}
function noNetwork() { globalThis.fetch = () => assert.fail('Network must not be used by this request'); }
const signup = { email: 'fan@example.com', source: 'inner_circle' };

test('signups persist normalized email and only allowed source without returning subscriber data', async () => {
  configured();
  let saved;
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'https://example.supabase.co/rest/v1/subscribers');
    saved = JSON.parse(options.body);
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Prefer, 'return=minimal');
    assert.ok(options.signal instanceof AbortSignal);
    return new Response(null, { status: 201 });
  };
  const res = response();
  await subscribe(request({ email: '  Fan@Example.COM  ', source: 'bounce_notify' }), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(saved, { email: 'fan@example.com', source: 'bounce_notify' });
  assert.deepEqual(res.body, { success: true });
  assert.equal(res.headers['cache-control'], 'no-store');
});

test('Supabase publishable keys use apikey only while legacy anon JWTs retain Bearer authorization', async () => {
  configured();
  for (const key of ['sb_publishable_test_only_not_a_credential', 'testHeader.testPayload.testSignature']) {
    process.env.SUPABASE_ANON_KEY = key;
    globalThis.fetch = async (_url, options) => {
      assert.equal(options.headers.apikey, key);
      assert.equal(options.headers.Authorization, key.startsWith('sb_publishable_') ? undefined : `Bearer ${key}`);
      return new Response(null, { status: 201 });
    };
    const res = response();
    await subscribe(request(signup), res);
    assert.deepEqual(res.body, { success: true });
  }
});

test('rejects malformed email, array body and unknown signup list before contacting storage', async () => {
  noNetwork();
  for (const body of [{ email: 'bad@email' }, { email: 'x\ny@example.com' }, { ...signup, source: 'admin' }, [], null, '{bad JSON']) {
    const res = response();
    await subscribe(request(body), res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, undefined);
  }
});

test('does not turn unconfigured storage into a successful subscription', async () => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
  noNetwork();
  const res = response();
  await subscribe(request(signup), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.success, undefined);
});

test('rejects cross-origin signups while accepting server clients with no Origin', async () => {
  configured(); noNetwork();
  const blocked = response();
  await subscribe(request(signup, { headers: { host: 'jxxmalmusik.com', origin: 'https://elsewhere.example' } }), blocked);
  assert.equal(blocked.statusCode, 403);
  globalThis.fetch = async () => new Response(null, { status: 201 });
  const allowed = response();
  await subscribe(request(signup, { headers: { host: 'jxxmalmusik.com' } }), allowed);
  assert.equal(allowed.statusCode, 200);
});

test('ignores filled honeypot without writing a subscriber', async () => {
  noNetwork();
  const res = response();
  await subscribe(request({ ...signup, website: 'bot.example' }), res);
  assert.deepEqual(res.body, { success: true });
});

test('treats only expected email-and-list duplicate conflicts as already subscribed', async () => {
  configured();
  for (const [code, constraint, expected] of [['23505', 'subscribers_email_source_unique', 200], ['23505', 'subscribers_email_key', 502], ['23P01', 'subscribers_email_source_unique', 502]]) {
    globalThis.fetch = async () => Response.json({ code, message: `PRIVATE DATABASE DETAILS: duplicate key value violates unique constraint "${constraint}"` }, { status: 409 });
    const res = response();
    await subscribe(request(signup), res);
    assert.equal(res.statusCode, expected);
    assert.ok(!JSON.stringify(res.body).includes('PRIVATE DATABASE DETAILS'));
  }
});

test('network failures and upstream rate limits produce retryable failures', async () => {
  configured();
  globalThis.fetch = async () => { throw new Error('private endpoint failed'); };
  const offline = response();
  await subscribe(request(signup), offline);
  assert.equal(offline.statusCode, 503);
  globalThis.fetch = async () => Response.json({}, { status: 429 });
  const limited = response();
  await subscribe(request(signup), limited);
  assert.equal(limited.statusCode, 429);
});

test('subscription is POST-only and rejects oversized request strings', async () => {
  noNetwork();
  const get = response();
  await subscribe(request({}, { method: 'GET' }), get);
  assert.equal(get.statusCode, 405);
  const large = response();
  await subscribe(request('x'.repeat(4097)), large);
  assert.equal(large.statusCode, 413);
});

test('verified preview metadata is available without Spotify credentials or a fuzzy search', async () => {
  noNetwork();
  const res = response();
  await preview({ method: 'GET', query: { track: 'winning-again' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.title, 'Winning Again');
  assert.equal(res.body.artist, 'JXXMAL');
  assert.match(res.body.previewUrl, /^https:\/\/audio-ssl\.itunes\.apple\.com\//);
  assert.equal(res.body.spotifyUrl, 'https://open.spotify.com/track/61Q8qY2yQkWDnrHkZWHttt');
});

test('preview cannot search for arbitrary artists or unknown titles', async () => {
  noNetwork();
  const missing = response();
  await preview({ method: 'GET', query: { q: 'A song from another artist' } }, missing);
  assert.equal(missing.statusCode, 404);
  assert.equal(missing.body.found, false);
  const invalid = response();
  await preview({ method: 'GET', query: { track: ['winning-again'] } }, invalid);
  assert.equal(invalid.statusCode, 400);
});

test('music links contain verified direct services and public song.link instead of a retired API dependency', () => {
  noNetwork();
  const res = response();
  links({ method: 'GET', query: { track: 'make-a-way' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.links.spotify, 'https://open.spotify.com/track/0hQAjp9MotZ4mooGNesvaB');
  assert.match(res.body.links.appleMusic, /^https:\/\/music\.apple\.com\//);
  assert.equal(res.body.pageUrl, 'https://song.link/s/0hQAjp9MotZ4mooGNesvaB');
  assert.equal(res.body.resolutionAvailable, false);
  assert.equal(res.body.links.tidal, 'https://listen.tidal.com/track/525527694');
  assert.match(res.body.links.amazonMusic, /^https:\/\/music\.amazon\.com\//);
});

test('resolver rejects artist links, non-Spotify hosts, insecure URLs and credentials', () => {
  noNetwork();
  for (const url of ['https://open.spotify.com/artist/0pYbVdhffwzvHfEBdeFEUC', 'https://evil.example/track/0hQAjp9MotZ4mooGNesvaB', 'http://open.spotify.com/track/0hQAjp9MotZ4mooGNesvaB', 'https://secret@open.spotify.com/track/0hQAjp9MotZ4mooGNesvaB']) {
    const res = response();
    links({ method: 'GET', query: { url } }, res);
    assert.equal(res.statusCode, 400);
  }
});

test('location does not invent zero coordinates when local Vercel headers are absent', () => {
  noNetwork();
  const res = response();
  location({ method: 'GET', headers: {} }, res);
  assert.equal(res.body.available, false);
  assert.equal(res.body.coordinates, null);
  assert.match(res.headers['cache-control'], /private.*no-store/);
});

test('location uses approximate Vercel headers, rounds coordinates and decodes city', () => {
  noNetwork();
  const res = response();
  location({ method: 'GET', headers: { 'x-vercel-ip-latitude': '12.056', 'x-vercel-ip-longitude': '-61.746', 'x-vercel-ip-city': 'St.%20George%27s', 'x-vercel-ip-country': 'GD' } }, res);
  assert.deepEqual(res.body.coordinates, [-61.7, 12.1]);
  assert.equal(res.body.city, "St. George's");
  assert.equal(res.body.approximate, true);
  assert.equal(res.body.ip, undefined);
});

test('invalid latitude and longitude are rejected', () => {
  const res = response();
  location({ method: 'GET', headers: { 'x-vercel-ip-latitude': '91', 'x-vercel-ip-longitude': '0' } }, res);
  assert.equal(res.body.available, false);
});

test('YouTube without credentials has no fabricated subscriber count', async () => {
  delete process.env.YOUTUBE_API_KEY; noNetwork();
  const { default: platforms } = await import('../api/platforms.js?without-key');
  const res = response();
  await platforms({ method: 'GET' }, res);
  assert.equal(res.body.youtube.subscriberCount, null);
  assert.deepEqual(res.body.youtube.videos, []);
  assert.equal(res.body.instagram.followers, 127);
});

test('YouTube live count and uploads are fetched server-side and cached', async () => {
  process.env.YOUTUBE_API_KEY = 'test-only-key';
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls++;
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get('key'), 'test-only-key');
    return parsed.pathname.endsWith('/channels')
      ? Response.json({ items: [{ statistics: { subscriberCount: '612' }, contentDetails: { relatedPlaylists: { uploads: 'UPLOADS' } } }] })
      : Response.json({ items: [{ snippet: { title: 'JXXMAL - Miss Bossy', publishedAt: '2026-09-24', resourceId: { videoId: 'abcdefghijk' }, thumbnails: { high: { url: 'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg' } } } }] });
  };
  const { default: platforms } = await import('../api/platforms.js?cache-check');
  const first = response(); await platforms({ method: 'GET' }, first);
  const second = response(); await platforms({ method: 'GET' }, second);
  assert.equal(first.body.youtube.subscriberCount, 612);
  assert.equal(first.body.youtube.videos[0].id, 'abcdefghijk');
  assert.equal(second.body.youtube.subscriberCount, 612);
  assert.equal(calls, 2);
  assert.ok(!JSON.stringify(first.body).includes('test-only-key'));
});

test('YouTube upstream failure leaves working profile links and no fake data', async () => {
  process.env.YOUTUBE_API_KEY = 'test-only-key';
  globalThis.fetch = async () => Response.json({ error: 'quota' }, { status: 403 });
  const { default: platforms } = await import('../api/platforms.js?upstream-fail');
  const res = response(); await platforms({ method: 'GET' }, res);
  assert.equal(res.body.youtube.available, false);
  assert.equal(res.body.youtube.subscriberCount, null);
});

function clearPlatformCredentials() {
  for (const key of ['YOUTUBE_API_KEY', 'IG_ACCESS_TOKEN', 'IG_USER_ID', 'IG_GRAPH_VERSION', 'SOUNDCHARTS_APP_ID', 'SOUNDCHARTS_API_KEY']) delete process.env[key];
}
const soundchartsUuid = '12345678-1234-1234-1234-123456789abc';

test('unconfigured platform counts are explicitly dated snapshots and make no external requests', async () => {
  clearPlatformCredentials(); noNetwork();
  const { default: platforms } = await import('../api/platforms.js?snapshots');
  const res = response(); await platforms({ method: 'GET' }, res);
  assert.equal(res.body.instagram.followers, 127);
  assert.equal(res.body.instagram.automatic, false);
  assert.equal(res.body.instagram.updatedAt, '2026-10-27');
  assert.equal(res.body.spotify.monthlyListeners, 192);
  assert.equal(res.body.spotify.automatic, false);
  assert.equal(res.body.spotify.updatedAt, '2026-10-27');
  assert.match(res.headers['cache-control'], /s-maxage=900/);
  const post = response(); await platforms({ method: 'POST' }, post);
  assert.equal(post.statusCode, 405);
});

test('Instagram uses authorized professional profile, accepts zero followers and deduplicates requests', async () => {
  clearPlatformCredentials();
  process.env.IG_ACCESS_TOKEN = 'private-instagram-test-token';
  process.env.IG_USER_ID = '123456789';
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    const parsed = new URL(url);
    assert.equal(parsed.origin, 'https://graph.instagram.com');
    assert.equal(parsed.pathname, '/v24.0/123456789');
    assert.equal(parsed.searchParams.get('fields'), 'id,username,followers_count');
    assert.equal(parsed.searchParams.get('access_token'), null);
    assert.equal(options.headers.Authorization, 'Bearer private-instagram-test-token');
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json({ id: '123456789', username: 'JXXMALMUSIK', followers_count: 0 });
  };
  const { default: platforms } = await import('../api/platforms.js?instagram-zero');
  const first = response(), second = response();
  await Promise.all([platforms({ method: 'GET' }, first), platforms({ method: 'GET' }, second)]);
  assert.equal(first.body.instagram.followers, 0);
  assert.equal(first.body.instagram.automatic, true);
  assert.equal(calls, 1);
  assert.ok(!JSON.stringify(first.body).includes('private-instagram-test-token'));
  assert.deepEqual(second.body.instagram, first.body.instagram);
});

test('Instagram rejects another account, malformed counts and expired authorization without leaking upstream details', async () => {
  clearPlatformCredentials(); process.env.IG_ACCESS_TOKEN = 'private-instagram-test-token';
  const cases = [
    { username: 'another_artist', followers_count: 999 },
    { username: 'jxxmalmusik', followers_count: true },
    { username: 'jxxmalmusik', followers_count: -1 },
    { error: { message: 'private-instagram-test-token revoked' } },
  ];
  for (const [index, profile] of cases.entries()) {
    globalThis.fetch = async () => Response.json(profile, { status: profile.error ? 401 : 200 });
    const { default: platforms } = await import(`../api/platforms.js?instagram-rejected-${index}`);
    const res = response(); await platforms({ method: 'GET' }, res);
    assert.equal(res.body.instagram.followers, 127);
    assert.equal(res.body.instagram.automatic, false);
    assert.equal(res.body.instagram.updatedAt, '2026-10-27');
    assert.ok(!JSON.stringify(res.body).includes('private-instagram-test-token'));
  }
});

test('Instagram marks an expired cached result stale after failure and eventually returns the dated snapshot', async () => {
  clearPlatformCredentials(); process.env.IG_ACCESS_TOKEN = 'test-token';
  let now = originalNow(); Date.now = () => now;
  globalThis.fetch = async () => Response.json({ username: 'jxxmalmusik', followers_count: 150 });
  const { default: platforms } = await import('../api/platforms.js?instagram-stale');
  const first = response(); await platforms({ method: 'GET' }, first);
  now += 16 * 60000;
  globalThis.fetch = async () => { throw new Error('Provider offline'); };
  const stale = response(); await platforms({ method: 'GET' }, stale);
  assert.equal(stale.body.instagram.followers, 150);
  assert.equal(stale.body.instagram.stale, true);
  assert.equal(stale.body.instagram.updatedAt, first.body.instagram.updatedAt);
  now += 86400000;
  const old = response(); await platforms({ method: 'GET' }, old);
  assert.equal(old.body.instagram.followers, 127);
  assert.equal(old.body.instagram.automatic, false);
});

test('Spotify resolves the exact artist and uses Soundcharts monthly listeners, never follower data', async () => {
  clearPlatformCredentials();
  process.env.SOUNDCHARTS_APP_ID = 'private-soundcharts-app';
  process.env.SOUNDCHARTS_API_KEY = 'private-soundcharts-key';
  let calls = 0;
  const date = new Date(originalNow() - 86400000).toISOString();
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(options.headers['x-app-id'], 'private-soundcharts-app');
    assert.equal(options.headers['x-api-key'], 'private-soundcharts-key');
    const parsed = new URL(url);
    assert.equal(parsed.origin, 'https://customer.api.soundcharts.com');
    if (parsed.pathname.includes('/by-platform/')) {
      assert.equal(parsed.pathname, '/api/v2/artist/by-platform/spotify/0pYbVdhffwzvHfEBdeFEUC');
      return Response.json({ object: { uuid: soundchartsUuid } });
    }
    assert.equal(parsed.pathname, `/api/v2/artist/${soundchartsUuid}/streaming/spotify/listening`);
    assert.equal(parsed.searchParams.get('sort'), 'desc');
    assert.equal(parsed.searchParams.get('limit'), '1');
    return Response.json({ items: [{ value: 321, date, followers: 9999 }] });
  };
  const { default: platforms } = await import('../api/platforms.js?spotify-monthly');
  const first = response(); await platforms({ method: 'GET' }, first);
  const second = response(); await platforms({ method: 'GET' }, second);
  assert.equal(first.body.spotify.monthlyListeners, 321);
  assert.equal(first.body.spotify.automatic, true);
  assert.equal(first.body.spotify.updatedAt, date);
  assert.equal(first.body.spotify.stale, false);
  assert.equal(first.body.spotify.followers, undefined);
  assert.equal(calls, 2);
  assert.ok(!JSON.stringify(first.body).includes('private-soundcharts'));
});

test('invalid Soundcharts data falls back honestly while a working Instagram count still updates', async () => {
  clearPlatformCredentials();
  process.env.IG_ACCESS_TOKEN = 'test-token';
  process.env.SOUNDCHARTS_APP_ID = 'test-app'; process.env.SOUNDCHARTS_API_KEY = 'test-key';
  const cases = [
    { items: [{ followers: 543, date: new Date().toISOString() }] },
    { items: [{ value: true, date: new Date().toISOString() }] },
    { items: [{ value: 543, date: 'invalid' }] },
    { items: [{ value: 543, date: new Date(originalNow() + 2 * 86400000).toISOString() }] },
    { error: 'API access denied' },
  ];
  for (const [index, audience] of cases.entries()) {
    globalThis.fetch = async (url) => {
      if (String(url).includes('graph.instagram.com')) return Response.json({ username: 'jxxmalmusik', followers_count: 160 });
      if (String(url).includes('/by-platform/')) return Response.json({ object: { uuid: soundchartsUuid } });
      return Response.json(audience, { status: audience.error ? 403 : 200 });
    };
    const { default: platforms } = await import(`../api/platforms.js?spotify-invalid-${index}`);
    const res = response(); await platforms({ method: 'GET' }, res);
    assert.equal(res.body.spotify.monthlyListeners, 192);
    assert.equal(res.body.spotify.automatic, false);
    assert.equal(res.body.instagram.followers, 160);
    assert.equal(res.body.instagram.automatic, true);
  }
});

test('Soundcharts old but valid measurements are marked stale and zero is a real monthly-listener count', async () => {
  clearPlatformCredentials();
  process.env.SOUNDCHARTS_APP_ID = 'test-app'; process.env.SOUNDCHARTS_API_KEY = 'test-key';
  globalThis.fetch = async (url) => String(url).includes('/by-platform/')
    ? Response.json({ object: { uuid: soundchartsUuid } })
    : Response.json({ items: [{ value: 0, date: new Date(originalNow() - 8 * 86400000).toISOString() }] });
  const { default: platforms } = await import('../api/platforms.js?spotify-old-zero');
  const res = response(); await platforms({ method: 'GET' }, res);
  assert.equal(res.body.spotify.monthlyListeners, 0);
  assert.equal(res.body.spotify.stale, true);
  assert.equal(res.body.spotify.automatic, true);
});

test('legacy Spotify endpoints never expose account credentials or fetch account data', async () => {
  noNetwork();
  for (const handler of [callback, nowPlaying]) {
    const res = response();
    await handler({ query: { code: 'unused' } }, res);
    assert.equal(res.statusCode, 410);
    assert.equal(res.body.refresh_token, undefined);
  }
});
