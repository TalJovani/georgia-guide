import Anthropic from "@anthropic-ai/sdk";

// One Claude client for every AI feature (trip summaries, chat reply suggestions).
// Two ways to reach Claude, both through the same SDK:
// - Anthropic directly: ANTHROPIC_API_KEY.
// - A gateway that speaks the Anthropic API, like OpenRouter:
//   ANTHROPIC_BASE_URL + ANTHROPIC_AUTH_TOKEN, and AI_MODEL in the gateway's naming.
// Without a key the AI features are off, and everything else works as usual.
const apiKey = process.env.ANTHROPIC_API_KEY || null;
const authToken = process.env.ANTHROPIC_AUTH_TOKEN || null;
export const aiClient = apiKey || authToken ? new Anthropic({ apiKey, authToken }) : null;
export const isAiEnabled = aiClient !== null;

export const AI_MODEL = process.env.AI_MODEL || "claude-opus-5-5";

// If a safety check declines a request, the API retries it on another model. This is an
// Anthropic API feature, so only ask for it when talking to Anthropic directly.
export const fallbackOptions = process.env.ANTHROPIC_BASE_URL
    ? {}
    : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

// Logs why a call to Claude failed, in words a developer can act on.
export function logAiError(what: string, err: unknown) {
    if (err instanceof Anthropic.AuthenticationError) {
        console.error(`${what}: the API key was rejected`);
    } else if (err instanceof Anthropic.RateLimitError) {
        console.error(`${what}: rate limited, try again later`);
    } else if (err instanceof Anthropic.APIError) {
        console.error(`${what}: API error ${err.status}: ${err.message}`);
    } else {
        console.error(`${what} failed:`, err);
    }
}
