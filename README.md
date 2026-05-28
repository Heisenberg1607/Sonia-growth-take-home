# Sonia Growth Tool — Comment Assist System

## Overview

This tool helps the Sonia growth team identify relevant Reddit posts and draft thoughtful, human-sounding comments for human review before anything goes live. It ingests mock Reddit posts, runs a three-step AI pipeline to score relevance and generate comments, and surfaces them in a reviewer dashboard where a team member can approve, edit, or reject each one. Nothing is posted to Reddit automatically — every comment requires explicit human sign-off. It exists to make community outreach faster, more consistent, and safer.

---

## Architecture

**Tech stack:**
- Next.js App Router
- SQLite via `better-sqlite3` for local storage
- OpenAI GPT-4o-mini for relevance scoring and comment generation
- Tailwind CSS for UI

**AI workflow:**

```
Post Ingestion → Safety Check → Relevance Scoring → Comment Generation → Human Review → Decision Logged
```

---

## Setup Instructions

**Prerequisites:** Node.js 20+, npm, and an [OpenAI API key](https://platform.openai.com/api-keys).

1. Clone the repository
   ```bash
   git clone <repo-url>
   cd "Sonia-growth-take-home"
   ```

2. Install dependencies
   ```bash
   cd my-app
   npm install
   ```

3. Copy environment variables (from the repo root, or run this inside `my-app` as `cp .env.local.example .env.local`)
   ```bash
   cp my-app/.env.local.example my-app/.env.local
   ```

4. Add your OpenAI API key to `my-app/.env.local`

5. Run the development server
   ```bash
   cd my-app
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

7. On first run, seed mock posts by visiting [http://localhost:3000/api/seed](http://localhost:3000/api/seed) in your browser

8. Click **Process Posts with AI** to run the AI workflow

---

## Environment Variables

Create `my-app/.env.local` with the following:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

---

## How to Use

1. Seed the database with mock posts (`GET /api/seed` once the dev server is running)
2. Click **Process Posts with AI** — posts update in real time as each one is processed
3. Review generated comments — approve, edit, or reject each one
4. Flagged posts are shown with a red banner and cannot be approved
5. Click **Reset** to start fresh

---

## AI Workflow

Every post runs through a three-step pipeline in sequence. First, a safety check evaluates the post for crisis content, mentions of minors, or medical advice — if it fails, the post is flagged and skipped entirely. Next, a relevance scoring step rates the post from 1–10 based on how well Sonia could add genuine value to the conversation. If the score is 6 or above, a comment generation step runs and produces a short, specific, human-sounding comment tailored to what the person actually wrote. All three steps call GPT-4o-mini and return structured JSON. Results stream back to the UI in real time as each post finishes.

---

## Safety Filter

The following content types are flagged and excluded from comment generation:

- Crisis or self-harm content
- Mentions of minors
- Medical diagnosis or treatment requests
- Medication advice
- Active crisis language

---

## Tradeoffs and Known Limitations

- **Post sourcing is mocked** — in production this would use the Reddit API via Apify
- **SQLite is local only** — production would use Supabase or PostgreSQL
- **No authentication** — single-user tool, not suitable for a shared team environment as-is
- **OpenAI rate limits** may slow processing for large datasets

---

## What I Would Build Next

- Live Reddit API integration via Apify
- Twitter and YouTube creator sourcing
- Analytics dashboard showing which comment styles get best engagement
- Multi-user support with Supabase and role-based access
- Automated A/B testing of comment variations
- Slack integration for real-time review notifications

---

## Demo Output

See [demo-output.json](demo-output.json) for sample generated comments and reviewer decisions.
