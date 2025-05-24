import { extractContentWithGwen } from './gwen'

/**
 * Converts an ArrayBuffer to a Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
}

export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type
  const fileName = file.name.toLowerCase()

  try {
    if (fileType === "text/plain" || fileName.endsWith(".txt")) {
      return await file.text()
    }

    if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      // For PDF files, use the Qwen-3-32B model to extract meaningful content
      const arrayBuffer = await file.arrayBuffer()
      const base64Content = arrayBufferToBase64(arrayBuffer)
      
      try {
        // Use Qwen model to extract and summarize the content
        // The extractContentWithGwen function now handles its own errors and provides fallback extraction
        const extractedContent = await extractContentWithGwen(base64Content, file.name)
        
        if (extractedContent && extractedContent.length > 0) {
          return extractedContent
        } else {
          // If we got an empty response, fall back to basic extraction
          const text = new TextDecoder().decode(arrayBuffer)
          const basicExtraction = text.replace(/[^\x20-\x7E\n]/g, " ").trim()
          
          return basicExtraction.length > 0 
            ? `[Basic extraction]\n\n${basicExtraction}` 
            : "No text could be extracted from this PDF. Please try a different file."
        }
      } catch (pdfError) {
        console.warn("PDF extraction with AI failed, using fallback:", pdfError)
        
        // Last resort basic extraction
        const text = new TextDecoder().decode(arrayBuffer)
        return text.replace(/[^\x20-\x7E\n]/g, " ").trim()
      }
    }

    if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.endsWith(".docx")
    ) {
      // For DOCX files, we'll extract what we can
      // In a real implementation, you'd use mammoth.js or similar
      const arrayBuffer = await file.arrayBuffer()
      const text = new TextDecoder().decode(arrayBuffer)

      // Basic DOCX text extraction (this is simplified)
      return text.replace(/[^\x20-\x7E\n]/g, " ").trim()
    }

    throw new Error("Unsupported file type")
  } catch (error) {
    console.error("Text extraction error:", error)
    throw new Error("Failed to extract text from file")
  }
}
