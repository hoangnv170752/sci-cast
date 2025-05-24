import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { script, targetLength, podcastTitle, hostName, guestName } = await request.json()

    if (!script) {
      return NextResponse.json({ error: "No script provided" }, { status: 400 })
    }

    // Check if script actually needs trimming
    if (script.length <= targetLength) {
      return NextResponse.json({ trimmedScript: script })
    }

    // Use OpenAI to trim the script
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o", // Best model for content understanding and summarization
        messages: [
          {
            role: "system",
            content: `You are an expert podcast editor who specializes in condensing scripts while preserving their key content and conversational flow. 
            Your goal is to shorten a podcast script to approximately ${targetLength} characters while:
            1. Preserving the overall structure and speaker turns
            2. Maintaining all key points and essential information
            3. Keeping the introduction and conclusion intact
            4. Removing redundant information and excessive details
            5. Preserving the conversational tone and flow
            6. Ensuring all speaker transitions remain clear (Host: and Guest/Researcher: labels)
            
            Return ONLY the edited script with no additional explanations or comments.`
          },
          {
            role: "user",
            content: `Condense this podcast script to approximately ${targetLength} characters while preserving its structure, key information, and conversational tone. 
            
            Keep the title, intro, and conclusion intact. Maintain all speaker labels exactly as they appear.
            
            Script to condense:
            ${script}`
          }
        ],
        temperature: 0.3,
        max_tokens: 4096,
        response_format: { type: "text" }
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    const trimmedScript = result.choices?.[0]?.message?.content

    if (!trimmedScript) {
      throw new Error("No content returned from trimming service")
    }

    return NextResponse.json({ 
      trimmedScript,
      originalLength: script.length,
      newLength: trimmedScript.length
    })
  } catch (error) {
    console.error("Script trimming error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to trim script"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
