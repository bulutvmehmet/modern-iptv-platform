'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUserDataStore } from '@/lib/store/useUserDataStore';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tv, Film, Layers, Trash2, Star } from 'lucide-react';

export default function FavoritesPage() {
  const { favorites, clearFavorites, removeFromFavorites } = useUserDataStore();
  const [activeTab, setActiveTab] = useState('all');

  // Filter favorites by type
  const filteredFavorites = favorites.filter((item) => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });

  // Clear all favorites
  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all your favorites?')) {
      clearFavorites();
      toast.success('Favorites cleared');
    }
  };

  // Remove single item
  const handleRemoveItem = (id: string, type: string) => {
    removeFromFavorites(id, type);
    toast.success('Item removed from favorites');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Favorites</h1>
        
        <Button
          variant="destructive"
          className="gap-2"
          onClick={handleClearAll}
          disabled={favorites.length === 0}
        >
          <Trash2 className="h-4 w-4" />
          <span>Clear All Favorites</span>
        </Button>
      </div>
      
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
              {favorites.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="live" className="flex gap-2">
            <Tv className="h-4 w-4" />
            <span>Live TV</span>
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
              {favorites.filter(item => item.type === 'live').length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="movie" className="flex gap-2">
            <Film className="h-4 w-4" />
            <span>Movies</span>
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
              {favorites.filter(item => item.type === 'movie').length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="series" className="flex gap-2">
            <Layers className="h-4 w-4" />
            <span>Series</span>
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
              {favorites.filter(item => item.type === 'series').length}
            </span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'all' ? 'All Favorites' : 
                 activeTab === 'live' ? 'Favorite Channels' :
                 activeTab === 'movie' ? 'Favorite Movies' : 'Favorite Series'}
              </CardTitle>
              <CardDescription>
                {filteredFavorites.length} items in your favorites
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredFavorites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No favorites found
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredFavorites.map((item) => (
                    <div key={`${item.id}-${item.type}`} className="group relative">
                      <Link
                        href={
                          item.type === 'movie'
                            ? `/dashboard/movies/${item.id}`
                            : item.type === 'series'
                            ? `/dashboard/series/${item.id}`
                            : `/dashboard/live/${item.id}`
                        }
                      >
                        <div className="relative overflow-hidden rounded-lg aspect-[2/3]">
                          <div
                            className="w-full h-full bg-cover bg-center transition-transform group-hover:scale-105"
                            style={{
                              backgroundImage: item.poster
                                ? `url(${item.poster})`
                                : 'none',
                              backgroundColor: !item.poster ? 'rgba(0,0,0,0.2)' : 'transparent',
                            }}
                          >
                            {!item.poster && (
                              <div className="flex items-center justify-center h-full">
                                {item.type === 'movie' ? (
                                  <Film className="h-12 w-12 text-muted-foreground" />
                                ) : item.type === 'series' ? (
                                  <Layers className="h-12 w-12 text-muted-foreground" />
                                ) : (
                                  <Tv className="h-12 w-12 text-muted-foreground" />
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                            <h3 className="text-white font-medium truncate">{item.name}</h3>
                            <p className="text-white/70 text-xs">
                              {item.type === 'movie' ? 'Movie' : 
                               item.type === 'series' ? 'Series' : 'Channel'}
                            </p>
                          </div>
                          
                          <div className="absolute top-1 right-1">
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          </div>
                        </div>
                      </Link>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70"
                        onClick={() => handleRemoveItem(item.id, item.type)}
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}