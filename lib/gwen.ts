import { createOpenAI } from '@ai-sdk/openai';

// Define the processing pipeline types
type ExtractedContent = {
  text: string;
  source: 'openai' | 'cerebras' | 'fallback';
};

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
/**
 * Extract raw text content from a PDF using OpenAI
 */
async function extractTextWithOpenAI(pdfContent: string, filename: string): Promise<ExtractedContent> {
  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY is not set, using fallback extraction');
    return {
      text: extractPlainTextFromPdf(pdfContent),
      source: 'fallback'
    };
  }
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert academic content extractor specializing in PDF analysis. Your task is to extract clean, well-structured content from scientific papers and research documents.

Guidelines:
1. Focus on the main body text, abstract, methodology, results, and discussion sections
2. Remove headers, footers, page numbers, and citation markers
3. Preserve section titles and hierarchical structure where possible
4. Maintain paragraph breaks and formatting essential to understanding
5. Handle technical terminology, equations, and specialized notation appropriately
6. Exclude acknowledgments, references, and appendices unless they contain critical information
7. Present the extracted content in a clean, readable format
8. Format content for podcast script preparation

Return ONLY the extracted content, no explanations or commentary.`
          },
          {
            role: "user",
            content: `Extract the scholarly content from this research paper PDF. I need the main textual content only, properly structured for use in podcast creation.\n\nFilename: ${filename}\nContent: ${pdfContent.substring(0, 75000)}`
          }
        ],
        max_tokens: 8000, // Increased token limit for more comprehensive extraction
        temperature: 0.0, // Reduced temperature for more deterministic output
        response_format: { type: "text" } // Ensure we get plain text back
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    const extractedText = result.choices?.[0]?.message?.content || "";
    console.log("Extracted text:", extractedText);
    
    return {
      text: extractedText,
      source: 'openai'
    };
  } catch (error) {
    console.error('Error using OpenAI for text extraction:', error);
    return {
      text: extractPlainTextFromPdf(pdfContent),
      source: 'fallback'
    };
  }
}

/**
 * Create a podcast-ready summary using Cerebras model
 * This function is separated from the extraction to give more control
 */
export async function generatePodcastScript(extractedText: string, podcastTitle: string, hostName: string, guestName?: string): Promise<string> {
  // Check if Cerebras API key is available
  if (!process.env.CEREBRAS_API_KEY) {
    console.warn('CEREBRAS_API_KEY is not set, cannot generate podcast script');
    throw new Error('CEREBRAS_API_KEY is not set');
  }
  
  try {
    // Use Cerebras with llama-4-scout model to create podcast script
    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CEREBRAS_API_KEY}`
      },
      body: JSON.stringify({
        model: "qwen-3-32b", // Using Qwen-3 model as requested
        messages: [
          {
            role: "system",
            content: "You are an expert podcast content creator who can transform academic content into engaging podcast material. Create dialogue-based scripts with clear speaker labels."
          },
          {
            role: "user",
            content: `Create an engaging podcast script titled "${podcastTitle || 'Research Insights'}" with host ${hostName || 'Host'} ${guestName ? `and guest ${guestName}` : ''}. Base it on this research text:

${extractedText.substring(0, 10000)}

Format the podcast script with:
- A compelling intro with the podcast title
- Clear speaker labels (Host: and ${guestName ? 'Guest:' : 'Researcher:'})
- Conversational dialogue discussing key research points
- Questions from the host and detailed responses
- Focus on the main research findings, methodology, and implications
- A concise conclusion summarizing key takeaways

Structure the content as a professional podcast script that sounds natural when read aloud.`
          }
        ],
        temperature: 0.7, // Higher temperature for more creative output
        max_tokens: 4096, // Longer output for complete script
        top_p: 1
      })
    });
    
    if (!response.ok) {
      throw new Error(`Cerebras API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    const scriptContent = result.choices?.[0]?.message?.content;
    
    if (!scriptContent) {
      throw new Error('No script content returned from API');
    }
    
    return scriptContent;
  } catch (error) {
    console.error('Error generating podcast script:', error);
    throw error;
  }
}

/**
 * Main function to extract content from PDF (extraction only, no podcast script generation)
 */
export async function extractContentWithGwen(pdfContent: string, filename: string): Promise<string> {
  // Prepare fallback extraction for worst case
  const fallbackText = extractPlainTextFromPdf(pdfContent);
  
  try {
    // Extract text content using OpenAI
    const extractedContent = await extractTextWithOpenAI(pdfContent, filename);
    
    // Return the extracted content if successful
    if (extractedContent.text && extractedContent.text.length > 200) {
      console.log('Successful text extraction with OpenAI');
      return extractedContent.text;
    }
    
    // Return fallback text if both steps failed
    return `[Extracted using fallback method]\n\n${fallbackText.substring(0, 10000)}`;
  } catch (error) {
    console.error('Error in extraction pipeline:', error);
    
    // Return fallback text if available
    if (fallbackText && fallbackText.length > 500) {
      console.log('Using fallback extraction...');
      return `[Extracted using basic text extraction]\n\n${fallbackText.substring(0, 10000)}`;
    } else {
      return 'The system could not extract meaningful content from this PDF. Please try a different file or format.';
    }
  }
}
