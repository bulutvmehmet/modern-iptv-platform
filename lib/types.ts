// Types for Xtream Codes API

export interface XtreamCredentials {
  server: string;
  username: string;
  password: string;
}

export interface XtreamUser {
  username: string;
  password: string;
  message: string;
  auth: number;
  status: string;
  exp_date: string;
  is_trial: string;
  active_cons: string;
  created_at: string;
  max_connections: string;
  allowed_output_formats: string[];
}

export interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface XtreamChannel {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  category_id: string;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
}

export interface XtreamMovie {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  added: string;
  category_id: string;
  container_extension: string;
  custom_sid: string;
  direct_source: string;
}

export interface XtreamSeries {
  num: number;
  name: string;
  series_id: number;
  cover: string;
  plot: string;
  cast: string;
  director: string;
  genre: string;
  release_date: string;
  last_modified: string;
  rating: string;
  rating_5based: number;
  backdrop_path: string[];
  youtube_trailer: string;
  episode_run_time: string;
  category_id: string;
}

export interface XtreamEpisode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
  info: {
    movie_image: string;
    plot: string;
    releasedate: string;
    duration_secs: number;
  };
  added: string;
  season: number;
  direct_source: string;
}

export interface XtreamSeason {
  season_number: number;
  episodes: XtreamEpisode[];
}

export interface XtreamSeriesInfo {
  info: {
    name: string;
    cover: string;
    plot: string;
    cast: string;
    director: string;
    genre: string;
    release_date: string;
    last_modified: string;
    rating: string;
    rating_5based: number;
    backdrop_path: string[];
    youtube_trailer: string;
    episode_run_time: string;
  };
  episodes: {
    [key: string]: XtreamEpisode[];
  };
  seasons: XtreamSeason[];
}

export interface EPGProgram {
  id: string;
  start: string;
  end: string;
  title: string;
  description?: string;
  category?: string;
  language?: string;
  cover?: string;
  channelId?: string;
}

export interface EPGData {
  [channelId: string]: EPGProgram[];
}

// TMDB Types
export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  runtime: number;
  genres: { id: number; name: string }[];
  credits?: TMDBCredits;
  similar?: { results: TMDBMovie[] };
  videos?: { results: TMDBVideo[] };
}

export interface TMDBMovieDetails extends TMDBMovie {
  budget: number;
  revenue: number;
  status: string;
  tagline: string;
  production_companies: { id: number; name: string; logo_path: string }[];
  production_countries: { iso_3166_1: string; name: string }[];
  spoken_languages: { iso_639_1: string; name: string }[];
}

export interface TMDBSeries {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  episode_run_time: number[];
  genres: { id: number; name: string }[];
  number_of_seasons: number;
  number_of_episodes: number;
  credits?: TMDBCredits;
  similar?: { results: TMDBSeries[] };
  videos?: { results: TMDBVideo[] };
}

export interface TMDBSeriesDetails extends TMDBSeries {
  created_by: { id: number; name: string; profile_path: string }[];
  networks: { id: number; name: string; logo_path: string }[];
  production_companies: { id: number; name: string; logo_path: string }[];
  seasons: TMDBSeason[];
  status: string;
  type: string;
  last_air_date: string;
}

export interface TMDBSeason {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  season_number: number;
  air_date: string;
  episode_count: number;
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  still_path: string;
  air_date: string;
  episode_number: number;
  season_number: number;
  vote_average: number;
  vote_count: number;
}

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
}

export interface TMDBCredits {
  cast: {
    id: number;
    name: string;
    character: string;
    profile_path: string;
    order: number;
  }[];
  crew: {
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string;
  }[];
}

// App State Types
export interface UserState {
  isLoggedIn: boolean;
  credentials?: XtreamCredentials;
  userInfo?: XtreamUser;
  error?: string;
}

export interface WatchHistoryItem {
  id: string;
  type: 'movie' | 'series' | 'live';
  name: string;
  poster?: string;
  progress?: number; // For movies and series (percentage)
  lastWatched: number; // timestamp
  seasonNumber?: number; // For series
  episodeNumber?: number; // For series
}

export interface FavoriteItem {
  id: string;
  type: 'movie' | 'series' | 'live';
  name: string;
  poster?: string;
  categoryId: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  parentalControlEnabled: boolean;
  parentalControlPin?: string;
  parentalControlRating?: string; // Maximum allowed rating (e.g. "PG-13", "R", etc.)
  parentalControlCategories?: string[]; // Restricted category IDs
  autoPlayNextEpisode: boolean;
  defaultSubtitleLanguage?: string;
  bufferSize?: number;
}