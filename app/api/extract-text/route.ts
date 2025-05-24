import { type NextRequest, NextResponse } from "next/server"
import { extractTextFromFile } from "@/lib/text-extraction"
import * as fs from 'fs'
import * as path from 'path'
import { promises as fsPromises } from 'fs'

export async function POST(request: NextRequest) {
  // Define these variables outside the try block so they're accessible in catch
  let file: File | null = null;
  let publicPath: string | null = null;
  
  try {
    const formData = await request.formData()
    file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 })
    }
    
    // Ensure the public/file directory exists
    const fileDir = path.join(process.cwd(), 'public', 'file')
    try {
      await fsPromises.access(fileDir)
    } catch {
      await fsPromises.mkdir(fileDir, { recursive: true })
    }
    
    // Generate a unique filename to avoid conflicts
    const timestamp = Date.now()
    const uniqueFilename = `${timestamp}-${file.name}`
    const filePath = path.join(fileDir, uniqueFilename)
    
    // Convert file to ArrayBuffer and save it
    const buffer = Buffer.from(await file.arrayBuffer())
    await fsPromises.writeFile(filePath, buffer)
    
    // Store public URL path
    publicPath = `/file/${uniqueFilename}`

    try {
      // Extract text from the file
      const extractedText = await extractTextFromFile(file)

      if (!extractedText || extractedText.trim().length === 0) {
        return NextResponse.json({ error: "No text could be extracted from the file" }, { status: 400 })
      }
      
      // Check if we got an error message (as string) instead of actual content
      if (extractedText.includes("Unable to extract content") || 
          extractedText.includes("No text could be extracted")) {
        return NextResponse.json({ 
          warning: extractedText,
          text: "The system was unable to properly extract content from this file. You may want to try a different file format or manually edit the extracted text below.",
          filename: file.name,
          size: file.size,
          filePath: publicPath
        })
      }

      return NextResponse.json({
        text: extractedText.trim(),
        filename: file.name,
        size: file.size,
        filePath: publicPath
      })
    }
  } catch (error) {
    console.error("Text extraction error:", error)
    
    // Return a more user-friendly error message and a 200 status (not 500)
    // This prevents the client from showing a generic error screen
    return NextResponse.json({
      warning: "Text extraction encountered difficulties",
      text: "The system was unable to properly extract content from this file. You can still proceed with the basic text that was extracted, or try uploading a different file.",
      error: error instanceof Error ? error.message : String(error),
      filename: file?.name || "unknown",
      size: file?.size || 0,
      filePath: publicPath || null
    })
  }
}
