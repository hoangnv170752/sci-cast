import { createOpenAI } from "@ai-sdk/openai"

export const cerebras = createOpenAI({
  baseURL: "https://api.cerebras.ai/v1",
  apiKey: process.env.CEREBRAS_API_KEY,
})
