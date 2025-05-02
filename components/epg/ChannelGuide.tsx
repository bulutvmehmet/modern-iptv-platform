'use client';

import { useState, useEffect } from 'react';
import { XtreamChannel, EPGData } from '@/lib/types';
import { getCurrentAndNextProgram } from '@/lib/services/epgService';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import ProgramInfo from './ProgramInfo';

interface ChannelGuideProps {
  channels: XtreamChannel[];
  epgData: EPGData;
  onSelectChannel: (channel: XtreamChannel) => void;
  selectedChannelId?: number;
}

export default function ChannelGuide({ 
  channels, 
  epgData, 
  onSelectChannel,
  selectedChannelId 
}: ChannelGuideProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [filteredChannels, setFilteredChannels] = useState<XtreamChannel[]>(channels);

  // Update filtered channels when tab changes
  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredChannels(channels);
    } else if (activeTab === 'withEpg') {
      // Filter channels that have EPG data
      setFilteredChannels(
        channels.filter(channel => 
          channel.epg_channel_id && epgData[channel.epg_channel_id]?.length > 0
        )
      );
    }
  }, [activeTab, channels, epgData]);

  return (
    <Card className="h-full">
      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <div className="p-4 border-b">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All Channels</TabsTrigger>
            <TabsTrigger value="withEpg">With Guide</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="all" className="m-0">
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="space-y-1 p-2">
                {filteredChannels.map(channel => (
                  <ChannelItem 
                    key={channel.stream_id}
                    channel={channel}
                    epgData={epgData}
                    onClick={() => onSelectChannel(channel)}
                    isSelected={channel.stream_id === selectedChannelId}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="withEpg" className="m-0">
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="space-y-1 p-2">
                {filteredChannels.map(channel => (
                  <ChannelItem 
                    key={channel.stream_id}
                    channel={channel}
                    epgData={epgData}
                    onClick={() => onSelectChannel(channel)}
                    isSelected={channel.stream_id === selectedChannelId}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

interface ChannelItemProps {
  channel: XtreamChannel;
  epgData: EPGData;
  onClick: () => void;
  isSelected: boolean;
}

function ChannelItem({ channel, epgData, onClick, isSelected }: ChannelItemProps) {
  const [currentProgram, setCurrentProgram] = useState(null);
  const [nextProgram, setNextProgram] = useState(null);

  // Get current and next program
  useEffect(() => {
    if (channel.epg_channel_id && epgData[channel.epg_channel_id]) {
      const { current, next } = getCurrentAndNextProgram(epgData, channel.epg_channel_id);
      setCurrentProgram(current);
      setNextProgram(next);
    }
  }, [channel.epg_channel_id, epgData]);

  return (
    <div 
      className={`p-2 rounded-md cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-primary/10 border border-primary/20' 
          : 'hover:bg-accent'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {channel.stream_icon && (
          <img 
            src={channel.stream_icon} 
            alt={channel.name} 
            className="w-10 h-10 object-contain rounded"
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/40x40?text=TV';
            }}
          />
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{channel.name}</h3>
          
          {currentProgram ? (
            <div className="text-xs text-muted-foreground truncate">
              Now: {currentProgram.title}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              No program info
            </div>
          )}
          
          {nextProgram && (
            <div className="text-xs text-muted-foreground truncate">
              Next: {nextProgram.title}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}