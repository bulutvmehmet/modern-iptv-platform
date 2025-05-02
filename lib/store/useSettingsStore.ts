import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings } from '../types';

interface SettingsStore extends AppSettings {
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
  toggleParentalControl: (enabled: boolean) => void;
  setParentalControlPin: (pin: string) => void;
  setParentalControlRating: (rating: string | undefined) => void;
  setParentalControlCategories: (categories: string[] | undefined) => void;
  addRestrictedCategory: (categoryId: string) => void;
  removeRestrictedCategory: (categoryId: string) => void;
  toggleAutoPlayNextEpisode: (enabled: boolean) => void;
  setDefaultSubtitleLanguage: (language: string | undefined) => void;
  setBufferSize: (size: number | undefined) => void;
  verifyParentalPin: (pin: string) => boolean;
  isContentRestricted: (categoryId: string, rating?: string) => boolean;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      language: 'en',
      parentalControlEnabled: false,
      parentalControlPin: undefined,
      parentalControlRating: undefined,
      parentalControlCategories: [],
      autoPlayNextEpisode: true,
      defaultSubtitleLanguage: undefined,
      bufferSize: undefined,

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleParentalControl: (enabled) => set({ parentalControlEnabled: enabled }),
      setParentalControlPin: (pin) => set({ parentalControlPin: pin }),
      setParentalControlRating: (rating) => set({ parentalControlRating: rating }),
      setParentalControlCategories: (categories) => set({ parentalControlCategories: categories }),
      
      addRestrictedCategory: (categoryId) => {
        const currentCategories = get().parentalControlCategories || [];
        if (!currentCategories.includes(categoryId)) {
          set({ parentalControlCategories: [...currentCategories, categoryId] });
        }
      },
      
      removeRestrictedCategory: (categoryId) => {
        const currentCategories = get().parentalControlCategories || [];
        set({ 
          parentalControlCategories: currentCategories.filter(id => id !== categoryId) 
        });
      },
      
      toggleAutoPlayNextEpisode: (enabled) => set({ autoPlayNextEpisode: enabled }),
      setDefaultSubtitleLanguage: (language) => set({ defaultSubtitleLanguage: language }),
      setBufferSize: (size) => set({ bufferSize: size }),
      
      verifyParentalPin: (pin) => {
        const storedPin = get().parentalControlPin;
        return storedPin === pin;
      },
      
      isContentRestricted: (categoryId, rating) => {
        const { 
          parentalControlEnabled, 
          parentalControlCategories, 
          parentalControlRating 
        } = get();
        
        if (!parentalControlEnabled) {
          return false;
        }
        
        // Check if category is restricted
        if (parentalControlCategories && parentalControlCategories.includes(categoryId)) {
          return true;
        }
        
        // Check if rating is restricted
        if (rating && parentalControlRating) {
          const movieRatingValues = {
            'G': 1,
            'PG': 2,
            'PG-13': 3,
            'R': 4,
            'NC-17': 5
          };
          
          const tvRatingValues = {
            'TV-Y': 1,
            'TV-Y7': 2,
            'TV-G': 3,
            'TV-PG': 4,
            'TV-14': 5,
            'TV-MA': 6
          };
          
          // Determine if it's a movie or TV rating
          if (rating.startsWith('TV-')) {
            const contentRating = tvRatingValues[rating as keyof typeof tvRatingValues] || 0;
            
            // Convert movie rating to TV rating scale if needed
            let maxAllowedRating = 6; // Default to highest (least restrictive)
            
            if (parentalControlRating.startsWith('TV-')) {
              maxAllowedRating = tvRatingValues[parentalControlRating as keyof typeof tvRatingValues] || 6;
            } else {
              // Convert movie rating to TV scale
              const movieRating = movieRatingValues[parentalControlRating as keyof typeof movieRatingValues] || 5;
              // Approximate conversion: G to TV-Y, PG to TV-PG, PG-13 to TV-14, R/NC-17 to TV-MA
              const conversionMap = [0, 1, 4, 5, 6, 6];
              maxAllowedRating = conversionMap[movieRating] || 6;
            }
            
            return contentRating > maxAllowedRating;
          } else {
            // Handle movie ratings
            const contentRating = movieRatingValues[rating as keyof typeof movieRatingValues] || 0;
            
            // Convert TV rating to movie rating scale if needed
            let maxAllowedRating = 5; // Default to highest (least restrictive)
            
            if (parentalControlRating.startsWith('TV-')) {
              // Convert TV rating to movie scale
              const tvRating = tvRatingValues[parentalControlRating as keyof typeof tvRatingValues] || 6;
              // Approximate conversion: TV-Y/TV-Y7 to G, TV-G to PG, TV-PG to PG, TV-14 to PG-13, TV-MA to R
              const conversionMap = [0, 1, 1, 2, 2, 3, 4];
              maxAllowedRating = conversionMap[tvRating] || 5;
            } else {
              maxAllowedRating = movieRatingValues[parentalControlRating as keyof typeof movieRatingValues] || 5;
            }
            
            return contentRating > maxAllowedRating;
          }
        }
        
        return false;
      }
    }),
    {
      name: 'settings-storage',
    }
  )
);