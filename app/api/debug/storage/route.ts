import { NextRequest, NextResponse } from 'next/server';
import { fetchPodcastsFromSupabase, syncPodcastsWithSupabase } from '@/lib/supabase/storage';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/debug/storage
 * Debug endpoint to check Supabase storage
 */
export async function GET(request: NextRequest) {
  try {
    // Get Supabase client
    const supabase = await createClient();
    
    // List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      return NextResponse.json(
        { error: 'Failed to list buckets', details: bucketsError },
        { status: 500 }
      );
    }
    
    // Get info for each bucket
    const bucketDetails = await Promise.all(
      buckets.map(async (bucket) => {
        try {
          // List files in bucket
          const { data: files, error: filesError } = await supabase.storage
            .from(bucket.name)
            .list();
            
          return {
            name: bucket.name,
            id: bucket.id,
            files: filesError ? null : files,
            error: filesError
          };
        } catch (err) {
          return {
            name: bucket.name,
            id: bucket.id,
            files: null,
            error: err
          };
        }
      })
    );
    
    // Try to fetch podcasts
    const podcasts = await fetchPodcastsFromSupabase();
    
    return NextResponse.json({
      buckets: bucketDetails,
      podcastsFromSupabase: podcasts
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error },
      { status: 500 }
    );
  }
}

/**
 * POST /api/debug/storage
 * Sync podcasts with Supabase and return debug info
 */
export async function POST(request: NextRequest) {
  try {
    // Sync podcasts with Supabase
    const syncResult = await syncPodcastsWithSupabase();
    
    // Try to fetch podcasts after sync
    const podcasts = await fetchPodcastsFromSupabase();
    
    return NextResponse.json({
      syncResult,
      podcastsAfterSync: podcasts
    });
  } catch (error) {
    console.error('Error syncing podcasts:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error },
      { status: 500 }
    );
  }
}
