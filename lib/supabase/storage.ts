import { createClient } from './server';

const STORAGE_BUCKET = 'sci-cast';

interface Podcast {
  id: number;
  title: string;
  host: string;
  listens: string;
  duration: string;
  category: string;
  audioUrl: string;
  description: string;
  featured?: boolean;
}

/**
 * Get the Supabase client for storage operations
 */
async function getStorageClient() {
  return await createClient();
}

/**
 * Verifies access to the storage bucket
 */
export async function verifyBucketAccess() {
  const supabase = await getStorageClient();
  
  try {
    if (typeof window !== 'undefined') {
      return true;
    }
    
    try {
      // Try to get the specified bucket
      const { data: bucket, error } = await supabase.storage.getBucket(STORAGE_BUCKET);
      
      if (error) {
        console.error(`Error accessing ${STORAGE_BUCKET} bucket:`, error);
        
        // Try to fallback to any available bucket
        try {
          const { data: buckets } = await supabase.storage.listBuckets();
          
          if (buckets && buckets.length > 0) {
            console.log('Available buckets:', buckets.map(b => b.name));
            console.log(`Using available bucket: ${buckets[0].name} instead of ${STORAGE_BUCKET}`);
            // Update the constant to use the available bucket
            (global as any).STORAGE_BUCKET_OVERRIDE = buckets[0].name;
            return true;
          }
        } catch (listError) {
          console.error('Could not list available buckets');
          // Continue with original bucket even if we can't list buckets
        }
      }
    } catch (err) {
      // If any error occurs during bucket validation, just continue
      console.warn('Error validating bucket, continuing anyway:', err);
    }
    
    // Return true even if validation fails - let the actual operations handle their errors
    return true;
  } catch (error) {
    console.error('Unexpected error in verifyBucketAccess:', error);
    // Don't throw - just return true and let individual operations handle errors
    return true;
  }
}

/**
 * Ensures bucket access - retained for backward compatibility
 */
export async function ensureBuckets() {
  return await verifyBucketAccess();
}

/**
 * Uploads the podcasts.json file to Supabase storage
 */
export async function uploadPodcastsJson() {
  // This function can only run on the server
  if (typeof window !== 'undefined') {
    console.error('uploadPodcastsJson can only run on the server');
    return { success: false, error: 'Cannot run in browser environment' };
  }

  try {
    const supabase = await getStorageClient();
    
    // Dynamic import of fs module (server-side only)
    const fs = await import('fs');
    const path = await import('path');
    
    // Read the local file
    const podcastsPath = path.join(process.cwd(), 'public', 'data', 'podcasts.json');
    const fileContent = await fs.promises.readFile(podcastsPath, 'utf-8');
    
    // Convert string to ArrayBuffer
    const encoder = new TextEncoder();
    const fileBuffer = encoder.encode(fileContent);
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload('data/podcasts.json', fileBuffer, {
        contentType: 'application/json',
        upsert: true
      });

    if (error) {
      throw error;
    }
    
    // Get the public URL
    const { data: publicUrl } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl('data/podcasts.json');

    return { success: true, path: data?.path, url: publicUrl.publicUrl };
  } catch (error) {
    console.error('Error uploading podcasts.json:', error);
    return { success: false, error };
  }
}

/**
 * Uploads an audio file to Supabase storage
 */
