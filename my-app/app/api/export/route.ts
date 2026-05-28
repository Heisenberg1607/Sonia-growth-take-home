import { NextResponse } from "next/server";
import db from "@/lib/db";

type ExportPost = {
  id: string;
  subreddit: string;
  title: string;
  content: string;
  author: string;
  upvotes: number;
  url: string | null;
  relevance_score: number | null;
  safety_flag: string | null;
  created_at: string;
};

type ExportComment = {
  id: number;
  post_id: string;
  generated_text: string;
  edited_text: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
};

type ExportReviewerDecision = {
  id: number;
  post_id: string;
  post_title: string;
  comment_id: number;
  comment_text: string | null;
  decision: "approved" | "rejected";
  edited_comment: string | null;
  reason: string | null;
  decided_at: string;
};

export async function GET() {
  try {
    const posts = db
      .prepare(
        `SELECT id, subreddit, title, content, author, upvotes, url, relevance_score, safety_flag, created_at
         FROM posts
         ORDER BY created_at DESC`
      )
      .all() as ExportPost[];

    const comments = db
      .prepare(
        `SELECT id, post_id, generated_text, edited_text, status, created_at, reviewed_at
         FROM comments
         ORDER BY created_at DESC`
      )
      .all() as ExportComment[];

    const reviewerDecisions = db
      .prepare(
        `SELECT
           rd.id,
           rd.post_id,
           p.title AS post_title,
           rd.comment_id,
           COALESCE(c.edited_text, c.generated_text) AS comment_text,
           rd.decision,
           rd.edited_comment,
           rd.reason,
           rd.decided_at
         FROM reviewer_decisions rd
         JOIN posts p ON p.id = rd.post_id
         LEFT JOIN comments c ON c.id = rd.comment_id
         ORDER BY rd.decided_at DESC`
      )
      .all() as ExportReviewerDecision[];

    const summary = {
      total_posts: posts.length,
      flagged: posts.filter((post) => post.safety_flag !== null).length,
      comments_generated: comments.length,
      approved: comments.filter((comment) => comment.status === "approved").length,
      rejected: comments.filter((comment) => comment.status === "rejected").length,
      edited: comments.filter((comment) => comment.edited_text !== null).length,
    };

    return NextResponse.json({
      exported_at: new Date().toISOString(),
      summary,
      posts,
      comments,
      reviewer_decisions: reviewerDecisions,
    });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json(
      { success: false, message: "Failed to export data", error: String(error) },
      { status: 500 }
    );
  }
}
