export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type
  const fileName = file.name.toLowerCase()

  try {
    if (fileType === "text/plain" || fileName.endsWith(".txt")) {
      return await file.text()
    }

    if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      // For PDF files, we'll use a simple text extraction
      // In a real implementation, you might want to use pdf-parse or similar
      const arrayBuffer = await file.arrayBuffer()
      const text = new TextDecoder().decode(arrayBuffer)

      // Basic PDF text extraction (this is simplified)
      // You might want to integrate a proper PDF parser
      return text.replace(/[^\x20-\x7E\n]/g, " ").trim()
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
