'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useUserDataStore } from '@/lib/store/useUserDataStore';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Clock, Star, History, User } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { userInfo, logout } = useAuthStore();
  const { watchHistory, favorites } = useUserDataStore();

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Calculate days remaining
  const calculateDaysRemaining = (expDate: string) => {
    if (!expDate) return 0;
    const today = new Date();
    const expiryDate = new Date(expDate);
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/auth/login');
  };

  // Get watch statistics
  const getWatchStats = () => {
    const liveCount = watchHistory.filter(item => item.type === 'live').length;
    const movieCount = watchHistory.filter(item => item.type === 'movie').length;
    const seriesCount = watchHistory.filter(item => item.type === 'series').length;
    
    return { liveCount, movieCount, seriesCount, total: watchHistory.length };
  };

  const stats = getWatchStats();
  const daysRemaining = userInfo ? calculateDaysRemaining(userInfo.exp_date) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" alt="User" />
              <AvatarFallback className="text-xl">
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{userInfo?.username || 'User'}</CardTitle>
              <CardDescription>Account Information</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {userInfo ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">
                      {userInfo.status === 'Active' ? (
                        <span className="text-green-500">Active</span>
                      ) : (
                        <span className="text-red-500">Inactive</span>
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Subscription Expires</p>
                    <p className="font-medium">{formatDate(userInfo.exp_date)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Days Remaining</p>
                    <p className="font-medium">
                      {daysRemaining > 0 ? (
                        <span>{daysRemaining} days</span>
                      ) : (
                        <span className="text-red-500">Expired</span>
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Active Connections</p>
                    <p className="font-medium">
                      {userInfo.active_cons} / {userInfo.max_connections}
                    </p>
                  </div>
                </div>
                
                {userInfo.allowed_output_formats && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Allowed Formats</p>
                    <p className="font-medium">{userInfo.allowed_output_formats.join(', ')}</p>
                  </div>
                )}
              </div>
            ) : (
              <p>Loading account information...</p>
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>Your viewing statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Watch History</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.total} items watched
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Favorites</p>
                  <p className="text-sm text-muted-foreground">
                    {favorites.length} items saved
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Viewing Breakdown</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{stats.liveCount} live channels</p>
                    <p>{stats.movieCount} movies</p>
                    <p>{stats.seriesCount} series episodes</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}