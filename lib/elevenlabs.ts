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
 * - Removes formatting and special characters
 * - Handles podcast script elements appropriately
 * - Preserves the natural flow of speech
 */
export function cleanTextForAudio(text: string): string {
  // First, capture and process speaker labels (Host:, Guest:, etc.)
  // We'll temporarily replace them with markers we can restore later
  const speakerMap: {[key: string]: string} = {};
  let speakerCount = 0;
  
  // Step 1: Identify and temporarily replace speaker labels
  let processedText = text.replace(/^(Host|Guest|Researcher|Speaker \d+|\w+):\s/gim, (match) => {
    const placeholder = `__SPEAKER_${speakerCount}__`;
    speakerMap[placeholder] = match;
    speakerCount++;
    return placeholder;
  });
  
  // Step 2: Remove non-speech elements
  processedText = processedText
    // Remove episode title markers
    .replace(/^\*\*Episode Title:[^*]+\*\*$/gm, '')
    .replace(/^Episode Title:[^\n]+$/gm, '')
    // Remove timing information like (00:00 - 05:00)
    .replace(/\(\d+:\d+\s*-\s*\d+:\d+\)/g, '')
    // Remove intro/outro music notes
    .replace(/^\*\*?Intro Music[^*\n]*\*\*?$/gm, '')
    .replace(/^\*\*?Outro Music[^*\n]*\*\*?$/gm, '')
    // Remove segment markers
    .replace(/^\*\*?Segment [^*\n]*\*\*?$/gm, '')
    // Remove markdown formatting
    .replace(/^#+\s+.+$/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold text
    .replace(/\*([^*]+)\*/g, '$1')     // Italic text
    // Remove brackets and their contents
    .replace(/\[([^\[\]]+)\]/g, '')
    // Remove parenthetical references and stage directions
    .replace(/\([^)]*\d{4}[^)]*\)/g, '')
    // Remove sound effect notes
    .replace(/\(([^)]*(sound effect|music|pause|beat|silence)[^)]*)\)/gi, '')
    // Remove transitions like "[Transition to next topic]"
    .replace(/\[[^\[\]]*transition[^\[\]]*\]/gi, '')
    .replace(/\([^)]*(transition)[^)]*\)/gi, '')
    // Remove other non-speech formatting
    .replace(/^-{3,}$/gm, '') // Horizontal rules
    // Clean up excessive whitespace
    .replace(/\s+/g, ' ')
    // Replace multiple newlines with a single one
    .replace(/\n\s*\n/g, '\n')
    .trim();
  
  // Step 3: Restore speaker labels
  Object.keys(speakerMap).forEach(placeholder => {
    // Replace each placeholder with its original speaker label but without the colon
    // This prevents the TTS from reading "Host colon" aloud
    const label = speakerMap[placeholder].replace(':', '');
    processedText = processedText.replace(new RegExp(placeholder, 'g'), label + '. ');
  });
  
  // Step 4: Format for better speech pacing
  processedText = processedText
    // Add pauses after sentences
    .replace(/([.!?])\s+/g, '$1. ');
    
  return processedText;
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
