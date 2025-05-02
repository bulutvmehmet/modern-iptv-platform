import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { EPGData, EPGProgram, XtreamCredentials } from '@/lib/types';

// Parse XMLTV format EPG data
export const parseXMLTV = (xmlData: string): EPGData => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '_',
  });
  
  const result = parser.parse(xmlData);
  const epgData: EPGData = {};
  
  if (!result.tv || !result.tv.programme) {
    return epgData;
  }
  
  const programmes = Array.isArray(result.tv.programme) 
    ? result.tv.programme 
    : [result.tv.programme];
  
  programmes.forEach((programme: any) => {
    const channelId = programme._channel;
    
    if (!epgData[channelId]) {
      epgData[channelId] = [];
    }
    
    const epgProgram: EPGProgram = {
      id: `${channelId}-${programme._start}`,
      start: programme._start,
      end: programme._stop,
      title: programme.title,
      description: programme.desc || '',
      category: programme.category || '',
    };
    
    epgData[channelId].push(epgProgram);
  });
  
  // Sort programs by start time
  Object.keys(epgData).forEach(channelId => {
    epgData[channelId].sort((a, b) => {
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
  });
  
  return epgData;
};

// Fetch EPG data from Xtream Codes API
export const fetchEPG = async (
  credentials: XtreamCredentials,
  epgUrl?: string
): Promise<EPGData> => {
  try {
    // If a custom EPG URL is provided, use it
    if (epgUrl) {
      const response = await axios.get(epgUrl);
      return parseXMLTV(response.data);
    }
    
    // Otherwise try to get EPG from Xtream Codes API
    const { server, username, password } = credentials;
    const url = `${server}/xmltv.php?username=${username}&password=${password}`;
    
    const response = await axios.get(url, {
      responseType: 'text',
      timeout: 30000, // EPG data can be large, so use a longer timeout
    });
    
    return parseXMLTV(response.data);
  } catch (error) {
    console.error('Error fetching EPG data:', error);
    return {};
  }
};

// Get current and next program for a specific channel
export const getCurrentAndNextProgram = (
  epgData: EPGData,
  channelId: string
): { current: EPGProgram | null; next: EPGProgram | null } => {
  const channelPrograms = epgData[channelId];
  
  if (!channelPrograms || channelPrograms.length === 0) {
    return { current: null, next: null };
  }
  
  const now = new Date().getTime();
  let currentProgram: EPGProgram | null = null;
  let nextProgram: EPGProgram | null = null;
  
  // Find current program
  for (const program of channelPrograms) {
    const startTime = new Date(program.start).getTime();
    const endTime = new Date(program.end).getTime();
    
    if (startTime <= now && now < endTime) {
      currentProgram = program;
      break;
    }
  }
  
  // Find next program
  if (currentProgram) {
    const currentIndex = channelPrograms.findIndex(p => p.id === currentProgram?.id);
    if (currentIndex !== -1 && currentIndex < channelPrograms.length - 1) {
      nextProgram = channelPrograms[currentIndex + 1];
    }
  } else {
    // If no current program, find the next upcoming one
    for (const program of channelPrograms) {
      const startTime = new Date(program.start).getTime();
      
      if (startTime > now) {
        nextProgram = program;
        break;
      }
    }
  }
  
  return { current: currentProgram, next: nextProgram };
};

// Get programs for a specific channel and date
export const getChannelProgramsForDate = (
  epgData: EPGData,
  channelId: string,
  date: Date
): EPGProgram[] => {
  const channelPrograms = epgData[channelId];
  
  if (!channelPrograms || channelPrograms.length === 0) {
    return [];
  }
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const startTime = startOfDay.getTime();
  const endTime = endOfDay.getTime();
  
  return channelPrograms.filter(program => {
    const programStart = new Date(program.start).getTime();
    return programStart >= startTime && programStart <= endTime;
  });
};