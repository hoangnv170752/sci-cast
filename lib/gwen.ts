import { createOpenAI } from '@ai-sdk/openai';

// Simple text extraction from PDF content as a fallback
function extractPlainTextFromPdf(pdfContent: string): string {
  // This is a simple regex-based approach to extract text that might be readable
  // Not as effective as proper parsing but serves as a fallback
  const textLines = pdfContent
    .replace(/[^\x20-\x7E\n]/g, " ")
    .split(/\n/)
    .filter(line => line.trim().length > 0)
    .map(line => line.trim())
    .filter(line => {
      // Filter out lines that are likely PDF structure artifacts
      return (
        line.length > 10 && 
        !line.match(/^[0-9\s]*$/) && // Not just numbers
        !line.match(/^[\[\]\(\)\{\}\<\>\s]*$/) // Not just brackets
      );
    });
  
  return textLines.join('\n');
}

/**
 * Uses the Qwen-3-32B model to extract the main content from a PDF file.
 * @param pdfContent Base64 encoded PDF content
 * @param filename Name of the PDF file for context
 * @returns Extracted main content suitable for podcast creation
 */
export async function extractContentWithGwen(pdfContent: string, filename: string): Promise<string> {
  try {
    // Create a direct API client for Cerebras API
    const cerebrasClient = createOpenAI({
      baseURL: "https://api.cerebras.ai/v1",
      apiKey: process.env.CEREBRAS_API_KEY,
    });

    const prompt = `
You are an expert research assistant helping to extract the main content from academic papers.
Your task is to read the following PDF content and extract the most important information that would be useful for creating a podcast.

Focus on:
- The main research question and objectives
- Key methodology used
- Most significant findings and results
- The importance and implications of the research
- Any particularly interesting or novel aspects

Please provide a coherent summary that captures the essence of the paper in about 500-1000 words.

PDF Filename: ${filename}
PDF Content: ${pdfContent.substring(0, 100000)} // Limit size to avoid token limits
`;

    // Use direct fetch to Cerebras API for Gwen 3
    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CEREBRAS_API_KEY}`
      },
      body: JSON.stringify({
        model: "Qwen-3-32B",
        messages: [
          {
            role: "system",
            content: "You are an expert research assistant specializing in extracting and summarizing academic content for podcast creation."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2048,
        temperature: 0.2,
      })
    });

    if (!response.ok) {
      throw new Error(`Cerebras API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || 
      "Sorry, I couldn't extract meaningful content from this PDF.";
  } catch (error) {
    console.error('Error using Qwen model:', error);
    
    // Fallback to basic text extraction instead of throwing an error
    try {
      console.log('Attempting fallback text extraction...');
      const extractedText = extractPlainTextFromPdf(pdfContent);
      
      if (extractedText && extractedText.length > 500) {
        console.log('Fallback extraction successful');
        return `[Extracted using fallback method]\n\n${extractedText.substring(0, 10000)}`;
      } else {
        console.log('Fallback extraction insufficient');
        return 'The system could not extract meaningful content from this PDF. Please try a different file or format.';
      }
    } catch (fallbackError) {
      console.error('Fallback extraction also failed:', fallbackError);
      return 'Unable to extract content from this PDF. Please try a different file or format.';
    }
  }
}
