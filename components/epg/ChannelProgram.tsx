'use client';

import { useState } from 'react';
import { EPGProgram } from '@/lib/types';
import { formatDate, formatTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ChannelProgramProps {
  current: EPGProgram | null;
  next: EPGProgram | null;
  allPrograms?: EPGProgram[];
  showAllButton?: boolean;
}

export default function ChannelProgram({ 
  current, 
  next, 
  allPrograms = [],
  showAllButton = true 
}: ChannelProgramProps) {
  const [showAllPrograms, setShowAllPrograms] = useState(false);

  if (!current && !next && allPrograms.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Program bilgisi bulunamadı
      </div>
    );
  }

  const calculateProgress = (start: string, end: string): number => {
    const now = new Date().getTime();
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    
    if (now < startTime) return 0;
    if (now > endTime) return 100;
    
    const total = endTime - startTime;
    const elapsed = now - startTime;
    return Math.floor((elapsed / total) * 100);
  };

  return (
    <div className="space-y-2">
      {current && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Badge variant="default" className="bg-primary">Şu an</Badge>
            <span className="text-xs text-muted-foreground">
              {formatTime(current.start)} - {formatTime(current.end)}
            </span>
          </div>
          <h4 className="font-medium">{current.title}</h4>
          {current.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{current.description}</p>
          )}
          <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mt-1">
            <div 
              className="h-full bg-primary" 
              style={{ width: `${calculateProgress(current.start, current.end)}%` }}
            />
          </div>
        </div>
      )}

      {next && (
        <div className="space-y-1 pt-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline">Sonraki</Badge>
            <span className="text-xs text-muted-foreground">
              {formatTime(next.start)} - {formatTime(next.end)}
            </span>
          </div>
          <h4 className="font-medium">{next.title}</h4>
          {next.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">{next.description}</p>
          )}
        </div>
      )}

      {showAllButton && allPrograms.length > 0 && (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-2"
          onClick={() => setShowAllPrograms(true)}
        >
          Tüm Program Akışı
        </Button>
      )}

      <Dialog open={showAllPrograms} onOpenChange={setShowAllPrograms}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Program Akışı</DialogTitle>
            <DialogDescription>
              {allPrograms.length > 0 && formatDate(allPrograms[0].start)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {allPrograms.map((program) => (
              <Card key={program.id} className={`border ${
                new Date(program.start).getTime() <= new Date().getTime() && 
                new Date(program.end).getTime() > new Date().getTime() 
                  ? 'border-primary' 
                  : ''
              }`}>
                <CardHeader className="p-3 pb-1">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">{program.title}</CardTitle>
                    {program.category && (
                      <Badge variant="outline" className="text-xs">
                        {program.category}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    {formatTime(program.start)} - {formatTime(program.end)}
                  </CardDescription>
                </CardHeader>
                {program.description && (
                  <CardContent className="p-3 pt-0">
                    <p className="text-sm">{program.description}</p>
                  </CardContent>
                )}
              </Card>
            ))}
            
            {allPrograms.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                Bu kanal için program bilgisi bulunamadı
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}