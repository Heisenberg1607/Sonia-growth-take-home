"use client";

import { useEffect, useState } from "react";

type Post = {
  id: string;
  subreddit: string;
  title: string;
  content: string;
  author: string;
  upvotes: number;
  relevance_score: number | null;
  safety_flag: string | null;
  comment_id: number | null;
  comment_text: string | null;
  comment_edited_text: string | null;
  comment_status: "pending" | "approved" | "rejected" | null;
};

type ProcessResult = {
  postsProcessed: number;
  commentsGenerated: number;
  postsFlagged: number;
};

type StreamChunk = {
  post_id: string;
  relevance_score: number | null;
  safety_flag: string | null;
  generated_comment: string | null;
  comment_id: number | null;
  status: "processing" | "scored" | "flagged" | "pending" | "low_relevance";
};

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function RelevanceBadge({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">
        Unscored
      </span>
    );
  }
  const color =
    score >= 7
      ? "bg-green-100 text-green-700"
      : score >= 4
      ? "bg-yellow-100 text-yellow-700"
      : "bg-gray-100 text-gray-500";
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${color}`}>
      Relevance {score}
    </span>
  );
}

function PostCard({
  post,
  isProcessing,
  canProcess,
  onRefresh,
  onProcess,
  onOpen,
}: {
  post: Post;
  isProcessing: boolean;
  canProcess: boolean;
  onRefresh: () => void;
  onProcess: (postId: string) => void;
  onOpen: (post: Post) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(false);

  const displayComment = post.comment_edited_text ?? post.comment_text ?? "";
  const canProcessThisPost =
    post.relevance_score === null && post.safety_flag === null && post.comment_id === null;

  async function handleCommentAction(action: "approve" | "reject" | "edit", text?: string) {
    if (!post.comment_id) return;
    setLoading(true);
    await fetch(`/api/comments/${post.comment_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, text }),
    });
    setLoading(false);
    setEditing(false);
    onRefresh();
  }

  async function handleDismiss() {
    setLoading(true);
    await fetch(`/api/posts/${post.id}`, { method: "PATCH" });
    setLoading(false);
    onRefresh();
  }

  return (
    <div
      onClick={() => onOpen(post)}
      className={`rounded-lg border bg-white p-4 flex flex-col gap-3 transition-all duration-300 ${
        isProcessing
          ? "border-indigo-300 shadow-md shadow-indigo-100 ring-1 ring-indigo-200"
          : "border-gray-200"
      } cursor-pointer`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
            {post.subreddit}
          </span>
          <h3 className="text-sm font-semibold text-gray-900 leading-snug">{post.title}</h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(post);
            }}
            className="rounded px-2 py-0.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Expand post"
            title="Expand"
          >
            Expand
          </button>
          {isProcessing && <Spinner />}
          <RelevanceBadge score={post.relevance_score} />
        </div>
      </div>

      {/* Content */}
      <p className="text-xs text-gray-500 leading-relaxed">
        {post.content.length > 150 ? post.content.slice(0, 150) + "…" : post.content}
      </p>

      {/* Upvotes */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-gray-400">▲ {post.upvotes} upvotes</div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onProcess(post.id);
          }}
          disabled={!canProcess || !canProcessThisPost || loading}
          className="rounded px-3 py-1 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Process This Post
        </button>
      </div>

      {/* State-specific section */}
      <div onClick={(e) => e.stopPropagation()}>
        {isProcessing ? (
        <div className="rounded bg-indigo-50 px-3 py-2 flex items-center gap-2">
          <Spinner />
          <span className="text-xs text-indigo-500">Processing with AI…</span>
        </div>
      ) : post.safety_flag ? (
        <div className="rounded bg-red-50 border border-red-200 p-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-red-700 mb-0.5">Safety Flag</p>
            <p className="text-xs text-red-600">{post.safety_flag}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            disabled={loading}
            className="shrink-0 rounded px-2 py-1 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
          >
            Dismiss
          </button>
        </div>
      ) : post.comment_id === null ? (
        <div className="rounded bg-gray-50 px-3 py-2">
          <span className="text-xs text-gray-400">Not yet processed</span>
        </div>
      ) : post.comment_status === "approved" ? (
        <div className="rounded bg-green-50 border border-green-200 p-3">
          <p className="text-xs font-semibold text-green-700 mb-1">Approved comment</p>
          <p className="text-xs text-gray-700">{displayComment}</p>
        </div>
      ) : post.comment_status === "rejected" ? (
        <div className="rounded bg-gray-50 border border-gray-200 p-3">
          <p className="text-xs font-semibold text-gray-500">Comment rejected</p>
        </div>
      ) : (
        /* pending */
        <div className="flex flex-col gap-2">
          {editing ? (
            <>
              <textarea
                className="w-full rounded border border-gray-300 p-2 text-xs text-gray-800 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
                rows={4}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleCommentAction("edit", editText)}
                  disabled={loading || !editText.trim()}
                  className="rounded px-3 py-1 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Save & Approve
                </button>
                <button
                  onClick={() => setEditing(false)}
                  disabled={loading}
                  className="rounded px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded bg-gray-50 border border-gray-200 p-3">
                <p className="text-xs font-semibold text-gray-500 mb-1">Generated comment</p>
                <p className="text-xs text-gray-700">{displayComment}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCommentAction("approve");
                  }}
                  disabled={loading}
                  className="rounded px-3 py-1 text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditText(displayComment);
                    setEditing(true);
                  }}
                  disabled={loading}
                  className="rounded px-3 py-1 text-xs font-medium bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCommentAction("reject");
                  }}
                  disabled={loading}
                  className="rounded px-3 py-1 text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [fetching, setFetching] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingPostId, setProcessingPostId] = useState<string | null>(null);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [resetting, setResetting] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  async function fetchPosts() {
    setFetching(true);
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data.posts ?? []);
    setFetching(false);
  }

  useEffect(() => {
    async function load() {
      await fetchPosts();
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processStream = async (postId?: string) => {
    setProcessing(true);
    setProcessResult(null);

    const response = await fetch("/api/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postId ? { post_id: postId } : {}),
    });
    if (!response.body) {
      setProcessing(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let postsProcessed = 0;
    let commentsGenerated = 0;
    let postsFlagged = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const eventText of events) {
        const lines = eventText.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6)) as StreamChunk | { done: true };

              if ("done" in data && data.done) {
                setProcessResult({ postsProcessed, commentsGenerated, postsFlagged });
                setProcessing(false);
                setProcessingPostId(null);
                return;
              }

              if (data.status === "processing") {
                setProcessingPostId(data.post_id);
                continue;
              }

              postsProcessed++;
              if (data.status === "flagged") postsFlagged++;
              if (data.status === "pending") commentsGenerated++;

              setPosts((prev) =>
                prev.map((p) =>
                  p.id === data.post_id
                    ? {
                        ...p,
                        relevance_score: data.relevance_score,
                        safety_flag: data.safety_flag,
                        comment_id: data.comment_id,
                        comment_text: data.generated_comment,
                        comment_edited_text: null,
                        comment_status: data.generated_comment ? "pending" : null,
                      }
                    : p
                )
              );
            } catch {
              // skip malformed chunks
            }
          }
        }
      }
    }

    setProcessResult({ postsProcessed, commentsGenerated, postsFlagged });
    setProcessing(false);
    setProcessingPostId(null);
  };

  const handleProcess = async () => {
    await processStream();
  };

  const handleProcessSingle = async (postId: string) => {
    await processStream(postId);
  };

  async function handleReset() {
    setResetting(true);
    setProcessResult(null);
    await fetch("/api/reset", { method: "POST" });
    setResetting(false);
    fetchPosts();
  }

  const stats = {
    total: posts.length,
    pending: posts.filter((p) => p.comment_status === "pending").length,
    approved: posts.filter((p) => p.comment_status === "approved").length,
    rejected: posts.filter((p) => p.comment_status === "rejected").length,
    flagged: posts.filter((p) => p.safety_flag !== null).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sonia Growth Tool</h1>
            <p className="text-sm text-gray-500">Comment Assist System</p>
          </div>
          <div className="flex items-center gap-3">
            {processResult && (
              <p className="text-xs text-gray-500">
                {processResult.postsProcessed} processed · {processResult.commentsGenerated} comments · {processResult.postsFlagged} flagged
              </p>
            )}
            <button
              onClick={handleReset}
              disabled={resetting || processing}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {resetting && <Spinner />}
              {resetting ? "Resetting…" : "Reset Database"}
            </button>
            <button
              onClick={handleProcess}
              disabled={processing || resetting}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {processing && <Spinner />}
              {processing ? "Processing…" : "Process Posts with AI"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-6">
        {/* Stats bar */}
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: "Total Posts", value: stats.total, color: "text-gray-900" },
            { label: "Pending Review", value: stats.pending, color: "text-yellow-600" },
            { label: "Approved", value: stats.approved, color: "text-green-600" },
            { label: "Rejected", value: stats.rejected, color: "text-red-600" },
            { label: "Flagged", value: stats.flagged, color: "text-orange-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Post grid */}
        {fetching ? (
          <div className="text-center py-16 text-sm text-gray-400">Loading posts…</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400">
            No posts found. Hit{" "}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">GET /api/seed</code> first.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isProcessing={processingPostId === post.id}
                canProcess={!processing && !resetting}
                onRefresh={fetchPosts}
                onProcess={handleProcessSingle}
                onOpen={setSelectedPost}
              />
            ))}
          </div>
        )}
      </main>
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  {selectedPost.subreddit}
                </p>
                <h2 className="text-lg font-semibold text-gray-900">{selectedPost.title}</h2>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
            <p className="mb-4 whitespace-pre-wrap text-sm text-gray-700">{selectedPost.content}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">▲ {selectedPost.upvotes} upvotes</span>
              <button
                onClick={() => {
                  handleProcessSingle(selectedPost.id);
                  setSelectedPost(null);
                }}
                disabled={processing || resetting}
                className="rounded px-3 py-1 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Process This Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
