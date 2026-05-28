import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "sonia.db"));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create tables on startup
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    subreddit TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    url TEXT,
    relevance_score REAL DEFAULT NULL,
    safety_flag TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id TEXT NOT NULL,
    generated_text TEXT NOT NULL,
    is_safe BOOLEAN DEFAULT TRUE,
    safety_reason TEXT DEFAULT NULL,
    status TEXT DEFAULT 'pending',
    edited_text TEXT DEFAULT NULL,
    reviewed_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id)
  );

  CREATE TABLE IF NOT EXISTS reviewer_decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id TEXT NOT NULL,
    comment_id INTEGER NOT NULL,
    decision TEXT NOT NULL,
    edited_comment TEXT DEFAULT NULL,
    reason TEXT DEFAULT NULL,
    decided_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (comment_id) REFERENCES comments(id)
  );
`);
export default db;
