"use client";

import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Application error captured", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-8">
      <h1 className="text-5xl font-bold text-slate-900">Coś poszło nie tak</h1>
      <p className="mt-4 text-base text-slate-600">Spróbuj odświeżyć lub wrócić na stronę główną.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
      >
        Spróbuj ponownie
      </button>
    </div>
  );
}
