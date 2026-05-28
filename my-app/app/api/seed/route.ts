import { NextResponse } from "next/server";
import { seed } from "@/lib/seed";

export async function GET() {
  try {
    seed();
    return NextResponse.json({ success: true, message: "Database seeded successfully" });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, message: "Seeding failed", error: String(error) },
      { status: 500 }
    );
  }
}
