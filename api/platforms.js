import snapshots from '../src/data/platform-snapshots.json' with { type: 'json' };

const cache = new Map();
const pending = new Map();
const SPOTIFY_ARTIST = '0pYbVdhffwzvHfEBdeFEUC';
const count = (value) => (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) && Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null;
const fallback = (name) => ({ ...snapshots[name], automatic: false, available: true, stale: false });

async function cached(name, ttl, loader, empty) {
  const previous = cache.get(name);
  if (previous && Date.now() - previous.savedAt < ttl) return previous.value;
  if (pending.has(name)) return pending.get(name);
  const promise = (async () => {
    try {
      const value = await loader();
      cache.set(name, { value, savedAt: Date.now() });
      return value;
    } catch {
      // Never describe a saved snapshot or an expired provider response as live.
      if (previous && Date.now() - previous.savedAt < 86400000) return { ...previous.value, stale: true };
      return empty;
    } finally { pending.delete(name); }
  })();
  pending.set(name, promise);
  return promise;
}

async function youtube() {
  const empty = { subscriberCount: null, videos: [], available: false, automatic: false, updatedAt: null };
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return empty;
  return cached('youtube', 900000, async () => {
    const channelUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
    channelUrl.search = new URLSearchParams({ part: 'statistics,contentDetails', forHandle: (process.env.YOUTUBE_CHANNEL_HANDLE || 'JXXMALMUSIK').replace(/^@/, ''), key });
    const response = await fetch(channelUrl, { signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw new Error('YouTube unavailable');
    const channel = (await response.json()).items?.[0];
    if (!channel) throw new Error('Channel unavailable');
    const subscriberCount = channel.statistics?.hiddenSubscriberCount ? null : count(channel.statistics?.subscriberCount);
    const uploads = channel.contentDetails?.relatedPlaylists?.uploads;
    let videos = [];
    if (uploads) {
      const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
      url.search = new URLSearchParams({ part: 'snippet', playlistId: uploads, maxResults: '8', key });
      const result = await fetch(url, { signal: AbortSignal.timeout(7000) });
      if (result.ok) videos = ((await result.json()).items || []).flatMap(({ snippet }) => {
        const id = snippet?.resourceId?.videoId;
        return /^[\w-]{11}$/.test(id || '') ? [{ id, title: snippet.title, thumbnail: snippet.thumbnails?.high?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, publishedAt: snippet.publishedAt }] : [];
      });
    }
    return { subscriberCount, videos, available: true, automatic: true, updatedAt: new Date().toISOString(), source: 'youtube-data-api' };
  }, empty);
}

async function instagram() {
  const token = process.env.IG_ACCESS_TOKEN;
  const user = process.env.IG_USER_ID || 'me';
  if (!token || !/^(?:me|\d+)$/.test(user)) return fallback('instagram');
  const version = /^v\d{1,2}\.\d+$/.test(process.env.IG_GRAPH_VERSION || '') ? process.env.IG_GRAPH_VERSION : 'v24.0';
  return cached('instagram', 900000, async () => {
    const url = new URL(`https://graph.instagram.com/${version}/${user}`);
    url.searchParams.set('fields', 'id,username,followers_count');
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw new Error('Instagram unavailable');
    const profile = await response.json();
    const followers = count(profile.followers_count);
    if (followers === null || profile.username?.toLowerCase() !== 'jxxmalmusik') throw new Error('Instagram profile mismatch');
    return { followers, available: true, automatic: true, updatedAt: new Date().toISOString(), source: 'instagram-graph-api' };
  }, fallback('instagram'));
}

async function spotify() {
  const app = process.env.SOUNDCHARTS_APP_ID;
  const key = process.env.SOUNDCHARTS_API_KEY;
  if (!app || !key) return fallback('spotify');
  return cached('spotify', 21600000, async () => {
    const headers = { 'x-app-id': app, 'x-api-key': key };
    // Resolve the exact Spotify artist each time the server cache refreshes.
    // A name search or a manually entered UUID could show another artist's audience.
    const artistResponse = await fetch(`https://customer.api.soundcharts.com/api/v2/artist/by-platform/spotify/${SPOTIFY_ARTIST}`, { headers, signal: AbortSignal.timeout(7000) });
    if (!artistResponse.ok) throw new Error('Artist unavailable');
    const uuid = (await artistResponse.json()).object?.uuid;
    if (!/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(uuid || '')) throw new Error('Artist unavailable');
    const response = await fetch(`https://customer.api.soundcharts.com/api/v2/artist/${uuid}/streaming/spotify/listening?limit=1&sort=desc`, { headers, signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw new Error('Audience unavailable');
    const point = (await response.json()).items?.[0];
    const monthlyListeners = count(point?.value);
    const date = Date.parse(point?.date);
    if (monthlyListeners === null || !Number.isFinite(date) || date > Date.now() + 86400000) throw new Error('Audience unavailable');
    return { monthlyListeners, updatedAt: new Date(date).toISOString(), available: true, automatic: true, source: 'soundcharts', stale: Date.now() - date > 604800000 };
  }, fallback('spotify'));
}

export default async function handler(req, res) {
  res.setHeader('Allow', 'GET');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  const [youtubeData, instagramData, spotifyData] = await Promise.all([youtube(), instagram(), spotify()]);
  res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');
  return res.json({ youtube: youtubeData, instagram: instagramData, spotify: spotifyData });
}
