'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSettingsStore } from '@/lib/store/useSettingsStore';
import { Lock, AlertCircle } from 'lucide-react';

interface PinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export default function PinDialog({
  isOpen,
  onClose,
  onSuccess,
  title = 'Parental Control',
  description = 'Enter your PIN to access this content',
}: PinDialogProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const { verifyParentalPin } = useSettingsStore();

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setAttempts(0);
    }
  }, [isOpen]);

  // Handle PIN verification
  const handleVerify = () => {
    if (!pin.trim()) {
      setError('Please enter a PIN');
      return;
    }

    if (verifyParentalPin(pin)) {
      onSuccess();
      onClose();
    } else {
      setAttempts(attempts + 1);
      setError(`Incorrect PIN. ${3 - attempts} attempts remaining.`);
      setPin('');

      // Lock after 3 failed attempts
      if (attempts >= 2) {
        setError('Too many failed attempts. Try again later.');
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={handleKeyPress}
              maxLength={6}
              className="text-center text-lg tracking-widest"
              autoFocus
            />

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleVerify}>Verify</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}