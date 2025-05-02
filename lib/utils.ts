import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to locale string (e.g., "12 Mayis 2023")
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Format time to locale string (e.g., "14:30")
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format duration in minutes to hours and minutes (e.g., "2s 15dk")
export function formatDuration(minutes: number): string {
  if (!minutes) return '';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}dk`;
  }
  
  return `${hours}s${mins > 0 ? ` ${mins}dk` : ''}`;
}

// Format date to relative time (e.g., "2 gun once", "1 saat once")
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 30) {
    return formatDate(dateString);
  } else if (diffDays > 0) {
    return `${diffDays} gun once`;
  } else if (diffHours > 0) {
    return `${diffHours} saat once`;
  } else if (diffMins > 0) {
    return `${diffMins} dakika once`;
  } else {
    return 'Az once';
  }
}

// Get image URL with fallback
export function getImageUrl(path: string | null | undefined, type: 'poster' | 'backdrop' = 'poster'): string {
  if (!path) {
    return type === 'poster' 
      ? '/images/poster-placeholder.png' 
      : '/images/backdrop-placeholder.png';
  }
  
  // If it's already a full URL, return it
  if (path.startsWith('http')) {
    return path;
  }
  
  // If it's a TMDB path, add the base URL
  if (path.startsWith('/')) {
    const baseUrl = 'https://image.tmdb.org/t/p';
    const size = type === 'poster' ? 'w500' : 'w1280';
    return `${baseUrl}/${size}${path}`;
  }
  
  // Default fallback
  return type === 'poster' 
    ? '/images/poster-placeholder.png' 
    : '/images/backdrop-placeholder.png';
}
