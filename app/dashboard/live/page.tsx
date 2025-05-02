'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useUserDataStore } from '@/lib/store/useUserDataStore';
import { getLiveCategories, getLiveChannels } from '@/lib/services/xtreamService';
import { fetchEPG } from '@/lib/services/epgService';
import { XtreamChannel, EPGData } from '@/lib/types';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Search, Tv, Clock } from 'lucide-react';
import { getCurrentAndNextProgram } from '@/lib/services/epgService';
import Link from 'next/link';

export default function LiveTVPage() {
  const router = useRouter();
  const { credentials } = useAuthStore();
  const { addToFavorites, removeFromFavorites, isFavorite } = useUserDataStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChannels, setFilteredChannels] = useState<XtreamChannel[]>([]);

  // Fetch categories
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ['liveCategories'],
    queryFn: () => credentials ? getLiveCategories(credentials) : Promise.resolve([]),
    enabled: !!credentials,
  });

  // Fetch channels
  const {
    data: channels,
    isLoading: channelsLoading,
    error: channelsError,
  } = useQuery({
    queryKey: ['liveChannels', selectedCategory],
    queryFn: () => 
      credentials 
        ? getLiveChannels(credentials, selectedCategory || undefined) 
        : Promise.resolve([]),
    enabled: !!credentials,
  });

  // Fetch EPG data
  const {
    data: epgData,
    isLoading: epgLoading,
  } = useQuery({
    queryKey: ['epgData'],
    queryFn: () => credentials ? fetchEPG(credentials) : Promise.resolve({} as EPGData),
    enabled: !!credentials,
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });

  // Filter channels based on search query
  useEffect(() => {
    if (!channels) {
      setFilteredChannels([]);
      return;
    }

    if (!searchQuery.trim()) {
      setFilteredChannels(channels);
      return;
    }

    const filtered = channels.filter((channel) =>
      channel.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredChannels(filtered);
  }, [channels, searchQuery]);

  // Set first category as selected on initial load
  useEffect(() => {
    if (categories && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].category_id);
    }
  }, [categories, selectedCategory]);

  // Toggle favorite
  const toggleFavorite = (e: React.MouseEvent, channel: XtreamChannel) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isFavorite(channel.stream_id.toString(), 'live')) {
      removeFromFavorites(channel.stream_id.toString(), 'live');
    } else {
      addToFavorites({
        id: channel.stream_id.toString(),
        type: 'live',
        name: channel.name,
        poster: channel.stream_icon,
        categoryId: channel.category_id,
      });
    }
  };

  // Navigate to channel
  const navigateToChannel = (channel: XtreamChannel) => {
    router.push(`/dashboard/live/${channel.stream_id}`);
  };

  // Format time for display
  const formatTime = (timeString: string): string => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold">Live TV</h1>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search channels..."
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
                    {filteredChannels.length} channels available
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {channelsLoading ? (
                    <div className="text-center py-8">Loading channels...</div>
                  ) : channelsError ? (
                    <div className="text-center py-8 text-red-500">
                      Error loading channels. Please try again.
                    </div>
                  ) : filteredChannels.length === 0 ? (
                    <div className="text-center py-8">
                      {searchQuery
                        ? 'No channels match your search'
                        : 'No channels available in this category'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredChannels.map((channel) => {
                        const isFav = isFavorite(channel.stream_id.toString(), 'live');
                        const { current, next } = channel.epg_channel_id && epgData 
                          ? getCurrentAndNextProgram(epgData, channel.epg_channel_id)
                          : { current: null, next: null };
                          
                        return (
                          <Card 
                            key={channel.stream_id}
                            className={`cursor-pointer hover:bg-accent/50 transition-colors overflow-hidden ${
                              isFav ? 'border-yellow-400/50' : ''
                            }`}
                            onClick={() => navigateToChannel(channel)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-muted flex items-center justify-center">
                                  {channel.stream_icon ? (
                                    <img
                                      src={channel.stream_icon}
                                      alt={channel.name}
                                      className="w-full h-full object-contain"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <Tv className="h-8 w-8 text-muted-foreground" />
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <h3 className="font-medium truncate">{channel.name}</h3>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="flex-shrink-0 h-8 w-8 -mt-1 -mr-2"
                                      onClick={(e) => toggleFavorite(e, channel)}
                                    >
                                      <Star
                                        className={`h-4 w-4 ${
                                          isFav ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                                        }`}
                                      />
                                    </Button>
                                  </div>
                                  
                                  {current ? (
                                    <div className="mt-1">
                                      <div className="flex items-center text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                                        <span className="truncate">
                                          {formatTime(current.start)} - {formatTime(current.end)}
                                        </span>
                                      </div>
                                      <p className="text-sm font-medium truncate mt-1">
                                        {current.title}
                                      </p>
                                      
                                      {/* Progress bar */}
                                      <div className="w-full h-1 bg-secondary mt-2">
                                        <div 
                                          className="h-full bg-primary" 
                                          style={{ 
                                            width: `${(() => {
                                              const now = new Date().getTime();
                                              const start = new Date(current.start).getTime();
                                              const end = new Date(current.end).getTime();
                                              const duration = end - start;
                                              const elapsed = now - start;
                                              return Math.min(100, Math.max(0, (elapsed / duration) * 100));
                                            })()}%` 
                                          }}
                                        />
                                      </div>
                                      
                                      {next && (
                                        <div className="mt-2">
                                          <div className="flex items-center text-xs text-muted-foreground">
                                            <span className="font-medium">Next:</span>
                                            <span className="ml-1 truncate">{next.title}</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      No program information available
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
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