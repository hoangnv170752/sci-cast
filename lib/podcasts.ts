// Store podcasts in local storage for the demo
// In a real application, this would use a database

export interface Podcast {
  id: number;
  title: string;
  host: string;
  listens: string;
  duration: string;
  category: string;
  audioUrl: string;
  description: string;
  featured: boolean;
  script?: string;
  voice_id?: string;
  voice_name?: string;
  created_at?: string;
  user_id?: string;
}

const STORAGE_KEY = 'sci-cast-podcasts';

// Use constants for paths without requiring fs/path at the module level
const JSON_FILE_PATH = './public/data/podcasts.json';
const AUDIO_DIR_PATH = './public/audio';

// Default podcast that's always available
const defaultPodcast: Podcast = {
  id: 1,
  title: "TDSM: Triplet Diffusion for Skeleton-Text Matching in Zero-Shot Action Recognition",
  host: "Dr. Alex Chen",
  listens: "3,247,891",
  duration: "2:32",
  category: "AI & Machine Learning",
  audioUrl: "/audio/TDSM.mp3",
  description: "Deep dive into cutting-edge research on skeleton-based action recognition using triplet diffusion models.",
  featured: true,
};

/**
 * Scan the audio directory for MP3 files that aren't already in the podcast list
 */
function scanAudioDirectory(existingPodcasts: Podcast[]): Podcast[] {
  // Only run on server
  if (typeof window !== 'undefined') {
    return [];
  }
  
  // Import fs dynamically on server-side only
  let fs;
  let path;
  try {
    fs = require('fs');
    path = require('path');
  } catch (error) {
    console.error('Failed to import fs/path modules:', error);
    return [];
  }
  
  try {
    // Get all MP3 files in the audio directory
    const audioFiles = fs.readdirSync(AUDIO_DIR_PATH)
      .filter((file: string) => file.endsWith('.mp3'));
    
    // Find MP3 files that aren't already in our podcast list
    const existingAudioFiles = existingPodcasts.map(p => {
      const url = p.audioUrl;
      return url ? url.split('/').pop() : '';
    });
    
    const newAudioFiles = audioFiles.filter((file: string) => !existingAudioFiles.includes(file));
    
    // Create basic podcast entries for new files
    return newAudioFiles.map((file: string, index: number) => {
      const filename = file.replace('.mp3', '');
      const title = filename.split('-').map((word: string) => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      const maxId = existingPodcasts.reduce((max, p) => Math.max(max, p.id), 1);
      const id = maxId + index + 1;
      
      return {
        id,
        title: title,
        host: 'Unknown Host',
        listens: '0',
        duration: '0:00',
        category: 'Uncategorized',
        audioUrl: `/audio/${file}`,
        description: `Auto-generated podcast from ${filename}`,
        featured: false
      };
    });
  } catch (error) {
    console.error('Error scanning audio directory:', error);
    return [];
  }
}

/**
 * Read podcasts from JSON file
 */
function readPodcastsFromFile(): Podcast[] {
  // Client-side: use localStorage
  if (typeof window !== 'undefined') {
    // Client-side: use localStorage
    try {
      const savedPodcasts = localStorage.getItem(STORAGE_KEY);
      if (savedPodcasts) {
        return JSON.parse(savedPodcasts) as Podcast[];
      }
    } catch (error) {
      console.error('Error loading podcasts from local storage:', error);
    }
    return [];
  }
  
  // Server-side: read from file
  try {
    // Import fs dynamically on server-side only
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'public/data/podcasts.json');
    
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent) as Podcast[];
    }
  } catch (error) {
    console.error('Error reading podcasts from file:', error);
  }
  
  return [];
}

/**
 * Write podcasts to JSON file
 */
function writePodcastsToFile(podcasts: Podcast[]): void {
  // Client-side: use localStorage
  if (typeof window !== 'undefined') {
    // Client-side: use localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(podcasts));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
    return;
  }
  
  // Server-side: write to file
  try {
    // Import fs dynamically on server-side only
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'public/data/podcasts.json');
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(podcasts, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing podcasts to file:', error);
  }
}

// Get all podcasts (including saved ones)
export function getAllPodcasts(): Podcast[] {
  // Start with the default podcast
  const podcasts = [defaultPodcast];
  
  // Add podcasts from file
  const savedPodcasts = readPodcastsFromFile();
  podcasts.push(...savedPodcasts);
  
  // Scan for new audio files (server-side only)
  if (typeof window === 'undefined') {
    const newPodcasts = scanAudioDirectory(podcasts);
    podcasts.push(...newPodcasts);
    
    // If we found new podcasts, save them to the file
    if (newPodcasts.length > 0) {
      writePodcastsToFile(savedPodcasts.concat(newPodcasts));
    }
  }
  
  return podcasts;
}

// Save a new podcast
export function savePodcast(podcast: Omit<Podcast, 'id'>): Podcast {
  try {
    const podcasts = getSavedPodcasts();
    
    // Generate new ID (max id + 1)
    const maxId = podcasts.reduce((max, p) => Math.max(max, p.id), 1);
    const newPodcast = { ...podcast, id: maxId + 1 };
    
    // Add to saved podcasts
    podcasts.push(newPodcast);
    
    // Save to file
    writePodcastsToFile(podcasts);
    
    return newPodcast;
  } catch (error) {
    console.error('Error saving podcast:', error);
    throw new Error('Failed to save podcast');
  }
}

// Get only saved podcasts (excluding default)
export function getSavedPodcasts(): Podcast[] {
  return readPodcastsFromFile();
}

// Calculate audio duration from URL (simplified)
export function calculateAudioDuration(audioUrl: string): string {
  const minutes = Math.floor(Math.random() * 4) + 1;
  const seconds = Math.floor(Math.random() * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
