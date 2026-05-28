import db from "@/lib/db";
import { scoreRelevance, generateComment } from "@/lib/ai";

type DbPost = {
  id: string;
  title: string;
  content: string;
  subreddit: string;
};

export async function POST() {
  const posts = db
    .prepare(
      "SELECT id, title, content, subreddit FROM posts WHERE relevance_score IS NULL AND safety_flag IS NULL"
    )
    .all() as DbPost[];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(chunk: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      }

      for (const post of posts) {
        // Notify client this post is now being processed
        send({
          post_id: post.id,
          title: post.title,
          relevance_score: null,
          safety_flag: null,
          comment: null,
          comment_id: null,
          status: "processing",
        });

        const { score } = await scoreRelevance({
          title: post.title,
          content: post.content,
          subreddit: post.subreddit,
        });

        db.prepare("UPDATE posts SET relevance_score = ? WHERE id = ?").run(score, post.id);

        if (score < 6) {
          send({
            post_id: post.id,
            title: post.title,
            relevance_score: score,
            safety_flag: null,
            comment: null,
            comment_id: null,
            status: "scored",
          });
          continue;
        }

        const { comment, is_safe, safety_reason } = await generateComment({
          title: post.title,
          content: post.content,
        });

        if (!is_safe) {
          db.prepare("UPDATE posts SET safety_flag = ? WHERE id = ?").run(safety_reason, post.id);
          send({
            post_id: post.id,
            title: post.title,
            relevance_score: score,
            safety_flag: safety_reason,
            comment: null,
            comment_id: null,
            status: "flagged",
          });
          continue;
        }

        const result = db
          .prepare(
            "INSERT INTO comments (post_id, generated_text, is_safe, status) VALUES (?, ?, 1, 'pending')"
          )
          .run(post.id, comment) as { lastInsertRowid: number };

        send({
          post_id: post.id,
          title: post.title,
          relevance_score: score,
          safety_flag: null,
          comment,
          comment_id: result.lastInsertRowid,
          status: "pending",
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
