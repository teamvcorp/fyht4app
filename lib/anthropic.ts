import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/** Lazily-constructed Anthropic client (reads ANTHROPIC_API_KEY from env). */
export function getAnthropic(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

// Project default is Sonnet 4.6 for cost/latency; override via ANTHROPIC_MODEL.
export const COACH_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
