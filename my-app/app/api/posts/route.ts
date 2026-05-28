import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const posts = db.prepare(`
      SELECT
        p.*,
        c.id        AS comment_id,
        c.generated_text AS comment_text,
        c.edited_text    AS comment_edited_text,
        c.status         AS comment_status
      FROM posts p
      LEFT JOIN comments c ON c.post_id = p.id
        AND c.id = (
          SELECT id FROM comments
          WHERE post_id = p.id
          ORDER BY created_at DESC
          LIMIT 1
        )
      ORDER BY p.created_at DESC
    `).all();
    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch posts", error: String(error) },
      { status: 500 }
    );
  }
}
