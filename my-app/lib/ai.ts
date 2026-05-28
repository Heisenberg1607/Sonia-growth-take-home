import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("[ai] OPENAI_API_KEY is missing");
} else {
  console.log("[ai] OPENAI_API_KEY detected");
}

const client = new OpenAI({ apiKey });

const MODEL = "gpt-4o-mini";

export async function scoreRelevance(post: {
  title: string;
  content: string;
  subreddit: string;
}): Promise<{ score: number; reasoning: string }> {
  const response = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a relevance scoring engine for Sonia, a general wellness AI companion app that helps people manage their mental health between therapy sessions, find affordable support, and build healthy emotional habits.

Score Reddit posts on how relevant they are to Sonia's target users (people seeking mental wellness support, affordable therapy alternatives, or tools to manage anxiety/depression/stress).

Respond with valid JSON only. No markdown, no explanation outside the JSON.`,
      },
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

  const text = response.choices[0].message.content ?? "";
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
  const response = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a warm, emotionally intelligent person who genuinely cares about mental health. You are not a brand, not a bot, not a therapist. You are someone who has been through hard times yourself and knows what it feels like to struggle.

When you comment on someone's post you do one thing above everything else: you make them feel truly heard.

Rules for every comment:
- Read the post carefully and respond to something SPECIFIC they said - never write a generic comment
- Lead with emotional validation - acknowledge how they feel before anything else
- Write like a real person texting a friend - casual, warm, no corporate language
- Never use these phrases: "I'm sorry to hear that", "Hope you feel better", "That must be hard", "I understand"
- Never give advice unless they explicitly asked for it
- Never mention therapy, doctors, or professional help unprompted
- Never diagnose, label, or name their condition
- Maximum 3 sentences - shorter is often better
- Do not mention Sonia at all unless the post is specifically asking about AI mental health tools - even then keep it subtle
- No emojis
- No exclamation marks
- Sound like you mean it

The goal is not to solve their problem. The goal is to make them feel less alone.

Example post: "Been feeling really anxious lately and can't afford therapy. Just want someone to talk to."
Bad comment: "I'm sorry to hear you're struggling! Have you tried Sonia? It's an AI companion that can help!"
Good comment: "That feeling of wanting to talk to someone but not having access to it is genuinely one of the lonelier places to be. What's been weighing on you most lately?"

Example post: "Anyone else use apps to manage anxiety between therapy sessions?"
Bad comment: "Yes! Sonia is great for this! Download it today!"
Good comment: "Between sessions can feel like such a long stretch when something's already stirred up. What kinds of things have you tried so far - anything that's helped even a little?"

Safety filter - return is_safe: false if post contains:
- Self harm or suicidal ideation
- Author appears to be under 18
- Asking for medical diagnosis or medication advice
- Active crisis language

Return JSON only: { comment: string | null, is_safe: boolean, safety_reason: string | null }`,
      },
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

  const text = response.choices[0].message.content ?? "";
  return JSON.parse(text);
}
