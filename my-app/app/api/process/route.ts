import db from "@/lib/db";
import { scoreRelevance, generateComment } from "@/lib/ai";

type DbPost = {
  id: string;
  title: string;
  content: string;
  subreddit: string;
};

export async function POST(request: Request) {
  let postId: string | null = null;
  try {
    const body = (await request.json()) as { post_id?: string };
    postId = body?.post_id ?? null;
  } catch {
    postId = null;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const posts = postId
          ? (db
              .prepare(
                "SELECT * FROM posts WHERE id = ? AND relevance_score IS NULL AND safety_flag IS NULL"
              )
              .all(postId) as DbPost[])
          : (db
              .prepare("SELECT * FROM posts WHERE relevance_score IS NULL AND safety_flag IS NULL")
              .all() as DbPost[]);

        for (const post of posts) {
          const processingChunk = JSON.stringify({
            post_id: post.id,
            relevance_score: null,
            safety_flag: null,
            generated_comment: null,
            comment_id: null,
            status: "processing",
          });
          controller.enqueue(encoder.encode(`data: ${processingChunk}\n\n`));

          const { score } = await scoreRelevance(post);
          db.prepare("UPDATE posts SET relevance_score = ? WHERE id = ?").run(score, post.id);

          let commentData: string | null = null;
          let commentId: number | null = null;
          let safetyFlag: string | null = null;

          if (score >= 6) {
            const result = await generateComment(post);
            if (!result.is_safe) {
              safetyFlag = result.safety_reason;
              db.prepare("UPDATE posts SET safety_flag = ? WHERE id = ?").run(safetyFlag, post.id);
            } else {
              const insert = db
                .prepare(
                  "INSERT INTO comments (post_id, generated_text, is_safe, status) VALUES (?, ?, ?, ?)"
                )
                .run(post.id, result.comment, 1, "pending") as { lastInsertRowid: number };
              commentData = result.comment;
              commentId = insert.lastInsertRowid;
            }
          }

          const chunk = JSON.stringify({
            post_id: post.id,
            relevance_score: score,
            safety_flag: safetyFlag,
            generated_comment: commentData,
            comment_id: commentId,
            status: safetyFlag ? "flagged" : score >= 6 ? "pending" : "low_relevance",
          });

          controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        }

        controller.enqueue(encoder.encode('data: {"done": true}\n\n'));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
