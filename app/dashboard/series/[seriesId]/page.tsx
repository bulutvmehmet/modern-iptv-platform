'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useUserDataStore } from '@/lib/store/useUserDataStore';
import { useSettingsStore } from '@/lib/store/useSettingsStore';
import { getSeries, getSeriesInfo, getSeriesStreamUrl } from '@/lib/services/xtreamService';
import { getSeriesDetails } from '@/lib/services/tmdbService';
import { XtreamSeries, XtreamSeriesInfo, TMDBSeriesDetails } from '@/lib/types';
import VideoPlayer from '@/components/player/VideoPlayer';
import RestrictedContent from '@/components/parental-control/RestrictedContent';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Star, Play, Clock, Calendar, Layers, Check, ShieldAlert } from 'lucide-react';

export default function SeriesDetailPage({
  params,
}: {
  params: { seriesId: string };
}) {
  const router = useRouter();
  const { credentials } = useAuthStore();
  const { addToWatchHistory, addToFavorites, removeFromFavorites, isFavorite, isWatched } = useUserDataStore();
  const [series, setSeries] = useState<XtreamSeries | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string>('');

  // Fetch all series to find the current one
  const { data: seriesList, isLoading: seriesLoading } = useQuery({
    queryKey: ['allSeries'],
    queryFn: () => (credentials ? getSeries(credentials) : Promise.resolve([])),
    enabled: !!credentials,
  });

  // Find the series
  useEffect(() => {
    if (seriesList && params.seriesId) {
      const foundSeries = seriesList.find(
        (s) => s.series_id.toString() === params.seriesId
      );
      
      if (foundSeries) {
        setSeries(foundSeries);
      }
    }
  }, [seriesList, params.seriesId]);

  // Fetch series info (seasons and episodes)
  const {
    data: seriesInfo,
    isLoading: seriesInfoLoading,
  } = useQuery({
    queryKey: ['seriesInfo', params.seriesId],
    queryFn: () => 
      credentials && params.seriesId
        ? getSeriesInfo(credentials, parseInt(params.seriesId))
        : Promise.resolve(null),
    enabled: !!credentials && !!params.seriesId,
  });

  // Fetch TMDB details if series is found
  const {
    data: tmdbDetails,
    isLoading: tmdbLoading,
  } = useQuery({
    queryKey: ['seriesDetails', series?.name],
    queryFn: () => 
      series 
        ? getSeriesDetails(series.name) 
        : Promise.resolve(null),
    enabled: !!series,
  });

  // Set first season as selected on initial load
  useEffect(() => {
    if (seriesInfo && seriesInfo.seasons && seriesInfo.seasons.length > 0 && !selectedSeason) {
      // Find the first season with episodes
      const firstValidSeason = seriesInfo.seasons.find(season => 
        season.episodes && season.episodes.length > 0
      );
      
      if (firstValidSeason) {
        setSelectedSeason(parseInt(firstValidSeason.season_number));
      }
    }
  }, [seriesInfo, selectedSeason]);

  // Handle episode selection
  const handleEpisodeSelect = (episode: any) => {
    if (!credentials || !series) return;
    
    setSelectedEpisode(episode);
    setStreamUrl(getSeriesStreamUrl(
      credentials,
      series.series_id,
      episode.season,
      episode.episode_num
    ));
    setIsPlaying(true);
    
    // Add to watch history
    addToWatchHistory({
      id: series.series_id.toString(),
      type: 'series',
      name: series.name,
      poster: series.cover || tmdbDetails?.poster_path,
      lastWatched: Date.now(),
      seasonNumber: episode.season,
      episodeNumber: episode.episode_num,
      episodeName: episode.title,
    });
  };

  // Toggle favorite
  const toggleFavorite = () => {
    if (!series) return;
    
    if (isFavorite(series.series_id.toString(), 'series')) {
      removeFromFavorites(series.series_id.toString(), 'series');
    } else {
      addToFavorites({
        id: series.series_id.toString(),
        type: 'series',
        name: series.name,
        poster: series.cover || tmdbDetails?.poster_path,
        categoryId: series.category_id,
      });
    }
  };

  // Go back to series list
  const goBack = () => {
    router.back();
  };

  // Format episode title
  const formatEpisodeTitle = (episode: any) => {
    return `${episode.episode_num}. ${episode.title || `Episode ${episode.episode_num}`}`;
  };

  if (seriesLoading || seriesInfoLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p>Loading series...</p>
      </div>
    );
  }

  if (!series || !seriesInfo) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <p className="mb-4">Series not found</p>
        <Button onClick={goBack}>Back to Series</Button>
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
    : series.cover || null;

  // Get content rating from TMDB
  const getContentRating = () => {
    if (!tmdbDetails) return undefined;
    
    // Check for US certification
    if (tmdbDetails.content_ratings?.results) {
      const usRating = tmdbDetails.content_ratings.results.find(
        (country) => country.iso_3166_1 === 'US'
      );
      
      if (usRating && usRating.rating) {
        return usRating.rating;
      }
    }
    
    // Fallback to adult flag or default
    return tmdbDetails.adult ? 'TV-MA' : 'TV-14';
  };
  
  const contentRating = getContentRating();

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={goBack} className="gap-1">
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </Button>
      
      <RestrictedContent 
        categoryId={series.category_id}
        rating={contentRating}
        title="Age-Restricted Content"
        description="This series may contain content inappropriate for children. Please enter your parental control PIN to continue."
      >
        {isPlaying && selectedEpisode ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{series.name}</h2>
                <p className="text-muted-foreground">
                  Season {selectedEpisode.season}, Episode {selectedEpisode.episode_num}: {selectedEpisode.title || `Episode ${selectedEpisode.episode_num}`}
                </p>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setIsPlaying(false)}
              >
                Back to Series
              </Button>
            </div>
          
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
          
          {selectedEpisode.info && (
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Episode Info</h3>
              <p>{selectedEpisode.info}</p>
            </div>
          )}
        </div>
      ) : (
        <>
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
                      alt={series.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Layers className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Details */}
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold">{series.name}</h1>
                  {tmdbDetails?.original_name && tmdbDetails.original_name !== series.name && (
                    <p className="text-muted-foreground">
                      {tmdbDetails.original_name}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {series.year && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{series.year}</span>
                    </Badge>
                  )}
                  
                  {series.episode_run_time && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{series.episode_run_time} min</span>
                    </Badge>
                  )}
                  
                  {tmdbDetails?.vote_average && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{tmdbDetails.vote_average.toFixed(1)}/10</span>
                    </Badge>
                  )}
                  
                  {seriesInfo.seasons && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      <span>{seriesInfo.seasons.length} Seasons</span>
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
                
                {(tmdbDetails?.overview || series.plot) && (
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Overview</h2>
                    <p className="text-muted-foreground">
                      {tmdbDetails?.overview || series.plot}
                    </p>
                  </div>
                )}
                
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={toggleFavorite}
                >
                  <Star
                    className={`h-4 w-4 ${
                      isFavorite(series.series_id.toString(), 'series')
                        ? 'fill-yellow-400 text-yellow-400'
                        : ''
                    }`}
                  />
                  <span>
                    {isFavorite(series.series_id.toString(), 'series')
                      ? 'Remove from Favorites'
                      : 'Add to Favorites'}
                  </span>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Seasons and Episodes */}
          {seriesInfo.seasons && seriesInfo.seasons.length > 0 && (
            <Tabs
              defaultValue={selectedSeason?.toString() || seriesInfo.seasons[0].season_number}
              onValueChange={(value) => setSelectedSeason(parseInt(value))}
              className="w-full"
            >
              <div className="border rounded-lg p-1 mb-6 overflow-x-auto">
                <TabsList className="w-full flex flex-nowrap">
                  {seriesInfo.seasons.map((season) => (
                    <TabsTrigger
                      key={season.season_number}
                      value={season.season_number}
                      className="flex-shrink-0"
                      disabled={!season.episodes || season.episodes.length === 0}
                    >
                      Season {season.season_number}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              
              {seriesInfo.seasons.map((season) => (
                <TabsContent
                  key={season.season_number}
                  value={season.season_number}
                  className="mt-0"
                >
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">
                        Season {season.season_number}
                        {season.name && season.name !== `Season ${season.season_number}` && (
                          <span className="ml-2 font-normal text-muted-foreground">
                            {season.name}
                          </span>
                        )}
                      </h3>
                      
                      {season.overview && (
                        <p className="text-muted-foreground mb-6">{season.overview}</p>
                      )}
                      
                      {season.episodes && season.episodes.length > 0 ? (
                        <div className="space-y-2">
                          {season.episodes.map((episode) => (
                            <div
                              key={episode.id}
                              className="flex items-center p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                              onClick={() => handleEpisodeSelect(episode)}
                            >
                              <div className="flex-shrink-0 w-32 h-20 rounded overflow-hidden bg-muted mr-4">
                                {episode.info_img ? (
                                  <img
                                    src={episode.info_img}
                                    alt={episode.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Play className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center">
                                  <h4 className="font-medium truncate">
                                    {formatEpisodeTitle(episode)}
                                  </h4>
                                  {isWatched(
                                    series.series_id.toString(),
                                    'series',
                                    episode.season,
                                    episode.episode_num
                                  ) && (
                                    <Check className="h-4 w-4 ml-2 text-green-500" />
                                  )}
                                </div>
                                
                                {episode.added && (
                                  <p className="text-xs text-muted-foreground">
                                    Added: {new Date(episode.added).toLocaleDateString()}
                                  </p>
                                )}
                                
                                {episode.info && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {episode.info}
                                  </p>
                                )}
                              </div>
                              
                              <Button
                                size="sm"
                                className="flex-shrink-0 ml-2"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No episodes available for this season
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          )}
          
          {/* Cast */}
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
          
          {/* Similar Series */}
          {tmdbDetails?.similar && tmdbDetails.similar.results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Similar Series</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {tmdbDetails.similar.results.slice(0, 6).map((similar) => (
                  <div key={similar.id} className="text-center">
                    <div className="aspect-[2/3] rounded-lg overflow-hidden mb-2">
                      {similar.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w200${similar.poster_path}`}
                          alt={similar.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Layers className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="font-medium truncate">{similar.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {similar.first_air_date?.split('-')[0] || 'Unknown'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      </RestrictedContent>
    </div>
  );
}