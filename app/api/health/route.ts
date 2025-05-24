import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const checks = {
      supabase: false,
      elevenlabs: false,
      cerebras: false,
      timestamp: new Date().toISOString(),
    }

    // Check Supabase connection
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.from("podcasts").select("count").limit(1)
      checks.supabase = !error
    } catch (error) {
      console.error("Supabase health check failed:", error)
    }

    // Check ElevenLabs API
    try {
      if (process.env.ELEVENLABS_API_KEY) {
        const response = await fetch("https://api.elevenlabs.io/v1/voices", {
          headers: {
            "xi-api-key": process.env.ELEVENLABS_API_KEY,
          },
        })
        checks.elevenlabs = response.ok
      }
    } catch (error) {
      console.error("ElevenLabs health check failed:", error)
    }

    // Check Cerebras API
    try {
      if (process.env.CEREBRAS_API_KEY) {
        // Simple API key validation (doesn't make actual request)
        checks.cerebras = process.env.CEREBRAS_API_KEY.startsWith("csk-")
      }
    } catch (error) {
      console.error("Cerebras health check failed:", error)
    }

    const allHealthy = checks.supabase && checks.elevenlabs && checks.cerebras

    return NextResponse.json(
      {
        status: allHealthy ? "healthy" : "degraded",
        checks,
      },
      { status: allHealthy ? 200 : 503 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
