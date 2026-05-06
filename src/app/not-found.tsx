import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-cherry-50 flex items-center justify-center mb-6">
        <span className="text-4xl">🍽️</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">
        The page you&apos;re looking for doesn&apos;t exist or the restaurant may have been removed.
      </p>
      <Link href="/"
        className="inline-flex items-center gap-2 bg-cherry-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-cherry-700 transition-colors">
        Back to Home
      </Link>
    </div>
  );
}
