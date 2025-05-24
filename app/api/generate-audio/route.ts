import { type NextRequest, NextResponse } from "next/server"
import { generateSpeech } from "@/lib/elevenlabs"
import * as path from 'path'
import { promises as fsPromises } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const { script, voiceId, title } = await request.json()

    if (!script || !voiceId) {
      return NextResponse.json({ error: "Script and voice ID are required" }, { status: 400 })
    }

    // Generate audio using ElevenLabs
    const audioBuffer = await generateSpeech(script, voiceId)

    // Convert ArrayBuffer to Buffer for Node.js
    const buffer = Buffer.from(audioBuffer)
    
    // Ensure the public/audio directory exists
    const audioDir = path.join(process.cwd(), 'public', 'audio')
    try {
      await fsPromises.access(audioDir)
    } catch {
      await fsPromises.mkdir(audioDir, { recursive: true })
    }
    
    // Generate a unique filename to avoid conflicts
    const timestamp = Date.now()
    const sanitizedTitle = (title || 'podcast').replace(/[^a-z0-9]/gi, '-').toLowerCase()
    const filename = `${timestamp}-${sanitizedTitle}.mp3`
    const filePath = path.join(audioDir, filename)
    
    // Save the file
    await fsPromises.writeFile(filePath, buffer)
    
    // Store public URL path
    const publicPath = `/audio/${filename}`

    // Return the audio file and its path
    return NextResponse.json({
      audioUrl: publicPath,
      duration: null, // Would need proper audio duration detection
      success: true
    })
  } catch (error) {
    console.error("Audio generation error:", error)
    return NextResponse.json({ error: "Failed to generate audio" }, { status: 500 })
  }
}
