import axios from 'axios';
import { TMDBMovie, TMDBSeries, TMDBCredits } from '../types';

// TMDB API configuration
const TMDB_API_KEY = '42125c682636b68d10d70b487c692685';
const TMDB_API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0MjEyNWM2ODI2MzZiNjhkMTBkNzBiNDg3YzY5MjY4NSIsIm5iZiI6MS42NDM4MjA2NjA2OTUwMDAyZSs5LCJzdWIiOiI2MWZhYjY3NGI3YWJiNTAwNjY1YWQ4MzAiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.e06dzH5trScMiz7obFbCFip5dO1XQp-bUC3lecJ8sxU';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Create axios instance for TMDB API
const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  headers: {
    Authorization: `Bearer ${TMDB_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// Search for a movie by title
export const searchMovie = async (query: string): Promise<TMDBMovie[]> => {
  const response = await tmdbClient.get('/search/movie', {
    params: {
      query,
      include_adult: false,
      language: 'en-US',
      page: 1,
    },
  });
  
  return response.data.results;
};

// Search for a TV series by title
export const searchTVSeries = async (query: string): Promise<TMDBSeries[]> => {
  const response = await tmdbClient.get('/search/tv', {
    params: {
      query,
      include_adult: false,
      language: 'en-US',
      page: 1,
    },
  });
  
  return response.data.results;
};

// Get movie details by ID
export const getMovieDetails = async (movieId: number): Promise<TMDBMovie> => {
  const response = await tmdbClient.get(`/movie/${movieId}`, {
    params: {
      language: 'en-US',
      append_to_response: 'videos,images,credits,similar',
    },
  });
  
  return response.data;
};

// Get movie details by title and year
export const getMovieDetailsByTitle = async (title: string, year?: string | number): Promise<any> => {
  try {
    // Search for the movie by title
    const searchResponse = await tmdbClient.get('/search/movie', {
      params: {
        query: title,
        include_adult: false,
        language: 'en-US',
        year: year || undefined,
        page: 1,
      },
    });
    
    const results = searchResponse.data.results;
    
    // If no results found, return null
    if (!results || results.length === 0) {
      return null;
    }
    
    // Find the best match (exact title match with year if provided)
    let bestMatch = results[0];
    
    if (year) {
      const releaseYear = parseInt(year.toString());
      const exactMatch = results.find(movie => {
        const movieYear = movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null;
        return (
          movie.title.toLowerCase() === title.toLowerCase() && 
          movieYear === releaseYear
        );
      });
      
      if (exactMatch) {
        bestMatch = exactMatch;
      }
    }
    
    // Get full details for the best match
    const detailsResponse = await tmdbClient.get(`/movie/${bestMatch.id}`, {
      params: {
        language: 'en-US',
        append_to_response: 'videos,images,credits,similar',
      },
    });
    
    return detailsResponse.data;
  } catch (error) {
    console.error('Error fetching movie details by title:', error);
    return null;
  }
};

// Get TV series details by ID
export const getTVSeriesDetails = async (seriesId: number): Promise<TMDBSeries> => {
  const response = await tmdbClient.get(`/tv/${seriesId}`, {
    params: {
      language: 'en-US',
      append_to_response: 'videos,images,credits,similar',
    },
  });
  
  return response.data;
};

// Get TV series details by title
export const getSeriesDetails = async (title: string): Promise<any> => {
  try {
    // Search for the series by title
    const searchResponse = await tmdbClient.get('/search/tv', {
      params: {
        query: title,
        include_adult: false,
        language: 'en-US',
        page: 1,
      },
    });
    
    const results = searchResponse.data.results;
    
    // If no results found, return null
    if (!results || results.length === 0) {
      return null;
    }
    
    // Find the best match (exact title match)
    let bestMatch = results[0];
    
    const exactMatch = results.find(series => 
      series.name.toLowerCase() === title.toLowerCase()
    );
    
    if (exactMatch) {
      bestMatch = exactMatch;
    }
    
    // Get full details for the best match
    const detailsResponse = await tmdbClient.get(`/tv/${bestMatch.id}`, {
      params: {
        language: 'en-US',
        append_to_response: 'videos,images,credits,similar',
      },
    });
    
    return detailsResponse.data;
  } catch (error) {
    console.error('Error fetching series details by title:', error);
    return null;
  }
};

// Get movie credits (cast and crew)
export const getMovieCredits = async (movieId: number): Promise<TMDBCredits> => {
  const response = await tmdbClient.get(`/movie/${movieId}/credits`, {
    params: {
      language: 'en-US',
    },
  });
  
  return response.data;
};

// Get TV series credits (cast and crew)
export const getTVSeriesCredits = async (seriesId: number): Promise<TMDBCredits> => {
  const response = await tmdbClient.get(`/tv/${seriesId}/credits`, {
    params: {
      language: 'en-US',
    },
  });
  
  return response.data;
};

// Get similar movies
export const getSimilarMovies = async (movieId: number): Promise<TMDBMovie[]> => {
  const response = await tmdbClient.get(`/movie/${movieId}/similar`, {
    params: {
      language: 'en-US',
      page: 1,
    },
  });
  
  return response.data.results;
};

// Get similar TV series
export const getSimilarTVSeries = async (seriesId: number): Promise<TMDBSeries[]> => {
  const response = await tmdbClient.get(`/tv/${seriesId}/similar`, {
    params: {
      language: 'en-US',
      page: 1,
    },
  });
  
  return response.data.results;
};

// Get image URL
export const getImageUrl = (path: string | null, size: string = 'original'): string | null => {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};