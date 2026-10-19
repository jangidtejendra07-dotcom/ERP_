"use client";

// Koi bhi page crash ho to blank screen nahi, message + Retry dikhe
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-sm">
      <h2 className="mb-1 text-base font-semibold text-red-700">Kuch galat ho gaya</h2>
      <p className="mb-4 text-red-600">{error.message || "Unexpected error"}</p>
      <button onClick={reset} className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700">Retry</button>
    </div>
  );
}