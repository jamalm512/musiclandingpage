import snapshots from '../src/data/platform-snapshots.json' with { type: 'json' };

const cache = new Map();
const pending = new Map();
const count = (value) => (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) && Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null;
const manualCount = (name) => ({ ...snapshots[name], automatic: false, available: true, stale: false });

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

export default async function handler(req, res) {
  res.setHeader('Allow', 'GET');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  const youtubeData = await youtube();
  // Instagram and Spotify are artist-maintained values. Provider credentials
  // cannot replace them; update the shared snapshots when the artist supplies counts.
  res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');
  return res.json({ youtube: youtubeData, instagram: manualCount('instagram'), spotify: manualCount('spotify') });
}
