import { NextRequest, NextResponse } from 'next/server';
import { syncPodcastsWithSupabase } from '@/lib/supabase/storage';

/**
 * POST /api/podcasts/sync
 * Syncs all podcast data with Supabase storage
 */
export async function POST(request: NextRequest) {
  try {
    const result = await syncPodcastsWithSupabase();
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to sync podcasts with Supabase' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully synced podcasts with Supabase',
      details: result
    });
  } catch (error) {
    console.error('Error syncing podcasts:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
