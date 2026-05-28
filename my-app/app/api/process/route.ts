import { NextResponse } from "next/server";
import db from "@/lib/db";
import { scoreRelevance, generateComment } from "@/lib/ai";

type Post = {
  id: string;
  title: string;
  content: string;
  subreddit: string;
  relevance_score: number | null;
  safety_flag: string | null;
};

export async function POST() {
  const posts = db
    .prepare(
      "SELECT id, title, content, subreddit FROM posts WHERE relevance_score IS NULL AND safety_flag IS NULL"
    )
    .all() as Post[];

  let commentsGenerated = 0;
  let postsFlagged = 0;

  for (const post of posts) {
    // Score relevance
    const { score, reasoning } = await scoreRelevance({
      title: post.title,
      content: post.content,
      subreddit: post.subreddit,
    });

    db.prepare("UPDATE posts SET relevance_score = ? WHERE id = ?").run(
      score,
      post.id
    );

    if (score < 6) continue;

    // Generate comment for relevant posts
    const { comment, is_safe, safety_reason } = await generateComment({
      title: post.title,
      content: post.content,
    });

    if (!is_safe) {
      db.prepare("UPDATE posts SET safety_flag = ? WHERE id = ?").run(
        safety_reason,
        post.id
      );
      postsFlagged++;
      continue;
    }

    db.prepare(
      "INSERT INTO comments (post_id, generated_text, is_safe, status) VALUES (?, ?, 1, 'pending')"
    ).run(post.id, comment);

    commentsGenerated++;
  }

  return NextResponse.json({
    success: true,
    postsProcessed: posts.length,
    commentsGenerated,
    postsFlagged,
  });
}
