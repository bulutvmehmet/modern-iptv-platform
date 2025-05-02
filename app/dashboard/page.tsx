'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useUserDataStore } from '@/lib/store/useUserDataStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tv, Film, Layers, History, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { userInfo } = useAuthStore();
  const { watchHistory } = useUserDataStore();
  const [recentItems, setRecentItems] = useState<any[]>([]);

  // Get recent watch history items
  useEffect(() => {
    const recent = watchHistory
      .sort((a, b) => b.lastWatched - a.lastWatched)
      .slice(0, 6);
    setRecentItems(recent);
  }, [watchHistory]);

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      // Convert timestamp to date if it's a number
      const date = typeof dateString === 'number' 
        ? new Date(dateString * 1000)  // Convert Unix timestamp to milliseconds
        : new Date(dateString);
        
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Welcome to IPTV Platform</CardTitle>
            <CardDescription>
              Access your favorite channels, movies, and series
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userInfo && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Username:</span>
                  <span className="font-medium">{userInfo.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subscription expires:</span>
                  <span className="font-medium">{formatDate(userInfo.exp_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active connections:</span>
                  <span className="font-medium">{userInfo.active_cons} / {userInfo.max_connections}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>
              Navigate to your content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <Link href="/dashboard/live">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                  <Tv className="h-6 w-6" />
                  <span>Live TV</span>
                </Button>
              </Link>
              <Link href="/dashboard/movies">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                  <Film className="h-6 w-6" />
                  <span>Movies</span>
                </Button>
              </Link>
              <Link href="/dashboard/series">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                  <Layers className="h-6 w-6" />
                  <span>Series</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {recentItems.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Continue Watching</CardTitle>
              <CardDescription>
                Pick up where you left off
              </CardDescription>
            </div>
            <Link href="/dashboard/history">
              <Button variant="ghost" size="sm" className="gap-1">
                <History className="h-4 w-4" />
                <span>View All</span>
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {recentItems.map((item) => (
                <Link
                  key={`${item.id}-${item.type}`}
                  href={
                    item.type === 'movie'
                      ? `/dashboard/movies/${item.id}`
                      : item.type === 'series'
                      ? `/dashboard/series/${item.id}${
                          item.seasonNumber
                            ? `/season/${item.seasonNumber}/episode/${item.episodeNumber}`
                            : ''
                        }`
                      : `/dashboard/live/${item.id}`
                  }
                >
                  <div className="relative group overflow-hidden rounded-lg">
                    <div
                      className="aspect-[2/3] bg-cover bg-center"
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
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      <h3 className="text-white font-medium truncate">{item.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-white/80">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(item.lastWatched).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {item.progress !== undefined && item.progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}