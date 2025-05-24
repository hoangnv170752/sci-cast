import { type NextRequest, NextResponse } from "next/server"
import { generateSpeech } from "@/lib/elevenlabs"

export async function POST(request: NextRequest) {
  try {
    const { script, voiceId } = await request.json()

    if (!script || !voiceId) {
      return NextResponse.json({ error: "Script and voice ID are required" }, { status: 400 })
    }

    // Generate audio using ElevenLabs
    const audioBuffer = await generateSpeech(script, voiceId)

    // Convert ArrayBuffer to Buffer for Node.js
    const buffer = Buffer.from(audioBuffer)

    // Return the audio file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
        "Content-Disposition": 'attachment; filename="podcast.mp3"',
      },
    })
  } catch (error) {
    console.error("Audio generation error:", error)
    return NextResponse.json({ error: "Failed to generate audio" }, { status: 500 })
  }
}
