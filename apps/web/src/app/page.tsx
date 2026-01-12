import { UrlInput } from '@/components/url-input';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="flex w-full max-w-2xl flex-col items-center text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-6xl">
          Design System Extractor
        </h1>
        <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
          Extract design tokens and components from any website using AI-powered analysis
        </p>
        <UrlInput />
        <p className="mt-6 text-sm text-gray-500">
          Enter any website URL to extract its design system including colors, typography, spacing,
          and component patterns.
        </p>
      </div>
    </div>
  );
}
