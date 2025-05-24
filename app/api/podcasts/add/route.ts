import { NextRequest, NextResponse } from 'next/server';
import { addNewPodcast } from '@/lib/supabase/storage';
import fs from 'fs';
import { join } from 'path';
import os from 'os';

/**
 * POST /api/podcasts/add
 * Adds a new podcast with audio file upload
 * Expects multipart/form-data with:
 * - podcast: JSON string of podcast metadata
 * - audio: audio file
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const podcastData = formData.get('podcast');
    const audioFile = formData.get('audio') as File | null;
    
    if (!podcastData) {
      return NextResponse.json(
        { error: 'Missing podcast data' },
        { status: 400 }
      );
    }
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'Missing audio file' },
        { status: 400 }
      );
    }
    
    // Parse podcast data
    const podcast = JSON.parse(podcastData as string);
    
    // Save audio file temporarily
    const tempDir = os.tmpdir();
    const tempFilePath = join(tempDir, audioFile.name);
    
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    fs.writeFileSync(tempFilePath, buffer);
    
    // Add new podcast
    const result = await addNewPodcast(podcast, tempFilePath);
    
    // Clean up temp file
    fs.unlinkSync(tempFilePath);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to add new podcast', details: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully added new podcast',
      podcast: result.newPodcast,
      audioUrl: result.audioUrl
    });
  } catch (error) {
    console.error('Error adding new podcast:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
