import { type NextRequest, NextResponse } from "next/server"
import { generatePodcastScript } from "@/lib/gwen"

export async function POST(request: NextRequest) {
  try {
    const { extractedText, podcastTitle, hostName, guestName, category } = await request.json()

    if (!extractedText) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 })
    }

    console.log(`Generating podcast script with title: ${podcastTitle}, host: ${hostName}, guest: ${guestName || 'none'}`);
    
    // Call our specialized podcast script generation function
    const script = await generatePodcastScript(
      extractedText,
      podcastTitle || `Research on ${category || 'Science'}`,
      hostName || "Sci-Cast Host",
      guestName
    )

    return NextResponse.json({ script })
  } catch (error) {
    console.error("Script generation error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to generate script";
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
