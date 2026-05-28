import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const posts = db.prepare("SELECT * FROM posts ORDER BY created_at DESC").all();
    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch posts", error: String(error) },
      { status: 500 }
    );
  }
}
