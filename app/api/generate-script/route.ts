import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { cerebras } from "@/lib/cerebras"

export async function POST(request: NextRequest) {
  try {
    const { extractedText, podcastTitle, hostName, category } = await request.json()

    if (!extractedText) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 })
    }

    const prompt = `You are an expert science communicator creating an engaging podcast script. Transform the following research content into a compelling 4-5 minute podcast episode.

Guidelines:
- Start with a warm welcome to "Sci-Cast"
- Make complex concepts accessible to a general audience
- Use storytelling techniques and analogies
- Explain the significance and real-world applications
- Keep the tone conversational and enthusiastic
- End with a call to action for listeners
- Target length: 800-1200 words (about 4-5 minutes when spoken)
- Host name: ${hostName || "the host"}
- Category: ${category || "Technology"}
- Episode title: ${podcastTitle || "Research Insights"}

Research Content:
${extractedText}

Create an engaging podcast script that makes this research accessible and exciting for listeners:`

    const { text } = await generateText({
      model: cerebras("llama3.1-8b"),
      prompt,
      maxTokens: 2000,
      temperature: 0.7,
    })

    return NextResponse.json({ script: text })
  } catch (error) {
    console.error("Script generation error:", error)
    return NextResponse.json({ error: "Failed to generate script" }, { status: 500 })
  }
}