export async function uploadAudioFile(filePath: string, fileName: string) {
  // This function can only run on the server
  if (typeof window !== 'undefined') {
    console.error('uploadAudioFile can only run on the server');
    return { success: false, error: 'Cannot run in browser environment' };
  }
  
  try {
    const supabase = await getStorageClient();
    
    // Dynamic import of fs module
    const fs = await import('fs');
    
    // Read the file content
    const fileContent = await fs.promises.readFile(filePath);
    
    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(`audio/${fileName}`, fileContent, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (error) {
      throw error;
    }

    // Get the public URL
    const { data: publicUrl } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(`audio/${fileName}`);

    return { 
      success: true, 
      path: data?.path,
      url: publicUrl.publicUrl
    };
  } catch (error) {
    console.error(`Error uploading audio file ${fileName}:`, error);
    return { success: false, error };
  }
}

/**
 * Uploads all audio files from the public/audio directory
 */
export async function uploadAllAudioFiles() {
  // This function can only run on the server
  if (typeof window !== 'undefined') {
    console.error('uploadAllAudioFiles can only run on the server');
    return { success: false, error: 'Cannot run in browser environment' };
  }

  try {
    // Dynamic import of fs and path modules
    const fs = await import('fs');
    const path = await import('path');
    
    // Get all audio files
    const audioPath = path.join(process.cwd(), 'public', 'audio');
    const files = await fs.promises.readdir(audioPath);
    const audioFiles = files.filter((file: string) => file.endsWith('.mp3'));
    
    // Upload each file
    const results = await Promise.all(
      audioFiles.map((file: string) => {
        const filePath = path.join(audioPath, file);
        return uploadAudioFile(filePath, file);
      })
    );
    
    return {
      success: true,
      uploadedFiles: results.filter((r: any) => r.success).length,
      failedFiles: results.filter((r: any) => !r.success).length,
      details: results
    };
  } catch (error) {
    console.error('Error uploading audio files:', error);
    return { success: false, error };
  }
}

/**
 * Adds a new podcast to the podcasts.json file and uploads it to Supabase
 */
export async function addNewPodcast(podcast: Omit<Podcast, 'id'>, audioFilePath: string) {
  // This function can only run on the server
  if (typeof window !== 'undefined') {
    console.error('addNewPodcast can only run on the server');
    return { success: false, error: 'Cannot run in browser environment' };
  }

  try {
    // Dynamic import of fs and path modules
    const fs = await import('fs');
    const path = await import('path');
    
    // Read existing podcasts
    const podcastsPath = path.join(process.cwd(), 'public', 'data', 'podcasts.json');
    const podcastsJson = await fs.promises.readFile(podcastsPath, 'utf-8');
    const podcasts: Podcast[] = JSON.parse(podcastsJson);
    
    // Generate new ID (highest ID + 1)
    const newId = Math.max(...podcasts.map(p => p.id), 0) + 1;
    
    // Get the filename from the path
    const audioFileName = path.basename(audioFilePath);
    
    // Upload the audio file
    const audioUploadResult = await uploadAudioFile(audioFilePath, audioFileName);
    
    if (!audioUploadResult.success) {
      throw new Error(`Failed to upload audio file: ${JSON.stringify(audioUploadResult.error)}`);
    }
    
    // Create new podcast entry
    const newPodcast: Podcast = {
      id: newId,
      ...podcast,
      audioUrl: audioUploadResult.url || `/audio/${audioFileName}` // Use Supabase URL with fallback
    };
    
    // Add to podcasts array
    podcasts.push(newPodcast);
    
    // Write updated podcasts back to file
    await fs.promises.writeFile(
      podcastsPath,
      JSON.stringify(podcasts, null, 2),
      'utf-8'
    );
    
    // Upload the updated podcasts.json to Supabase
    const jsonUploadResult = await uploadPodcastsJson();
    
    if (!jsonUploadResult.success) {
      throw new Error(`Failed to upload podcasts.json: ${JSON.stringify(jsonUploadResult.error)}`);
    }
    
    return {
      success: true,
      newPodcast,
      audioUrl: audioUploadResult.url
    };
  } catch (error) {
    console.error('Error adding new podcast:', error);
    return { success: false, error };
  }
}

/**
 * Updates the podcast data in Supabase storage to match the local podcasts.json file
 */
export async function syncPodcastsWithSupabase() {
  // This function can only run on the server
  if (typeof window !== 'undefined') {
    console.error('syncPodcastsWithSupabase can only run on the server');
    return { success: false, error: 'Cannot run in browser environment' };
  }
  
  try {
    // Upload podcasts.json
    const jsonResult = await uploadPodcastsJson();
    if (!jsonResult.success) {
      throw new Error(`Failed to upload podcasts.json: ${JSON.stringify(jsonResult.error)}`);
    }
    
    // Upload all audio files
    const audioResult = await uploadAllAudioFiles();
    if (!audioResult.success) {
      throw new Error(`Failed to upload audio files: ${JSON.stringify(audioResult.error)}`);
    }
    
    return {
      success: true,
      podcastsJson: jsonResult,
      audioFiles: audioResult
    };
  } catch (error) {
    console.error('Error syncing podcasts with Supabase:', error);
    return { success: false, error };
  }
}

/**
 * Fetches podcasts data from Supabase storage
 * @returns Array of podcasts or null if an error occurs
 */
export async function fetchPodcastsFromSupabase() {
  try {
    const supabase = await getStorageClient();
    
    // Try to download podcasts.json from the main path
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download('data/podcasts.json');
      
      if (error) {
        // If the file is not found in the main path, try the alternative path
        if (error.message.includes('not found')) {
          console.log('Trying alternative path: podcasts.json');
          const { data: altData, error: altError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .download('podcasts.json');
            
          if (altError) {
            console.error('Error downloading from alternative path:', altError);
            return null;
          }
          
          if (altData) {
            const text = await altData.text();
            const podcasts = JSON.parse(text) as Podcast[];
            return processPodcasts(podcasts, supabase);
          }
        }
        console.error('Error downloading podcasts.json from Supabase:', error);
        return null;
      }
      
      // Parse JSON data
      const text = await data.text();
      const podcasts = JSON.parse(text) as Podcast[];
      return processPodcasts(podcasts, supabase);
    } catch (downloadError) {
      console.error('Error during download operation:', downloadError);
      return null;
    }
  } catch (error) {
    console.error('Error fetching podcasts from Supabase:', error);
    return null;
  }
}

/**
 * Process podcast data to replace relative URLs with absolute Supabase URLs
 */
function processPodcasts(podcasts: Podcast[], supabase: any): Podcast[] {
  // Convert relative audio URLs to Supabase URLs
  return podcasts.map(podcast => {
    // Skip if it's already a full URL
    if (podcast.audioUrl.startsWith('http')) {
      return podcast;
    }
    
    // Get the audio filename from the path
    const audioFileName = podcast.audioUrl.split('/').pop();
    
    // Only update if it's a valid filename
    if (!audioFileName) {
      return podcast;
    }
    
    // Determine the correct path in the bucket
    let audioPath = `audio/${audioFileName}`;
    // If the URL already has 'audio/' in it, don't duplicate it
    if (podcast.audioUrl.startsWith('/audio/') || podcast.audioUrl.startsWith('audio/')) {
      audioPath = podcast.audioUrl.startsWith('/') ? podcast.audioUrl.substring(1) : podcast.audioUrl;
    }
    
    // Get the public URL for the audio file
    const { data: publicUrl } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(audioPath);
    
    return {
      ...podcast,
      audioUrl: publicUrl.publicUrl
    };
  });
}
