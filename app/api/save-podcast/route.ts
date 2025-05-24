import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, hostName, category, script, voiceId, voiceName, audioUrl, description } = await request.json()

    if (!title || !script || !voiceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Insert podcast into database
    const { data, error } = await supabase
      .from("podcasts")
      .insert([
        {
          title,
          host_name: hostName || user.user_metadata?.full_name || "AI Generated",
          category: category || "Technology",
          script,
          voice_id: voiceId,
          voice_name: voiceName,
          user_id: user.id,
          audio_url: audioUrl,
          description,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to save podcast" }, { status: 500 })
    }

    return NextResponse.json({ podcast: data })
  } catch (error) {
    console.error("Save podcast error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
