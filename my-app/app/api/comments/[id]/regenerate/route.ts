import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { generateComment } from "@/lib/ai";

type DbComment = { id: number; post_id: string };
type DbPost = { id: string; title: string; content: string; subreddit: string };

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const comment = db
      .prepare("SELECT id, post_id FROM comments WHERE id = ?")
      .get(id) as DbComment | undefined;

    if (!comment) {
      return NextResponse.json(
        { success: false, message: "Comment not found" },
        { status: 404 }
      );
    }

    const post = db
      .prepare("SELECT id, title, content, subreddit FROM posts WHERE id = ?")
      .get(comment.post_id) as DbPost | undefined;

    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    const result = await generateComment(post);

    if (!result.comment) {
      return NextResponse.json(
        { success: false, message: result.safety_reason ?? "Failed to generate a comment" },
        { status: 422 }
      );
    }

    db.prepare(
      `UPDATE comments
       SET generated_text = ?, edited_text = NULL, status = 'pending', reviewed_at = NULL
       WHERE id = ?`
    ).run(result.comment, id);

    return NextResponse.json({ success: true, comment: result.comment });
  } catch (error) {
    console.error("Regenerate failed:", error);
    return NextResponse.json(
      { success: false, message: String(error) },
      { status: 500 }
    );
  }
}
