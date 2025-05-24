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
    // Use OpenAI to extract raw text from PDF
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: "You are a PDF content extractor. Extract the main text content from the provided PDF data."
          },
          {
            role: "user",
            content: `Extract the main textual content from this PDF:\n\nFilename: ${filename}\nContent: ${pdfContent.substring(0, 50000)}`
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    const extractedText = result.choices?.[0]?.message?.content || "";
    
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
 * Create a podcast-ready summary using Cerebras qwen model
 */
async function createPodcastSummary(extractedText: string, filename: string): Promise<ExtractedContent> {
  // Check if Cerebras API key is available
  if (!process.env.CEREBRAS_API_KEY) {
    console.warn('CEREBRAS_API_KEY is not set, returning raw extracted text');
    return {
      text: extractedText,
      source: 'fallback'
    };
  }
  
  try {
    // Use Cerebras with llama-4-scout model to create podcast summary
    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CEREBRAS_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-4-scout-17b-16e-instruct", // Using llama model as shown in your curl example
        messages: [
          {
            role: "system",
            content: "You are an expert podcast content creator who can transform academic content into engaging podcast material."
          },
          {
            role: "user",
            content: `Create an engaging podcast script based on this extracted text from ${filename}:\n\n${extractedText.substring(0, 8000)}\n\nFocus on:\n- The main research question and objectives\n- Key methodology used\n- Most significant findings and results\n- The importance and implications of the research\n- Any particularly interesting or novel aspects\n\nStructure the content as a well-organized podcast script.`
          }
        ],
        temperature: 0.2,
        max_tokens: 2048,
        top_p: 1
      })
    });
    
    if (!response.ok) {
      throw new Error(`Cerebras API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return {
      text: result.choices?.[0]?.message?.content || extractedText,
      source: 'cerebras'
    };
  } catch (error) {
    console.error('Error using Cerebras for podcast summary:', error);
    return {
      text: extractedText,
      source: 'fallback'
    };
  }
}

/**
 * Main function to extract content from PDF and create a podcast summary
 */
export async function extractContentWithGwen(pdfContent: string, filename: string): Promise<string> {
  // Step 1: Extract raw text with OpenAI or fallback
  const fallbackText = extractPlainTextFromPdf(pdfContent);
  
  try {
    // Step 1: Extract text content using OpenAI
    const extractedContent = await extractTextWithOpenAI(pdfContent, filename);
    
    // Step 2: Generate podcast summary using Cerebras if text extraction succeeded
    if (extractedContent.text && extractedContent.text.length > 200) {
      const podcastSummary = await createPodcastSummary(extractedContent.text, filename);
      
      // Return the podcast summary with source information
      if (podcastSummary.source === 'cerebras') {
        return `[Podcast summary created with Cerebras]\n\n${podcastSummary.text}`;
      } else if (extractedContent.source === 'openai') {
        return `[Text extracted with OpenAI]\n\n${extractedContent.text}`;
      }
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
