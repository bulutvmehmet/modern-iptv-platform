'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useUserDataStore } from '@/lib/store/useUserDataStore';
import { getVodCategories, getVodStreams } from '@/lib/services/xtreamService';
import { XtreamCategory, XtreamVod } from '@/lib/types';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Search, Film } from 'lucide-react';

export default function MoviesPage() {
  const { credentials } = useAuthStore();
  const { addToFavorites, removeFromFavorites, isFavorite } = useUserDataStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMovies, setFilteredMovies] = useState<XtreamVod[]>([]);

  // Fetch categories
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ['vodCategories'],
    queryFn: () => credentials ? getVodCategories(credentials) : Promise.resolve([]),
    enabled: !!credentials,
  });

  // Fetch movies
  const {
    data: movies,
    isLoading: moviesLoading,
    error: moviesError,
  } = useQuery({
    queryKey: ['vodStreams', selectedCategory],
    queryFn: () => 
      credentials 
        ? getVodStreams(credentials, selectedCategory || undefined) 
        : Promise.resolve([]),
    enabled: !!credentials,
  });

  // Filter movies based on search query
  useEffect(() => {
    if (!movies) {
      setFilteredMovies([]);
      return;
    }

    if (!searchQuery.trim()) {
      setFilteredMovies(movies);
      return;
    }

    const filtered = movies.filter((movie) =>
      movie.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMovies(filtered);
  }, [movies, searchQuery]);

  // Set first category as selected on initial load
  useEffect(() => {
    if (categories && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].category_id);
    }
  }, [categories, selectedCategory]);

  // Toggle favorite
  const toggleFavorite = (movie: XtreamVod, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (isFavorite(movie.stream_id.toString(), 'movie')) {
      removeFromFavorites(movie.stream_id.toString(), 'movie');
    } else {
      addToFavorites({
        id: movie.stream_id.toString(),
        type: 'movie',
        name: movie.name,
        poster: movie.stream_icon,
        categoryId: movie.category_id,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold">Movies</h1>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search movies..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      {categoriesLoading ? (
        <div className="text-center py-8">Loading categories...</div>
      ) : categoriesError ? (
        <div className="text-center py-8 text-red-500">
          Error loading categories. Please try again.
        </div>
      ) : categories && categories.length > 0 ? (
        <Tabs
          defaultValue={selectedCategory || categories[0].category_id}
          onValueChange={(value) => setSelectedCategory(value)}
          className="w-full"
        >
          <div className="border rounded-lg p-1 mb-6 overflow-x-auto">
            <TabsList className="w-full flex flex-nowrap">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.category_id}
                  value={category.category_id}
                  className="flex-shrink-0"
                >
                  {category.category_name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {categories.map((category) => (
            <TabsContent
              key={category.category_id}
              value={category.category_id}
              className="mt-0"
            >
              <Card>
                <CardHeader>
                  <CardTitle>{category.category_name}</CardTitle>
                  <CardDescription>
                    {filteredMovies.length} movies available
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {moviesLoading ? (
                    <div className="text-center py-8">Loading movies...</div>
                  ) : moviesError ? (
                    <div className="text-center py-8 text-red-500">
                      Error loading movies. Please try again.
                    </div>
                  ) : filteredMovies.length === 0 ? (
                    <div className="text-center py-8">
                      {searchQuery
                        ? 'No movies match your search'
                        : 'No movies available in this category'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {filteredMovies.map((movie) => (
                        <Link
                          key={movie.stream_id}
                          href={`/dashboard/movies/${movie.stream_id}`}
                          className="group"
                          legacyBehavior>
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
                              onClick={(e) => toggleFavorite(movie, e)}
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
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="text-center py-8">No categories available</div>
      )}
    </div>
  );
}