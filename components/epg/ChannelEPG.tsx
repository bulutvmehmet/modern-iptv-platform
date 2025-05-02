'use client';

import { useState, useEffect } from 'react';
import { EPGProgram, EPGData } from '@/lib/types';
import { getCurrentAndNextProgram, getChannelProgramsForDate } from '@/lib/services/epgService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface ChannelEPGProps {
  channelId: string;
  epgData: EPGData;
}

export default function ChannelEPG({ channelId, epgData }: ChannelEPGProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [programs, setPrograms] = useState<EPGProgram[]>([]);
  const [currentProgram, setCurrentProgram] = useState<EPGProgram | null>(null);
  const [nextProgram, setNextProgram] = useState<EPGProgram | null>(null);

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time for display
  const formatTime = (timeString: string): string => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate program progress
  const calculateProgress = (program: EPGProgram): number => {
    if (!program) return 0;
    
    const now = new Date().getTime();
    const start = new Date(program.start).getTime();
    const end = new Date(program.end).getTime();
    
    if (now < start || now > end) return 0;
    
    const duration = end - start;
    const elapsed = now - start;
    
    return Math.min(100, Math.max(0, (elapsed / duration) * 100));
  };

  // Navigate to previous day
  const goToPreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
  };

  // Navigate to next day
  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };

  // Go to today
  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Update programs when channel or date changes
  useEffect(() => {
    if (channelId && epgData) {
      // Get programs for selected date
      const datePrograms = getChannelProgramsForDate(epgData, channelId, selectedDate);
      setPrograms(datePrograms);
      
      // Get current and next program
      const { current, next } = getCurrentAndNextProgram(epgData, channelId);
      setCurrentProgram(current);
      setNextProgram(next);
    }
  }, [channelId, epgData, selectedDate]);

  // Check if there are no programs
  if (!programs || programs.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Program Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Button variant="outline" size="sm" onClick={goToPreviousDay}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span>Previous</span>
            </Button>
            
            <Button variant="outline" size="sm" onClick={goToToday}>
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formatDate(selectedDate)}</span>
            </Button>
            
            <Button variant="outline" size="sm" onClick={goToNextDay}>
              <span>Next</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="text-center py-8 text-muted-foreground">
            No program information available for this channel.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Program Guide</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Button variant="outline" size="sm" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span>Previous</span>
          </Button>
          
          <Button variant="outline" size="sm" onClick={goToToday}>
            <Calendar className="h-4 w-4 mr-1" />
            <span>{formatDate(selectedDate)}</span>
          </Button>
          
          <Button variant="outline" size="sm" onClick={goToNextDay}>
            <span>Next</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        {/* Current program */}
        {currentProgram && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-medium">Now Playing</h3>
              <div className="text-sm text-muted-foreground">
                {formatTime(currentProgram.start)} - {formatTime(currentProgram.end)}
              </div>
            </div>
            
            <div className="mb-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{currentProgram.title}</span>
                {currentProgram.category && (
                  <Badge variant="outline">{currentProgram.category}</Badge>
                )}
              </div>
              {currentProgram.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {currentProgram.description}
                </p>
              )}
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-1 bg-secondary mt-2">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${calculateProgress(currentProgram)}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Next program */}
        {nextProgram && (
          <div className="mb-4 pb-4 border-b">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-medium text-sm">Up Next</h3>
              <div className="text-xs text-muted-foreground">
                {formatTime(nextProgram.start)} - {formatTime(nextProgram.end)}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm">{nextProgram.title}</span>
                {nextProgram.category && (
                  <Badge variant="outline" className="text-xs">
                    {nextProgram.category}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Program list */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Full Schedule</h3>
          
          <div className="space-y-2">
            {programs.map((program) => (
              <div 
                key={program.id} 
                className={`p-2 rounded-md ${
                  currentProgram?.id === program.id 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'hover:bg-accent'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{program.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(program.start)} - {formatTime(program.end)}
                  </span>
                </div>
                
                {program.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {program.description}
                  </p>
                )}
                
                {program.category && (
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs">
                      {program.category}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}