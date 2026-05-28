import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-sonnet-4-20250514";

export async function scoreRelevance(post: {
  title: string;
  content: string;
  subreddit: string;
}): Promise<{ score: number; reasoning: string }> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: `You are a relevance scoring engine for Sonia, a general wellness AI companion app that helps people manage their mental health between therapy sessions, find affordable support, and build healthy emotional habits.

Score Reddit posts on how relevant they are to Sonia's target users (people seeking mental wellness support, affordable therapy alternatives, or tools to manage anxiety/depression/stress).

Respond with valid JSON only. No markdown, no explanation outside the JSON.`,
    messages: [
      {
        role: "user",
        content: `Score this Reddit post for relevance to Sonia (1-10).

Subreddit: ${post.subreddit}
Title: ${post.title}
Content: ${post.content}

Scoring guide:
- 8-10: Directly seeking affordable mental health support, therapy alternatives, or between-session tools
- 5-7: Sharing mental health experiences or asking general wellness questions
- 3-4: Adjacent to mental health but not seeking tools/support
- 1-2: Unrelated to mental health or wellness

Return JSON: {"score": <number 1-10>, "reasoning": "<one sentence>"}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text);
}

export async function generateComment(post: {
  title: string;
  content: string;
}): Promise<{
  comment: string | null;
  is_safe: boolean;
  safety_reason: string | null;
}> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `You are a safety and comment generation engine for Sonia, a wellness AI companion app.

Your job has two steps:
1. Check if the post is safe to engage with
2. If safe, generate a helpful, human-sounding comment

SAFETY FLAGS — mark unsafe if the post contains:
- Crisis content, suicidal ideation, or self-harm language
- Any indication the author is a minor
- Requests for medical diagnosis, medication advice, or treatment recommendations
- Direct medical claims or clinical advice

If unsafe: return is_safe: false, comment: null, and a brief safety_reason.
If safe: generate a warm, specific, human-sounding comment under 3 sentences. Do not mention Sonia unless completely natural. Do not be salesy or promotional.

Respond with valid JSON only. No markdown, no explanation outside the JSON.`,
    messages: [
      {
        role: "user",
        content: `Evaluate this post and generate a comment if safe.

Title: ${post.title}
Content: ${post.content}

Return JSON:
{"comment": "<string or null>", "is_safe": <boolean>, "safety_reason": "<string or null>"}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text);
}
