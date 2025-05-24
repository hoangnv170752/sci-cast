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

export async function generateSpeech(text: string, voiceId: string): Promise<ArrayBuffer> {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
    },
    body: JSON.stringify({
      text,
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
