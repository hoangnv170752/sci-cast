export interface Voice {
  voice_id: string
  name: string
  category: string
  description: string
  accent?: string
}

export const ELEVENLABS_VOICES: Voice[] = [
  {
    voice_id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    category: "premade",
    description: "Professional female voice",
    accent: "American",
  },
  {
    voice_id: "29vD33N1CtxCmqQRPOHJ",
    name: "Drew",
    category: "premade",
    description: "Warm male voice",
    accent: "American",
  },
  {
    voice_id: "2EiwWnXFnvU5JabPnv8n",
    name: "Clyde",
    category: "premade",
    description: "Middle-aged male",
    accent: "American",
  },
  {
    voice_id: "5Q0t7uMcjvnagumLfvZi",
    name: "Paul",
    category: "premade",
    description: "Mature male voice",
    accent: "American",
  },
  {
    voice_id: "AZnzlk1XvdvUeBnXmlld",
    name: "Domi",
    category: "premade",
    description: "Young female voice",
    accent: "American",
  },
  {
    voice_id: "CYw3kZ02Hs0563khs1Fj",
    name: "Dave",
    category: "premade",
    description: "British male voice",
    accent: "British",
  },
]

/**
 * Clean text for audio generation by removing non-speech elements
 * - Removes markdown formatting and special characters
 * - Removes section titles (lines ending with colons)
 * - Removes headings (lines with all uppercase or starting with #)
 * - Replaces multiple newlines with a single one
 */
export function cleanTextForAudio(text: string): string {
  // Remove markdown formatting and special characters
  let cleanedText = text
    // Remove markdown headings
    .replace(/^#+\s+.+$/gm, '')
    // Remove section titles (lines ending with colon)
    .replace(/^[A-Z][^\n:]+:$/gm, '')
    // Remove lines that are all caps (likely headers)
    .replace(/^[A-Z\s\d\.,]+$/gm, '')
    // Remove non-text markers like [Title], [Introduction], etc.
    .replace(/\[([^\[\]]+)\]/g, '')
    // Remove parenthetical references like (Smith et al., 2020)
    .replace(/\([^)]*\d{4}[^)]*\)/g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Replace multiple newlines with a single one
    .replace(/\n\s*\n/g, '\n')
    .trim();
    
  // Break up very long paragraphs for better speech pacing
  cleanedText = cleanedText.replace(/([.!?])\s+/g, '$1\n');
  
  return cleanedText;
}

export async function generateSpeech(text: string, voiceId: string): Promise<ArrayBuffer> {
  // Clean the text before sending to ElevenLabs
  const cleanedText = cleanTextForAudio(text);
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
    },
    body: JSON.stringify({
      text: cleanedText,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`)
  }

  return response.arrayBuffer()
}

export async function getVoices(): Promise<Voice[]> {
  try {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      },
    })

    if (!response.ok) {
      console.warn("Failed to fetch ElevenLabs voices, using default list")
      return ELEVENLABS_VOICES
    }

    const data = await response.json()
    return data.voices || ELEVENLABS_VOICES
  } catch (error) {
    console.warn("Error fetching voices:", error)
    return ELEVENLABS_VOICES
  }
}
