import axios from 'axios';
import { 
  XtreamCredentials, 
  XtreamUser, 
  XtreamCategory, 
  XtreamChannel, 
  XtreamMovie, 
  XtreamSeries,
  XtreamSeriesInfo
} from '../types';

// Create axios instance for Xtream API
const createXtreamClient = (credentials: XtreamCredentials) => {
  const baseURL = credentials.server.endsWith('/')
    ? credentials.server
    : `${credentials.server}/`;

  return axios.create({
    baseURL,
    params: {
      username: credentials.username,
      password: credentials.password,
    },
  });
};

// Login and get user info
export const loginUser = async (credentials: XtreamCredentials): Promise<XtreamUser> => {
  try {
    const client = createXtreamClient(credentials);
    const response = await client.get('player_api.php');
    
    if (response.data.user_info?.auth !== 1) {
      throw new Error('Authentication failed. Please check your credentials.');
    }
    
    return response.data.user_info as XtreamUser;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your credentials.');
      } else if (!error.response) {
        throw new Error('Could not connect to server. Please check the server URL.');
      }
      throw new Error(`Server error: ${error.response?.status} ${error.response?.statusText}`);
    }
    throw error;
  }
};

// Get live TV categories
export const getLiveCategories = async (credentials: XtreamCredentials): Promise<XtreamCategory[]> => {
  const client = createXtreamClient(credentials);
  const response = await client.get('player_api.php', {
    params: {
      action: 'get_live_categories',
    },
  });
  return response.data;
};

// Get live TV channels
export const getLiveChannels = async (
  credentials: XtreamCredentials,
  categoryId?: string
): Promise<XtreamChannel[]> => {
  const client = createXtreamClient(credentials);
  const params: any = {
    action: 'get_live_streams',
  };
  
  if (categoryId) {
    params.category_id = categoryId;
  }
  
  const response = await client.get('player_api.php', { params });
  return response.data;
};

// Get movie categories (VOD categories)
export const getMovieCategories = async (credentials: XtreamCredentials): Promise<XtreamCategory[]> => {
  const client = createXtreamClient(credentials);
  const response = await client.get('player_api.php', {
    params: {
      action: 'get_vod_categories',
    },
  });
  return response.data;
};

// Alias for getMovieCategories for compatibility
export const getVodCategories = getMovieCategories;

// Get movies (VOD streams)
export const getMovies = async (
  credentials: XtreamCredentials,
  categoryId?: string
): Promise<XtreamMovie[]> => {
  const client = createXtreamClient(credentials);
  const params: any = {
    action: 'get_vod_streams',
  };
  
  if (categoryId) {
    params.category_id = categoryId;
  }
  
  const response = await client.get('player_api.php', { params });
  return response.data;
};

// Alias for getMovies for compatibility
export const getVodStreams = getMovies;

// Get series categories
export const getSeriesCategories = async (credentials: XtreamCredentials): Promise<XtreamCategory[]> => {
  const client = createXtreamClient(credentials);
  const response = await client.get('player_api.php', {
    params: {
      action: 'get_series_categories',
    },
  });
  return response.data;
};

// Get series
export const getSeries = async (
  credentials: XtreamCredentials,
  categoryId?: string
): Promise<XtreamSeries[]> => {
  const client = createXtreamClient(credentials);
  const params: any = {
    action: 'get_series',
  };
  
  if (categoryId) {
    params.category_id = categoryId;
  }
  
  const response = await client.get('player_api.php', { params });
  return response.data;
};

// Get series info
export const getSeriesInfo = async (
  credentials: XtreamCredentials,
  seriesId: number
): Promise<XtreamSeriesInfo> => {
  const client = createXtreamClient(credentials);
  const response = await client.get('player_api.php', {
    params: {
      action: 'get_series_info',
      series_id: seriesId,
    },
  });
  return response.data;
};

// Get stream URL for live TV
export const getLiveStreamUrl = (
  credentials: XtreamCredentials,
  streamId: number
): string => {
  const baseUrl = credentials.server.endsWith('/')
    ? credentials.server.slice(0, -1)
    : credentials.server;
    
  return `${baseUrl}/live/${credentials.username}/${credentials.password}/${streamId}.m3u8`;
};

// Get stream URL for movie
export const getMovieStreamUrl = (
  credentials: XtreamCredentials,
  streamId: number,
  extension: string = 'mp4'
): string => {
  const baseUrl = credentials.server.endsWith('/')
    ? credentials.server.slice(0, -1)
    : credentials.server;
    
  return `${baseUrl}/movie/${credentials.username}/${credentials.password}/${streamId}.${extension}`;
};

// Alias for getMovieStreamUrl for compatibility
export const getVodStreamUrl = getMovieStreamUrl;

// Get stream URL for series episode
export const getEpisodeStreamUrl = (
  credentials: XtreamCredentials,
  streamId: number,
  extension: string = 'mp4'
): string => {
  const baseUrl = credentials.server.endsWith('/')
    ? credentials.server.slice(0, -1)
    : credentials.server;
    
  return `${baseUrl}/series/${credentials.username}/${credentials.password}/${streamId}.${extension}`;
};

// Alias for getEpisodeStreamUrl for compatibility
export const getSeriesStreamUrl = getEpisodeStreamUrl;