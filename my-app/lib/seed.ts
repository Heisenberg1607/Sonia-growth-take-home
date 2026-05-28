import db from "@/lib/db";
import { mockPosts } from "@/lib/mockdata";

export function seed() {
  const existing = db.prepare("SELECT COUNT(*) as count FROM posts").get() as {
    count: number;
  };

  if (existing.count > 0) {
    console.log("Database already seeded, skipping.");
    return;
  }

  const insert = db.prepare(`
    INSERT INTO posts (id, subreddit, title, content, author, upvotes, url, relevance_score, safety_flag)
    VALUES (@id, @subreddit, @title, @content, @author, @upvotes, @url, @relevance_score, @safety_flag)
  `);

  const insertAll = db.transaction(() => {
    for (const post of mockPosts) {
      insert.run({
        id: post.id,
        subreddit: post.subreddit,
        title: post.title,
        content: post.content,
        author: post.author,
        upvotes: post.upvotes,
        url: post.url ?? null,
        relevance_score: post.relevance_score ?? null,
        safety_flag: post.safety_flag ?? null,
      });
    }
  });

  insertAll();
  console.log("Database seeded successfully");
}
