'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useUserDataStore } from '@/lib/store/useUserDataStore';
import { 
  getLiveChannels, 
  getVodStreams, 
  getSeries 
} from '@/lib/services/xtreamService';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tv, Film, Layers, Search, Star } from 'lucide-react';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const { credentials } = useAuthStore();
  const { addToFavorites, removeFromFavorites, isFavorite } = useUserDataStore();
  
  const [searchQuery, setSearchQuery] = useState(query);
  const [activeTab, setActiveTab] = useState('all');
  const [searchResults, setSearchResults] = useState({
    channels: [],
    movies: [],
    series: [],
  });

  // Fetch all content
  const { data: channels } = useQuery({
    queryKey: ['allLiveChannels'],
    queryFn: () => credentials ? getLiveChannels(credentials) : Promise.resolve([]),
    enabled: !!credentials,
  });

  const { data: movies } = useQuery({
    queryKey: ['allVodStreams'],
    queryFn: () => credentials ? getVodStreams(credentials) : Promise.resolve([]),
    enabled: !!credentials,
  });

  const { data: seriesList } = useQuery({
    queryKey: ['allSeries'],
    queryFn: () => credentials ? getSeries(credentials) : Promise.resolve([]),
    enabled: !!credentials,
  });

  // Perform search when query changes
  useEffect(() => {
    if (!query) return;
    
    const lowerQuery = query.toLowerCase();
    
    const filteredChannels = channels?.filter(channel => 
      channel.name.toLowerCase().includes(lowerQuery)
    ) || [];
    
    const filteredMovies = movies?.filter(movie => 
      movie.name.toLowerCase().includes(lowerQuery)
    ) || [];
    
    const filteredSeries = seriesList?.filter(series => 
      series.name.toLowerCase().includes(lowerQuery)
    ) || [];
    
    setSearchResults({
      channels: filteredChannels,
      movies: filteredMovies,
      series: filteredSeries,
    });
  }, [query, channels, movies, seriesList]);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
  };

  // Toggle favorite
  const toggleFavorite = (id: string, type: string, name: string, poster: string, categoryId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (isFavorite(id, type)) {
      removeFromFavorites(id, type);
    } else {
      addToFavorites({
        id,
        type,
        name,
        poster,
        categoryId,
      });
    }
  };

  // Get total results count
  const totalResults = 
    searchResults.channels.length + 
    searchResults.movies.length + 
    searchResults.series.length;

  // Filter results by active tab
  const getFilteredResults = () => {
    if (activeTab === 'all') {
      return {
        channels: searchResults.channels,
        movies: searchResults.movies,
        series: searchResults.series,
      };
    }
    
    return {
      channels: activeTab === 'live' ? searchResults.channels : [],
      movies: activeTab === 'movie' ? searchResults.movies : [],
      series: activeTab === 'series' ? searchResults.series : [],
    };
  };

  const filteredResults = getFilteredResults();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Search</h1>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for channels, movies, or series..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </div>
      {query && (
        <div className="space-y-6">
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList>
              <TabsTrigger value="all" className="flex gap-2">
                <span>All</span>
                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                  {totalResults}
                </span>
              </TabsTrigger>
              <TabsTrigger value="live" className="flex gap-2">
                <Tv className="h-4 w-4" />
                <span>Live TV</span>
                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                  {searchResults.channels.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="movie" className="flex gap-2">
                <Film className="h-4 w-4" />
                <span>Movies</span>
                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                  {searchResults.movies.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="series" className="flex gap-2">
                <Layers className="h-4 w-4" />
                <span>Series</span>
                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                  {searchResults.series.length}
                </span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Search Results for "{query}"</CardTitle>
                  <CardDescription>
                    {totalResults} results found
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Live TV Results */}
                  {filteredResults.channels.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Tv className="h-5 w-5" />
                        <span>Live TV Channels</span>
                      </h2>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {filteredResults.channels.slice(0, 6).map((channel) => (
                          <Link
                            key={channel.stream_id}
                            href={`/dashboard/live/${channel.stream_id}`}
                            className="group block">
                            <div className="relative overflow-hidden rounded-lg aspect-video">
                              <div
                                className="w-full h-full bg-cover bg-center transition-transform group-hover:scale-105 flex items-center justify-center"
                                style={{
                                  backgroundImage: channel.stream_icon
                                    ? `url(${channel.stream_icon})`
                                    : 'none',
                                  backgroundColor: !channel.stream_icon ? 'rgba(0,0,0,0.2)' : 'transparent',
                                  backgroundSize: 'contain',
                                  backgroundRepeat: 'no-repeat',
                                }}
                              >
                                {!channel.stream_icon && (
                                  <Tv className="h-12 w-12 text-muted-foreground" />
                                )}
                              </div>
                              
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <h3 className="text-white font-medium truncate">{channel.name}</h3>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => toggleFavorite(
                                  channel.stream_id.toString(),
                                  'live',
                                  channel.name,
                                  channel.stream_icon,
                                  channel.category_id,
                                  e
                                )}
                              >
                                <Star
                                  className={`h-5 w-5 ${
                                    isFavorite(channel.stream_id.toString(), 'live')
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-white'
                                  }`}
                                />
                              </Button>
                            </div>
                          </Link>
                        ))}
                      </div>
                      
                      {filteredResults.channels.length > 6 && (
                        <div className="text-center">
                          <Button
                            variant="outline"
                            onClick={() => setActiveTab('live')}
                          >
                            View All {filteredResults.channels.length} Channels
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Movies Results */}
                  {filteredResults.movies.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Film className="h-5 w-5" />
                        <span>Movies</span>
                      </h2>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {filteredResults.movies.slice(0, 6).map((movie) => (
                          <Link
                            key={movie.stream_id}
                            href={`/dashboard/movies/${movie.stream_id}`}
                            className="group block">
                            <div className="relative overflow-hidden rounded-lg aspect-[2/3]">
                              <div
                                className="w-full h-full bg-cover bg-center transition-transform group-hover:scale-105"
                                style={{
                                  backgroundImage: movie.stream_icon
                                    ? `url(${movie.stream_icon})`
                                    : 'none',
                                  backgroundColor: !movie.stream_icon ? 'rgba(0,0,0,0.2)' : 'transparent',
                                }}
                              >
                                {!movie.stream_icon && (
                                  <div className="flex items-center justify-center h-full">
                                    <Film className="h-12 w-12 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <h3 className="text-white font-medium truncate">{movie.name}</h3>
                                <p className="text-white/70 text-xs">
                                  {movie.year || 'Unknown year'}
                                </p>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => toggleFavorite(
                                  movie.stream_id.toString(),
                                  'movie',
                                  movie.name,
                                  movie.stream_icon,
                                  movie.category_id,
                                  e
                                )}
                              >
                                <Star
                                  className={`h-5 w-5 ${
                                    isFavorite(movie.stream_id.toString(), 'movie')
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-white'
                                  }`}
                                />
                              </Button>
                            </div>
                          </Link>
                        ))}
                      </div>
                      
                      {filteredResults.movies.length > 6 && (
                        <div className="text-center">
                          <Button
                            variant="outline"
                            onClick={() => setActiveTab('movie')}
                          >
                            View All {filteredResults.movies.length} Movies
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Series Results */}
                  {filteredResults.series.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Layers className="h-5 w-5" />
                        <span>Series</span>
                      </h2>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {filteredResults.series.slice(0, 6).map((series) => (
                          <Link
                            key={series.series_id}
                            href={`/dashboard/series/${series.series_id}`}
                            className="group block">
                            <div className="relative overflow-hidden rounded-lg aspect-[2/3]">
                              <div
                                className="w-full h-full bg-cover bg-center transition-transform group-hover:scale-105"
                                style={{
                                  backgroundImage: series.cover
                                    ? `url(${series.cover})`
                                    : 'none',
                                  backgroundColor: !series.cover ? 'rgba(0,0,0,0.2)' : 'transparent',
                                }}
                              >
                                {!series.cover && (
                                  <div className="flex items-center justify-center h-full">
                                    <Layers className="h-12 w-12 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <h3 className="text-white font-medium truncate">{series.name}</h3>
                                <p className="text-white/70 text-xs">
                                  {series.year || 'Unknown year'}
                                </p>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => toggleFavorite(
                                  series.series_id.toString(),
                                  'series',
                                  series.name,
                                  series.cover,
                                  series.category_id,
                                  e
                                )}
                              >
                                <Star
                                  className={`h-5 w-5 ${
                                    isFavorite(series.series_id.toString(), 'series')
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-white'
                                  }`}
                                />
                              </Button>
                            </div>
                          </Link>
                        ))}
                      </div>
                      
                      {filteredResults.series.length > 6 && (
                        <div className="text-center">
                          <Button
                            variant="outline"
                            onClick={() => setActiveTab('series')}
                          >
                            View All {filteredResults.series.length} Series
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* No Results */}
                  {totalResults === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No results found for "{query}"
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}