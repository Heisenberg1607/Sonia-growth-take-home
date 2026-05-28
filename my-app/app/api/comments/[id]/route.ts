import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action, text } = await req.json();

    const comment = db
      .prepare("SELECT * FROM comments WHERE id = ?")
      .get(id) as { id: number; post_id: string } | undefined;

    if (!comment) {
      return NextResponse.json(
        { success: false, message: "Comment not found" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      db.prepare(
        "UPDATE comments SET status = 'approved', reviewed_at = datetime('now') WHERE id = ?"
      ).run(id);
      db.prepare(
        "INSERT INTO reviewer_decisions (post_id, comment_id, decision) VALUES (?, ?, 'approved')"
      ).run(comment.post_id, id);
    } else if (action === "reject") {
      db.prepare(
        "UPDATE comments SET status = 'rejected', reviewed_at = datetime('now') WHERE id = ?"
      ).run(id);
      db.prepare(
        "INSERT INTO reviewer_decisions (post_id, comment_id, decision) VALUES (?, ?, 'rejected')"
      ).run(comment.post_id, id);
    } else if (action === "edit") {
      db.prepare(
        "UPDATE comments SET edited_text = ?, status = 'approved', reviewed_at = datetime('now') WHERE id = ?"
      ).run(text, id);
      db.prepare(
        "INSERT INTO reviewer_decisions (post_id, comment_id, decision, edited_comment) VALUES (?, ?, 'approved', ?)"
      ).run(comment.post_id, id, text);
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid action" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Comment action failed:", error);
    return NextResponse.json(
      { success: false, message: String(error) },
      { status: 500 }
    );
  }
}
