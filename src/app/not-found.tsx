
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <h1 className="text-6xl font-bold text-blue-600">404</h1>

      <h2 className="mt-4 text-2xl font-semibold text-gray-900">
        Page Not Found
      </h2>

      <p className="mt-3 text-gray-500">
        The page you are looking for does not exist.
      </p>

      <Link
        href="/"
        className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
      >
        Back to Dashboard
      </Link>
    </main>
  );
}
