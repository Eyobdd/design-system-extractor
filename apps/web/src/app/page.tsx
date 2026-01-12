export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-6xl">
          Design System Extractor
        </h1>
        <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
          Extract design tokens and components from any website using AI-powered analysis
        </p>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-gray-500">URL input coming soon...</p>
        </div>
      </div>
    </div>
  );
}
