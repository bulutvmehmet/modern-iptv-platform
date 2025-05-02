'use client';

import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/lib/store/useSettingsStore';
import { useUserDataStore } from '@/lib/store/useUserDataStore';
import { useQuery } from '@tanstack/react-query';
import { getLiveCategories, getVodCategories, getSeriesCategories } from '@/lib/services/xtreamService';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Moon, Sun, Monitor, Trash2, ShieldAlert, Check, X } from 'lucide-react';

export default function SettingsPage() {
  const {
    theme,
    setTheme,
    language,
    setLanguage,
    parentalControlEnabled,
    toggleParentalControl,
    parentalControlPin,
    setParentalControlPin,
    parentalControlRating,
    setParentalControlRating,
    parentalControlCategories,
    addRestrictedCategory,
    removeRestrictedCategory,
    autoPlayNextEpisode,
    toggleAutoPlayNextEpisode,
    defaultSubtitleLanguage,
    setDefaultSubtitleLanguage,
    bufferSize,
    setBufferSize,
  } = useSettingsStore();

  const { credentials } = useAuthStore();
  const { clearWatchHistory } = useUserDataStore();
  const [pin, setPin] = useState(parentalControlPin || '');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [selectedRating, setSelectedRating] = useState(parentalControlRating || 'PG-13');
  
  // Fetch categories for parental control
  const { data: liveCategories } = useQuery({
    queryKey: ['liveCategories'],
    queryFn: () => (credentials ? getLiveCategories(credentials) : Promise.resolve([])),
    enabled: !!credentials,
  });
  
  const { data: vodCategories } = useQuery({
    queryKey: ['vodCategories'],
    queryFn: () => (credentials ? getVodCategories(credentials) : Promise.resolve([])),
    enabled: !!credentials,
  });
  
  const { data: seriesCategories } = useQuery({
    queryKey: ['seriesCategories'],
    queryFn: () => (credentials ? getSeriesCategories(credentials) : Promise.resolve([])),
    enabled: !!credentials,
  });
  
  // Update rating when changed
  useEffect(() => {
    if (parentalControlRating) {
      setSelectedRating(parentalControlRating);
    }
  }, [parentalControlRating]);

  // Handle parental control toggle
  const handleParentalControlToggle = (checked: boolean) => {
    if (checked && !parentalControlPin) {
      // If enabling without a PIN, show error
      setPinError('Please set a PIN first');
      return;
    }
    
    toggleParentalControl(checked);
    toast.success(`Parental control ${checked ? 'enabled' : 'disabled'}`);
  };

  // Handle PIN save
  const handleSavePin = () => {
    if (pin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    
    if (pin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    
    setParentalControlPin(pin);
    setPinError('');
    toast.success('PIN saved successfully');
  };

  // Handle clear watch history
  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your watch history?')) {
      clearWatchHistory();
      toast.success('Watch history cleared');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="playback">Playback</TabsTrigger>
          <TabsTrigger value="parental">Parental Control</TabsTrigger>
          <TabsTrigger value="data">Data & Privacy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="appearance" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the application looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex gap-4">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    className="flex-1 gap-2"
                    onClick={() => setTheme('light')}
                  >
                    <Sun className="h-4 w-4" />
                    <span>Light</span>
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    className="flex-1 gap-2"
                    onClick={() => setTheme('dark')}
                  >
                    <Moon className="h-4 w-4" />
                    <span>Dark</span>
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    className="flex-1 gap-2"
                    onClick={() => setTheme('system')}
                  >
                    <Monitor className="h-4 w-4" />
                    <span>System</span>
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={language}
                  onValueChange={(value) => {
                    setLanguage(value);
                    toast.success(`Language changed to ${value.toUpperCase()}`);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="tr">Turkish</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="playback" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Playback Settings</CardTitle>
              <CardDescription>
                Customize video playback behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-play">Auto-play next episode</Label>
                <Switch
                  id="auto-play"
                  checked={autoPlayNextEpisode}
                  onCheckedChange={(checked) => {
                    toggleAutoPlayNextEpisode(checked);
                    toast.success(`Auto-play ${checked ? 'enabled' : 'disabled'}`);
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Default subtitle language</Label>
                <Select
                  value={defaultSubtitleLanguage || ''}
                  onValueChange={(value) => {
                    setDefaultSubtitleLanguage(value === 'none' ? undefined : value);
                    toast.success(`Default subtitle language set to ${value === 'none' ? 'None' : value.toUpperCase()}`);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="tr">Turkish</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Buffer size (seconds)</Label>
                <Select
                  value={bufferSize?.toString() || '30'}
                  onValueChange={(value) => {
                    setBufferSize(value === 'default' ? undefined : parseInt(value));
                    toast.success(`Buffer size set to ${value === 'default' ? 'Default' : value} seconds`);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select buffer size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default (30s)</SelectItem>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">60 seconds</SelectItem>
                    <SelectItem value="120">120 seconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="parental" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                <span>Parental Control</span>
              </CardTitle>
              <CardDescription>
                Restrict access to adult content and manage content filtering
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="parental-control" className="font-medium">Enable parental control</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Restrict access to mature content with PIN protection
                  </p>
                </div>
                <Switch
                  id="parental-control"
                  checked={parentalControlEnabled}
                  onCheckedChange={handleParentalControlToggle}
                />
              </div>
              
              <div className="space-y-3 border-t pt-4">
                <Label className="text-base">Security</Label>
                <div className="space-y-2">
                  <Label className="text-sm">Set PIN</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        type="password"
                        placeholder="Enter PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        maxLength={6}
                      />
                    </div>
                    <div>
                      <Input
                        type="password"
                        placeholder="Confirm PIN"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value)}
                        maxLength={6}
                      />
                    </div>
                  </div>
                  {pinError && (
                    <p className="text-sm text-red-500 mt-1">{pinError}</p>
                  )}
                  <Button
                    onClick={handleSavePin}
                    className="mt-2"
                  >
                    Save PIN
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3 border-t pt-4">
                <Label className="text-base">Content Filtering</Label>
                
                <div className="space-y-2">
                  <Label className="text-sm">Maximum Content Rating</Label>
                  <Select
                    value={selectedRating}
                    onValueChange={(value) => {
                      setSelectedRating(value);
                      setParentalControlRating(value);
                      toast.success(`Maximum content rating set to ${value}`);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select maximum rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="G">G (General Audiences)</SelectItem>
                      <SelectItem value="PG">PG (Parental Guidance Suggested)</SelectItem>
                      <SelectItem value="PG-13">PG-13 (Parents Strongly Cautioned)</SelectItem>
                      <SelectItem value="R">R (Restricted)</SelectItem>
                      <SelectItem value="NC-17">NC-17 (Adults Only)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Content with higher ratings than selected will require PIN verification
                  </p>
                </div>
                
                {liveCategories && liveCategories.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <Label className="text-sm">Restricted Live TV Categories</Label>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                      <div className="space-y-2">
                        {liveCategories.map((category) => {
                          const isRestricted = parentalControlCategories?.includes(category.category_id);
                          return (
                            <div key={category.category_id} className="flex items-center justify-between">
                              <span className="text-sm">{category.category_name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={isRestricted ? "text-red-500" : "text-green-500"}
                                onClick={() => {
                                  if (isRestricted) {
                                    removeRestrictedCategory(category.category_id);
                                    toast.success(`Unrestricted: ${category.category_name}`);
                                  } else {
                                    addRestrictedCategory(category.category_id);
                                    toast.success(`Restricted: ${category.category_name}`);
                                  }
                                }}
                              >
                                {isRestricted ? (
                                  <X className="h-4 w-4" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                
                {vodCategories && vodCategories.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <Label className="text-sm">Restricted Movie Categories</Label>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                      <div className="space-y-2">
                        {vodCategories.map((category) => {
                          const isRestricted = parentalControlCategories?.includes(category.category_id);
                          return (
                            <div key={category.category_id} className="flex items-center justify-between">
                              <span className="text-sm">{category.category_name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={isRestricted ? "text-red-500" : "text-green-500"}
                                onClick={() => {
                                  if (isRestricted) {
                                    removeRestrictedCategory(category.category_id);
                                    toast.success(`Unrestricted: ${category.category_name}`);
                                  } else {
                                    addRestrictedCategory(category.category_id);
                                    toast.success(`Restricted: ${category.category_name}`);
                                  }
                                }}
                              >
                                {isRestricted ? (
                                  <X className="h-4 w-4" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                
                {seriesCategories && seriesCategories.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <Label className="text-sm">Restricted Series Categories</Label>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                      <div className="space-y-2">
                        {seriesCategories.map((category) => {
                          const isRestricted = parentalControlCategories?.includes(category.category_id);
                          return (
                            <div key={category.category_id} className="flex items-center justify-between">
                              <span className="text-sm">{category.category_name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={isRestricted ? "text-red-500" : "text-green-500"}
                                onClick={() => {
                                  if (isRestricted) {
                                    removeRestrictedCategory(category.category_id);
                                    toast.success(`Unrestricted: ${category.category_name}`);
                                  } else {
                                    addRestrictedCategory(category.category_id);
                                    toast.success(`Restricted: ${category.category_name}`);
                                  }
                                }}
                              >
                                {isRestricted ? (
                                  <X className="h-4 w-4" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> Restricted categories will require PIN verification to access
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="data" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Data & Privacy</CardTitle>
              <CardDescription>
                Manage your data and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Watch History</Label>
                <p className="text-sm text-muted-foreground">
                  Clear your watch history from all devices
                </p>
                <Button
                  variant="destructive"
                  className="mt-2 gap-2"
                  onClick={handleClearHistory}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear Watch History</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}