'use client';

import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/lib/store/useSettingsStore';
import PinDialog from './PinDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Lock } from 'lucide-react';

interface RestrictedContentProps {
  categoryId: string;
  rating?: string;
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function RestrictedContent({
  categoryId,
  rating,
  children,
  title = 'Restricted Content',
  description = 'This content is restricted by parental controls',
}: RestrictedContentProps) {
  const [showContent, setShowContent] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const { isContentRestricted, parentalControlEnabled } = useSettingsStore();
  
  const isRestricted = isContentRestricted(categoryId, rating);

  // Check if content should be restricted
  useEffect(() => {
    setShowContent(!isRestricted);
  }, [isRestricted, parentalControlEnabled]);

  // Handle unlock button click
  const handleUnlock = () => {
    setShowPinDialog(true);
  };

  // Handle successful PIN verification
  const handlePinSuccess = () => {
    setShowContent(true);
  };

  // If parental controls are disabled or content is not restricted, show content
  if (!parentalControlEnabled || showContent) {
    return <>{children}</>;
  }

  // Otherwise show restricted content message
  return (
    <>
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
              <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-red-700 dark:text-red-400">{title}</h3>
              <p className="text-red-600/80 dark:text-red-300/80">{description}</p>
            </div>
            
            <Button 
              variant="outline" 
              className="mt-4 border-red-200 dark:border-red-800 gap-2"
              onClick={handleUnlock}
            >
              <Lock className="h-4 w-4" />
              <span>Unlock with PIN</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <PinDialog
        isOpen={showPinDialog}
        onClose={() => setShowPinDialog(false)}
        onSuccess={handlePinSuccess}
      />
    </>
  );
}