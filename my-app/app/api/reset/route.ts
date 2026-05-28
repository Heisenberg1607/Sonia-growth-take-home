import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST() {
  try {
    db.transaction(() => {
      db.prepare("DELETE FROM reviewer_decisions").run();
      db.prepare("DELETE FROM comments").run();
      db.prepare("UPDATE posts SET relevance_score = NULL, safety_flag = NULL").run();
    })();

    return NextResponse.json({ success: true, message: "Database reset successfully" });
  } catch (error) {
    console.error("Reset failed:", error);
    return NextResponse.json(
      { success: false, message: String(error) },
      { status: 500 }
    );
  }
}
