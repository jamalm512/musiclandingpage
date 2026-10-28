# JXXMAL catalog sources

Verified on October 27, 2026. The artist identifiers below were already used by the existing JXXMAL website. No song links, subscriber totals, or audio previews were invented.

## Official artist catalogs

- [Apple Music artist](https://music.apple.com/us/artist/jxxmal/1896724847), artist ID `1896724847`.
- [Apple iTunes Search API artist lookup](https://itunes.apple.com/lookup?id=1896724847&entity=song&limit=200). Returned five song records belonging to that artist ID, including release dates, track durations, cover artwork, direct Apple links, and preview URLs.
- [Spotify artist](https://open.spotify.com/artist/0pYbVdhffwzvHfEBdeFEUC), artist ID `0pYbVdhffwzvHfEBdeFEUC`. Exact song names and IDs were read from the official artist page’s track rows.
- [Official YouTube channel](https://www.youtube.com/@JXXMALMUSIK). Video IDs were verified from the channel’s uploads playlist through the YouTube Data API. API credentials are not included in this document.

## Release records

Release dates below refer to the music release, rather than the upload timestamp of its YouTube video. Dates and durations come from Apple’s official records. “Winning Again” is labeled Dancehall at the artist’s request; Apple’s broad store genre is Reggae.

| Release | Date | Duration | Spotify | Apple Music | YouTube |
| --- | --- | --- | --- | --- | --- |
| Make A Way | 2026-05-17 | 2:42 | [Track](https://open.spotify.com/track/0hQAjp9MotZ4mooGNesvaB) | [Track](https://music.apple.com/us/album/make-a-way/6770354859?i=6770354860) | [Official upload](https://www.youtube.com/watch?v=GUdgum4o8og) |
| Tun Up | 2026-05-22 | 1:58 | [Track](https://open.spotify.com/track/4I7D75UtikPO0QB5iAl2rW) | [Track](https://music.apple.com/us/album/tun-up/6770708795?i=6770708801) | [Official upload](https://www.youtube.com/watch?v=4x0oFKDmoF0) |
| Winning Again | 2026-06-19 | 2:38 | [Track](https://open.spotify.com/track/61Q8qY2yQkWDnrHkZWHttt) | [Track](https://music.apple.com/us/album/winning-again/6782055404?i=6782055422) | [Official upload](https://www.youtube.com/watch?v=LoeRQuhtBZ0) |
| Real Talk | 2026-09-01 | 2:48 | [Track](https://open.spotify.com/track/1BOJJRV5ftKEe8Oiq4KKKr) | [Track](https://music.apple.com/us/album/real-talk/6806767702?i=6806767703) | [Official upload](https://www.youtube.com/watch?v=UIaK6yXLZG0) |
| Miss Bossy | 2026-09-24 | 2:20 | [Track](https://open.spotify.com/track/4TycrEe97xmTjPExtdG0IC) | [Track](https://music.apple.com/us/album/miss-bossy/6816007398?i=6816007399) | [Official upload](https://www.youtube.com/watch?v=p4ZZ9HrJQ_g) |

## Preview audio

`src/data/releases.json` contains the preview URLs supplied by Apple’s catalog response. The website streams these short promotional previews directly from Apple’s audio servers and identifies Apple Music as the preview source, with a link to the release. No full tracks or preview audio files were downloaded or bundled. Preview playback starts after the visitor activates a song.

The catalog keeps exact Spotify links independently of preview availability. The UI must handle unavailable previews without substituting another artist’s recording. Artist-supplied clips can replace the remote preview URLs later if desired.

## Artwork

Five official 1000 × 1000 JPEG cover images were downloaded from the artwork URLs returned by Apple’s catalog, requesting the `1000x1000bb.jpg` size. They are served locally for dependable page loading.

| Local file | Official artwork source |
| --- | --- |
| `public/artwork/make-a-way.jpg` | [Apple artwork](https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/78/1e/d5/781ed5bf-e7f7-7cdd-66dd-6aa06e0eae4a/artwork.jpg/1000x1000bb.jpg) |
| `public/artwork/tun-up.jpg` | [Apple artwork](https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/4f/a9/39/4fa93916-05bb-de22-0663-dce20ffa2734/artwork.jpg/1000x1000bb.jpg) |
| `public/artwork/winning-again.jpg` | [Apple artwork](https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/05/7a/d6/057ad634-ae82-6b17-c376-f8dc9112e9e6/artwork.jpg/1000x1000bb.jpg) |
| `public/artwork/real-talk.jpg` | [Apple artwork](https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/23/10/bc/2310bc37-215c-dec4-4527-3b675174ab24/artwork.jpg/1000x1000bb.jpg) |
| `public/artwork/miss-bossy.jpg` | [Apple artwork](https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/5c/75/97/5c7597f7-6bde-ef67-4dea-23d691b16a60/artwork.jpg/1000x1000bb.jpg) |

`public/artwork/jxxmal-portrait.jpg` comes from the official Spotify artist page’s `og:image`: [artist image](https://i.scdn.co/image/ab6761610000e5eb9555421cbcbf163c03b74886).

## Additional streaming links

The following [Songlink/Odesli](https://song.link/) landing pages were checked against the exact Spotify track ID, title, and artist. Their returned page data supplied verified direct Tidal and Amazon Music URLs, stored in the catalog.

| Release | Songlink | Tidal | Amazon Music |
| --- | --- | --- | --- |
| Make A Way | [Resolved page](https://song.link/s/0hQAjp9MotZ4mooGNesvaB) | [Track](https://listen.tidal.com/track/525527694) | [Track](https://music.amazon.com/albums/B0H23YGJV9?trackAsin=B0H23YV1GV) |
| Tun Up | [Resolved page](https://song.link/s/4I7D75UtikPO0QB5iAl2rW) | [Track](https://listen.tidal.com/track/525751586) | [Track](https://music.amazon.com/albums/B0H25YVDD5?trackAsin=B0H25RB66S) |
| Winning Again | [Resolved page](https://song.link/s/61Q8qY2yQkWDnrHkZWHttt) | [Track](https://listen.tidal.com/track/534463938) | [Track](https://music.amazon.com/albums/B0H5TWSWNT?trackAsin=B0H5TQ3BL1) |

The inspected Songlink response was for country `GD`; it did not supply Apple or YouTube links for these three records. Those destinations were verified separately through the official services above. The website uses known direct URLs rather than assuming every service has resolved. Tidal and Amazon fields remain null for releases that were not checked.

## Maintained values

- Instagram's artist-provided **127 followers** is a saved fallback dated October 27, 2026. The server supports automatic follower counts after authorizing the professional `@jxxmalmusik` account through Meta; account type is confirmed, API authorization remains required.
- Spotify's **192 monthly listeners** is a saved snapshot verified from the artist profile October 27, 2026. Monthly listeners are not exposed by Spotify's standard artist API. The optional automatic source is [Soundcharts streaming audience](https://developers.soundcharts.com/api/reference/artist/get-streaming-audience), which reports Spotify's rolling 28-day listeners; production API access and artist coverage still need verification. Followers are never substituted for listeners.
- YouTube subscriber totals come from the server-side platform endpoint when configured. No follower, listener, or subscriber count from these research snapshots is hardcoded as a live metric.
- `releases.json` is the shared catalog for the frontend and API routes; `music.ts` supplies its TypeScript type and artist links.

Production artwork is encoded as WebP at the original dimensions to reduce transfer size; the subjects and designs are unchanged.
