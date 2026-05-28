Sonia Growth Tool — a comment-assist prototype for reviewing Reddit-style posts, scoring relevance, drafting comments, and approving/rejecting drafts.

Built with [Next.js](https://nextjs.org).

## Prerequisites

- Node.js 20+
- npm
- An [OpenAI API key](https://platform.openai.com/api-keys)

## Getting Started

From the `my-app` directory:

```bash
npm install
cp .env.local.example .env.local
```

Edit `.env.local` and set your API key:

```
OPENAI_API_KEY=your_openai_api_key_here
```

Start the dev server:

```bash
npm run dev
```

On first run, seed the local SQLite database (20 sample posts) by visiting [http://localhost:3000/api/seed](http://localhost:3000/api/seed) in your browser.

Open [http://localhost:3000](http://localhost:3000) in your browser.

Optional: export all posts, comments, and reviewer decisions at `GET /api/export`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
