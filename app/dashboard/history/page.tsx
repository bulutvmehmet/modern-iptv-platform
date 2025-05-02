'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUserDataStore } from '@/lib/store/useUserDataStore';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tv, Film, Layers, Trash2, Clock } from 'lucide-react';

export default function HistoryPage() {
  const { watchHistory, clearWatchHistory, removeFromWatchHistory } = useUserDataStore();
  const [activeTab, setActiveTab] = useState('all');

  // Filter history by type
  const filteredHistory = watchHistory.filter((item) => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });

  // Sort by most recent
  const sortedHistory = [...filteredHistory].sort(
    (a, b) => b.lastWatched - a.lastWatched
  );

  // Clear all history
  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear your entire watch history?')) {
      clearWatchHistory();
      toast.success('Watch history cleared');
    }
  };

  // Remove single item
  const handleRemoveItem = (id: string, type: string) => {
    removeFromWatchHistory(id, type);
    toast.success('Item removed from history');
  };

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Watch History</h1>
        
        <Button
          variant="destructive"
          className="gap-2"
          onClick={handleClearAll}
          disabled={watchHistory.length === 0}
        >
          <Trash2 className="h-4 w-4" />
          <span>Clear All History</span>
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
              {watchHistory.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="live" className="flex gap-2">
            <Tv className="h-4 w-4" />
            <span>Live TV</span>
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
              {watchHistory.filter(item => item.type === 'live').length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="movie" className="flex gap-2">
            <Film className="h-4 w-4" />
            <span>Movies</span>
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
              {watchHistory.filter(item => item.type === 'movie').length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="series" className="flex gap-2">
            <Layers className="h-4 w-4" />
            <span>Series</span>
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
              {watchHistory.filter(item => item.type === 'series').length}
            </span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'all' ? 'All Watch History' : 
                 activeTab === 'live' ? 'Live TV History' :
                 activeTab === 'movie' ? 'Movie History' : 'Series History'}
              </CardTitle>
              <CardDescription>
                {sortedHistory.length} items in your history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sortedHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No watch history found
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedHistory.map((item) => (
                    <div
                      key={`${item.id}-${item.type}-${item.lastWatched}`}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Link
                        href={
                          item.type === 'movie'
                            ? `/dashboard/movies/${item.id}`
                            : item.type === 'series'
                            ? `/dashboard/series/${item.id}`
                            : `/dashboard/live/${item.id}`
                        }
                        className="flex items-center gap-4 flex-1"
                      >
                        <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-muted">
                          {item.poster ? (
                            <img
                              src={item.poster}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {item.type === 'movie' ? (
                                <Film className="h-8 w-8 text-muted-foreground" />
                              ) : item.type === 'series' ? (
                                <Layers className="h-8 w-8 text-muted-foreground" />
                              ) : (
                                <Tv className="h-8 w-8 text-muted-foreground" />
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{item.name}</h3>
                          
                          {item.type === 'series' && item.seasonNumber && (
                            <p className="text-sm text-muted-foreground">
                              Season {item.seasonNumber}, Episode {item.episodeNumber}
                              {item.episodeName ? `: ${item.episodeName}` : ''}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(item.lastWatched)}</span>
                          </div>
                        </div>
                      </Link>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={() => handleRemoveItem(item.id, item.type)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
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