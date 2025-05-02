import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WatchHistoryItem, FavoriteItem } from '../types';

interface UserDataStore {
  watchHistory: WatchHistoryItem[];
  favorites: FavoriteItem[];
  
  addToWatchHistory: (item: WatchHistoryItem) => void;
  updateWatchProgress: (id: string, type: 'movie' | 'series', progress: number) => void;
  removeFromWatchHistory: (id: string, type: 'movie' | 'series' | 'live') => void;
  clearWatchHistory: () => void;
  
  addToFavorites: (item: FavoriteItem) => void;
  removeFromFavorites: (id: string, type: 'movie' | 'series' | 'live') => void;
  isFavorite: (id: string, type: 'movie' | 'series' | 'live') => boolean;
}

export const useUserDataStore = create<UserDataStore>()(
  persist(
    (set, get) => ({
      watchHistory: [],
      favorites: [],
      
      addToWatchHistory: (item) => {
        set((state) => {
          // Remove existing item with same id and type if exists
          const filteredHistory = state.watchHistory.filter(
            (historyItem) => !(historyItem.id === item.id && historyItem.type === item.type)
          );
          
          // Add new item at the beginning
          return {
            watchHistory: [item, ...filteredHistory].slice(0, 100), // Limit to 100 items
          };
        });
      },
      
      updateWatchProgress: (id, type, progress) => {
        set((state) => {
          const updatedHistory = state.watchHistory.map((item) => {
            if (item.id === id && item.type === type) {
              return { ...item, progress, lastWatched: Date.now() };
            }
            return item;
          });
          
          return { watchHistory: updatedHistory };
        });
      },
      
      removeFromWatchHistory: (id, type) => {
        set((state) => ({
          watchHistory: state.watchHistory.filter(
            (item) => !(item.id === id && item.type === type)
          ),
        }));
      },
      
      clearWatchHistory: () => {
        set({ watchHistory: [] });
      },
      
      addToFavorites: (item) => {
        set((state) => {
          // Check if already in favorites
          const exists = state.favorites.some(
            (fav) => fav.id === item.id && fav.type === item.type
          );
          
          if (exists) return state;
          
          return {
            favorites: [...state.favorites, item],
          };
        });
      },
      
      removeFromFavorites: (id, type) => {
        set((state) => ({
          favorites: state.favorites.filter(
            (item) => !(item.id === id && item.type === type)
          ),
        }));
      },
      
      isFavorite: (id, type) => {
        return get().favorites.some((item) => item.id === id && item.type === type);
      },
    }),
    {
      name: 'user-data-storage',
    }
  )
);