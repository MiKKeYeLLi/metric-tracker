import OpenAI from "openai";

/**
 * Any OpenAI-compatible provider works (OpenAI, Groq, OpenRouter, …): set AI_BASE_URL to its endpoint,
 * or leave it unset for OpenAI. Returns null when the key or model isn't configured, so callers can explain instead of crashing.
 */
export function getAiClient() {
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  const model = process.env.AI_MODEL;
  if (!apiKey || !model) return null;
  return { client: new OpenAI({ apiKey, baseURL: process.env.AI_BASE_URL || undefined }), model };
}
