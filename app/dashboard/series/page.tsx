'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useUserDataStore } from '@/lib/store/useUserDataStore';
import { getSeriesCategories, getSeries } from '@/lib/services/xtreamService';
import { XtreamCategory, XtreamSeries } from '@/lib/types';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Search, Layers } from 'lucide-react';

export default function SeriesPage() {
  const { credentials } = useAuthStore();
  const { addToFavorites, removeFromFavorites, isFavorite } = useUserDataStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSeries, setFilteredSeries] = useState<XtreamSeries[]>([]);

  // Fetch categories
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ['seriesCategories'],
    queryFn: () => credentials ? getSeriesCategories(credentials) : Promise.resolve([]),
    enabled: !!credentials,
  });

  // Fetch series
  const {
    data: seriesList,
    isLoading: seriesLoading,
    error: seriesError,
  } = useQuery({
    queryKey: ['seriesList', selectedCategory],
    queryFn: () => 
      credentials 
        ? getSeries(credentials, selectedCategory || undefined) 
        : Promise.resolve([]),
    enabled: !!credentials,
  });

  // Filter series based on search query
  useEffect(() => {
    if (!seriesList) {
      setFilteredSeries([]);
      return;
    }

    if (!searchQuery.trim()) {
      setFilteredSeries(seriesList);
      return;
    }

    const filtered = seriesList.filter((series) =>
      series.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSeries(filtered);
  }, [seriesList, searchQuery]);

  // Set first category as selected on initial load
  useEffect(() => {
    if (categories && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].category_id);
    }
  }, [categories, selectedCategory]);

  // Toggle favorite
  const toggleFavorite = (series: XtreamSeries, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (isFavorite(series.series_id.toString(), 'series')) {
      removeFromFavorites(series.series_id.toString(), 'series');
    } else {
      addToFavorites({
        id: series.series_id.toString(),
        type: 'series',
        name: series.name,
        poster: series.cover,
        categoryId: series.category_id,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold">Series</h1>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search series..."
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
                    {filteredSeries.length} series available
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {seriesLoading ? (
                    <div className="text-center py-8">Loading series...</div>
                  ) : seriesError ? (
                    <div className="text-center py-8 text-red-500">
                      Error loading series. Please try again.
                    </div>
                  ) : filteredSeries.length === 0 ? (
                    <div className="text-center py-8">
                      {searchQuery
                        ? 'No series match your search'
                        : 'No series available in this category'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {filteredSeries.map((series) => (
                        <Link
                          key={series.series_id}
                          href={`/dashboard/series/${series.series_id}`}
                          className="group"
                        >
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
                                {series.episode_run_time ? `${series.episode_run_time} min` : ''}
                                {series.year ? (series.episode_run_time ? ' • ' : '') + series.year : ''}
                              </p>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => toggleFavorite(series, e)}
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