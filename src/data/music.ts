import releases from './releases.json';

export type Release = {
  id: string;
  title: string;
  releaseDate: string;
  releaseLabel: string;
  genre: string;
  artwork: string;
  spotifyUrl: string | null;
  appleMusicUrl: string | null;
  youtubeId: string | null;
  tidalUrl: string | null;
  amazonMusicUrl: string | null;
  previewUrl: string | null;
  previewProvider: string;
  duration: string;
  explicit: boolean;
};

/** Chronological releases, verified against the artist's official Apple/Spotify catalogs. */
export const RELEASES: Release[] = releases;

export const ARTIST = {
  name: 'JXXMAL',
  instagramFollowers: 127,
  spotifyUrl: 'https://open.spotify.com/artist/0pYbVdhffwzvHfEBdeFEUC',
  appleMusicUrl: 'https://music.apple.com/us/artist/jxxmal/1896724847',
  youtubeUrl: 'https://www.youtube.com/@JXXMALMUSIK',
  instagramUrl: 'https://www.instagram.com/jxxmalmusik/',
  origin: 'Grenada',
  websiteUrl: 'https://jxxmalmusik.com',
} as const;
