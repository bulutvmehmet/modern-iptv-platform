'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useUserDataStore } from '@/lib/store/useUserDataStore';
import { useSettingsStore } from '@/lib/store/useSettingsStore';
import { getLiveChannels, getLiveStreamUrl } from '@/lib/services/xtreamService';
import { fetchEPG } from '@/lib/services/epgService';
import { XtreamChannel, EPGData } from '@/lib/types';
import VideoPlayer from '@/components/player/VideoPlayer';
import ChannelEPG from '@/components/epg/ChannelEPG';
import ProgramInfo from '@/components/epg/ProgramInfo';
import RestrictedContent from '@/components/parental-control/RestrictedContent';
import { getCurrentAndNextProgram, getChannelProgramsForDate } from '@/lib/services/epgService';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Star, Info, Calendar, ShieldAlert } from 'lucide-react';

export default function ChannelPlayerPage({
  params,
}: {
  params: { channelId: string };
}) {
  const router = useRouter();
  const { credentials } = useAuthStore();
  const { addToWatchHistory, addToFavorites, removeFromFavorites, isFavorite } = useUserDataStore();
  const [channel, setChannel] = useState<XtreamChannel | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [showEpgDialog, setShowEpgDialog] = useState(false);

  // Fetch all channels to find the current one
  const { data: channels, isLoading } = useQuery({
    queryKey: ['allLiveChannels'],
    queryFn: () => (credentials ? getLiveChannels(credentials) : Promise.resolve([])),
    enabled: !!credentials,
  });

  // Fetch EPG data
  const { data: epgData, isLoading: epgLoading } = useQuery({
    queryKey: ['epgData'],
    queryFn: () => (credentials ? fetchEPG(credentials) : Promise.resolve({} as EPGData)),
    enabled: !!credentials,
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });

  // Find the channel and set stream URL
  useEffect(() => {
    if (channels && params.channelId) {
      const foundChannel = channels.find(
        (c) => c.stream_id.toString() === params.channelId
      );
      
      if (foundChannel && credentials) {
        setChannel(foundChannel);
        setStreamUrl(getLiveStreamUrl(credentials, foundChannel.stream_id));
        
        // Add to watch history
        addToWatchHistory({
          id: foundChannel.stream_id.toString(),
          type: 'live',
          name: foundChannel.name,
          poster: foundChannel.stream_icon,
          lastWatched: Date.now(),
        });
      }
    }
  }, [channels, params.channelId, credentials, addToWatchHistory]);

  // Toggle favorite
  const toggleFavorite = () => {
    if (!channel) return;
    
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

  // Go back to channels list
  const goBack = () => {
    router.back();
  };

  // Get current and next program
  const getCurrentProgram = () => {
    if (!channel || !epgData || !channel.epg_channel_id) {
      return { current: null, next: null };
    }
    
    return getCurrentAndNextProgram(epgData, channel.epg_channel_id);
  };

  // Get today's programs
  const getTodayPrograms = () => {
    if (!channel || !epgData || !channel.epg_channel_id) {
      return [];
    }
    
    return getChannelProgramsForDate(epgData, channel.epg_channel_id, new Date());
  };

  const { current, next } = getCurrentProgram();
  const todayPrograms = getTodayPrograms();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p>Loading channel...</p>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <p className="mb-4">Channel not found</p>
        <Button onClick={goBack}>Back to Channels</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={goBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
        
        <div className="flex items-center gap-2">
          <Dialog open={showEpgDialog} onOpenChange={setShowEpgDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Calendar className="h-4 w-4" />
                <span>Program Guide</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              {channel.epg_channel_id && epgData ? (
                <ChannelEPG channelId={channel.epg_channel_id} epgData={epgData} />
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No program guide available for this channel
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={toggleFavorite}
          >
            <Star
              className={`h-4 w-4 ${
                isFavorite(channel.stream_id.toString(), 'live')
                  ? 'fill-yellow-400 text-yellow-400'
                  : ''
              }`}
            />
            <span>
              {isFavorite(channel.stream_id.toString(), 'live')
                ? 'Remove from Favorites'
                : 'Add to Favorites'}
            </span>
          </Button>
        </div>
      </div>
      
      <h1 className="text-2xl font-bold">{channel.name}</h1>
      
      <RestrictedContent 
        categoryId={channel.category_id}
        title="Restricted Channel"
        description="This channel may contain content inappropriate for children. Please enter your parental control PIN to continue."
      >
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="aspect-video w-full">
              {streamUrl ? (
                <VideoPlayer
                  src={streamUrl}
                  poster={channel.stream_icon}
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
      </RestrictedContent>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Now Playing</h2>
              
              {current ? (
                <ProgramInfo program={current} isNow={true} />
              ) : (
                <div className="text-muted-foreground">
                  No program information available
                </div>
              )}
              
              {next && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Up Next</h3>
                  <ProgramInfo program={next} />
                </div>
              )}
              
              {todayPrograms.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium">Today's Schedule</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowEpgDialog(true)}
                    >
                      View Full Guide
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {todayPrograms.slice(0, 5).map((program) => (
                      <div 
                        key={program.id} 
                        className={`p-2 rounded-md ${
                          current?.id === program.id 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'hover:bg-accent'
                        }`}
                      >
                        <ProgramInfo program={program} isNow={current?.id === program.id} />
                      </div>
                    ))}
                    
                    {todayPrograms.length > 5 && (
                      <Button 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={() => setShowEpgDialog(true)}
                      >
                        Show More ({todayPrograms.length - 5} more programs)
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Channel Info</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Channel Number:</span>
                  <span>{channel.num}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span>{channel.category_id}</span>
                </div>
                
                {channel.epg_channel_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">EPG ID:</span>
                    <span className="text-sm">{channel.epg_channel_id}</span>
                  </div>
                )}
                
                <div className="pt-4">
                  <div className="flex justify-center">
                    {channel.stream_icon && (
                      <img 
                        src={channel.stream_icon} 
                        alt={channel.name} 
                        className="max-h-24 object-contain"
                      />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}