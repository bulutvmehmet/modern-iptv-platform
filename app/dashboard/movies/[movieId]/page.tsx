'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useUserDataStore } from '@/lib/store/useUserDataStore';
import { useSettingsStore } from '@/lib/store/useSettingsStore';
import { getVodStreams, getVodStreamUrl } from '@/lib/services/xtreamService';
import { getMovieDetailsByTitle } from '@/lib/services/tmdbService';
import { XtreamVod, TMDBMovieDetails } from '@/lib/types';
import VideoPlayer from '@/components/player/VideoPlayer';
import RestrictedContent from '@/components/parental-control/RestrictedContent';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, Play, Clock, Calendar, Film, ShieldAlert } from 'lucide-react';

export default function MovieDetailPage({
  params,
}: {
  params: { movieId: string };
}) {
  const router = useRouter();
  const { credentials } = useAuthStore();
  const { addToWatchHistory, addToFavorites, removeFromFavorites, isFavorite } = useUserDataStore();
  const [movie, setMovie] = useState<XtreamVod | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string>('');

  // Fetch all movies to find the current one
  const { data: movies, isLoading: moviesLoading } = useQuery({
    queryKey: ['allVodStreams'],
    queryFn: () => (credentials ? getVodStreams(credentials) : Promise.resolve([])),
    enabled: !!credentials,
  });

  // Find the movie
  useEffect(() => {
    if (movies && params.movieId) {
      const foundMovie = movies.find(
        (m) => m.stream_id.toString() === params.movieId
      );
      
      if (foundMovie) {
        setMovie(foundMovie);
      }
    }
  }, [movies, params.movieId]);

  // Fetch TMDB details if movie is found
  const {
    data: tmdbDetails,
    isLoading: tmdbLoading,
  } = useQuery({
    queryKey: ['movieDetails', movie?.name, movie?.year],
    queryFn: () => 
      movie 
        ? getMovieDetailsByTitle(movie.name, movie.year) 
        : Promise.resolve(null),
    enabled: !!movie,
  });

  // Set stream URL when movie is found
  useEffect(() => {
    if (movie && credentials) {
      setStreamUrl(getVodStreamUrl(credentials, movie.stream_id));
    }
  }, [movie, credentials]);

  // Handle play button click
  const handlePlay = () => {
    if (!movie) return;
    
    setIsPlaying(true);
    
    // Add to watch history
    addToWatchHistory({
      id: movie.stream_id.toString(),
      type: 'movie',
      name: movie.name,
      poster: movie.stream_icon || tmdbDetails?.poster_path,
      lastWatched: Date.now(),
    });
  };

  // Toggle favorite
  const toggleFavorite = () => {
    if (!movie) return;
    
    if (isFavorite(movie.stream_id.toString(), 'movie')) {
      removeFromFavorites(movie.stream_id.toString(), 'movie');
    } else {
      addToFavorites({
        id: movie.stream_id.toString(),
        type: 'movie',
        name: movie.name,
        poster: movie.stream_icon || tmdbDetails?.poster_path,
        categoryId: movie.category_id,
      });
    }
  };

  // Go back to movies list
  const goBack = () => {
    router.back();
  };

  // Format runtime
  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (moviesLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p>Loading movie...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <p className="mb-4">Movie not found</p>
        <Button onClick={goBack}>Back to Movies</Button>
      </div>
    );
  }

  // Get backdrop URL
  const backdropUrl = tmdbDetails?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${tmdbDetails.backdrop_path}`
    : null;

  // Get poster URL
  const posterUrl = tmdbDetails?.poster_path
    ? `https://image.tmdb.org/t/p/w500${tmdbDetails.poster_path}`
    : movie.stream_icon || null;

  // Get content rating from TMDB
  const getContentRating = () => {
    if (!tmdbDetails) return undefined;
    
    // Check for US certification
    if (tmdbDetails.release_dates?.results) {
      const usRating = tmdbDetails.release_dates.results.find(
        (country) => country.iso_3166_1 === 'US'
      );
      
      if (usRating && usRating.release_dates && usRating.release_dates.length > 0) {
        const certification = usRating.release_dates.find(r => r.certification)?.certification;
        if (certification) return certification;
      }
    }
    
    // Fallback to adult flag
    return tmdbDetails.adult ? 'NC-17' : 'PG-13';
  };
  
  const contentRating = getContentRating();

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={goBack} className="gap-1">
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </Button>
      
      <RestrictedContent 
        categoryId={movie.category_id}
        rating={contentRating}
        title="Age-Restricted Content"
        description="This movie may contain content inappropriate for children. Please enter your parental control PIN to continue."
      >
        {isPlaying ? (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-video w-full">
                {streamUrl ? (
                  <VideoPlayer
                    src={streamUrl}
                    poster={posterUrl || undefined}
                    autoPlay={true}
                    controls={true}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-black text-white">
                    Loading stream...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
        <div className="relative">
          {/* Backdrop */}
          {backdropUrl && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-20 blur-sm"
              style={{ backgroundImage: `url(${backdropUrl})` }}
            />
          )}
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            {/* Poster */}
            <div className="flex justify-center md:justify-start">
              <div className="relative overflow-hidden rounded-lg w-64 aspect-[2/3]">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={movie.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Film className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Details */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h1 className="text-3xl font-bold">{movie.name}</h1>
                {tmdbDetails?.original_title && tmdbDetails.original_title !== movie.name && (
                  <p className="text-muted-foreground">
                    {tmdbDetails.original_title}
                  </p>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {movie.year && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{movie.year}</span>
                  </Badge>
                )}
                
                {tmdbDetails?.runtime && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatRuntime(tmdbDetails.runtime)}</span>
                  </Badge>
                )}
                
                {tmdbDetails?.vote_average && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{tmdbDetails.vote_average.toFixed(1)}/10</span>
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {tmdbDetails?.genres?.map((genre) => (
                  <Badge key={genre.id} variant="secondary">
                    {genre.name}
                  </Badge>
                ))}
              </div>
              
              {(tmdbDetails?.overview || movie.plot) && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Overview</h2>
                  <p className="text-muted-foreground">
                    {tmdbDetails?.overview || movie.plot}
                  </p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={handlePlay}
                >
                  <Play className="h-4 w-4" />
                  <span>Play</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  onClick={toggleFavorite}
                >
                  <Star
                    className={`h-4 w-4 ${
                      isFavorite(movie.stream_id.toString(), 'movie')
                        ? 'fill-yellow-400 text-yellow-400'
                        : ''
                    }`}
                  />
                  <span>
                    {isFavorite(movie.stream_id.toString(), 'movie')
                      ? 'Remove from Favorites'
                      : 'Add to Favorites'}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </RestrictedContent>
      
      {tmdbDetails?.credits && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Cast</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tmdbDetails.credits.cast.slice(0, 6).map((person) => (
              <div key={person.id} className="text-center">
                <div className="aspect-square rounded-full overflow-hidden mb-2 mx-auto w-24">
                  {person.profile_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w200${person.profile_path}`}
                      alt={person.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-2xl font-bold text-muted-foreground">
                        {person.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="font-medium truncate">{person.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {person.character}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {tmdbDetails?.similar && tmdbDetails.similar.results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Similar Movies</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tmdbDetails.similar.results.slice(0, 6).map((similar) => (
              <div key={similar.id} className="text-center">
                <div className="aspect-[2/3] rounded-lg overflow-hidden mb-2">
                  {similar.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w200${similar.poster_path}`}
                      alt={similar.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Film className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="font-medium truncate">{similar.title}</p>
                <p className="text-sm text-muted-foreground">
                  {similar.release_date?.split('-')[0] || 'Unknown'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}