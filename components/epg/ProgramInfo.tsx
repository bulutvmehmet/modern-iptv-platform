'use client';

import { EPGProgram } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface ProgramInfoProps {
  program: EPGProgram | null;
  isNow?: boolean;
}

export default function ProgramInfo({ program, isNow = false }: ProgramInfoProps) {
  if (!program) {
    return (
      <div className="text-sm text-muted-foreground">
        No program information available
      </div>
    );
  }

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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{program.title}</h3>
          {isNow && (
            <Badge variant="default" className="text-xs">LIVE</Badge>
          )}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          <span>
            {formatTime(program.start)} - {formatTime(program.end)}
          </span>
        </div>
      </div>
      
      {program.category && (
        <div>
          <Badge variant="outline" className="text-xs">
            {program.category}
          </Badge>
        </div>
      )}
      
      {program.description && (
        <p className="text-sm text-muted-foreground">
          {program.description}
        </p>
      )}
      
      {isNow && (
        <div className="w-full h-1 bg-secondary mt-1">
          <div 
            className="h-full bg-primary" 
            style={{ width: `${calculateProgress(program)}%` }}
          />
        </div>
      )}
    </div>
  );
}