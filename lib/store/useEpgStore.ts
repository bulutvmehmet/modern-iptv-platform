import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EPGData, EPGProgram, XtreamCredentials } from '@/lib/types';
import { fetchEPG, getCurrentAndNextProgram, getChannelProgramsForDate } from '@/lib/services/epgService';

interface EPGState {
  epgData: EPGData;
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchEPGData: (credentials: XtreamCredentials, customUrl?: string) => Promise<void>;
  getCurrentProgram: (channelId: string) => EPGProgram | null;
  getNextProgram: (channelId: string) => EPGProgram | null;
  getProgramsForChannel: (channelId: string, date?: Date) => EPGProgram[];
  clearEPGData: () => void;
}

export const useEpgStore = create<EPGState>()(
  persist(
    (set, get) => ({
      epgData: {},
      lastUpdated: null,
      isLoading: false,
      error: null,
      
      fetchEPGData: async (credentials, customUrl) => {
        set({ isLoading: true, error: null });
        
        try {
          const epgData = await fetchEPG(credentials, customUrl);
          
          set({
            epgData,
            lastUpdated: new Date().toISOString(),
            isLoading: false
          });
        } catch (error) {
          set({
            error: 'EPG verisi alınamadı',
            isLoading: false
          });
        }
      },
      
      getCurrentProgram: (channelId) => {
        const { epgData } = get();
        const { current } = getCurrentAndNextProgram(epgData, channelId);
        return current;
      },
      
      getNextProgram: (channelId) => {
        const { epgData } = get();
        const { next } = getCurrentAndNextProgram(epgData, channelId);
        return next;
      },
      
      getProgramsForChannel: (channelId, date = new Date()) => {
        const { epgData } = get();
        return getChannelProgramsForDate(epgData, channelId, date);
      },
      
      clearEPGData: () => {
        set({
          epgData: {},
          lastUpdated: null,
          error: null
        });
      }
    }),
    {
      name: 'epg-storage',
      partialize: (state) => ({
        epgData: state.epgData,
        lastUpdated: state.lastUpdated
      })
    }
  )
);