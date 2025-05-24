import { type NextRequest, NextResponse } from "next/server"
import { extractTextFromFile } from "@/lib/text-extraction"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 })
    }

    // Extract text from the file
    const extractedText = await extractTextFromFile(file)

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ error: "No text could be extracted from the file" }, { status: 400 })
    }

    return NextResponse.json({
      text: extractedText.trim(),
      filename: file.name,
      size: file.size,
    })
  } catch (error) {
    console.error("Text extraction error:", error)
    return NextResponse.json({ error: "Failed to extract text from file" }, { status: 500 })
  }
}
