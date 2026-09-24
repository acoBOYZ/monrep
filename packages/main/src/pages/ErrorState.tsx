import { RotateCcw } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, CopyableButton } from "@monrep/ui/base";
import type { ComponentProps } from "react";
import type { ErrorRouteComponent } from "@tanstack/react-router";

const UNKNOWN_MESSAGE = "An unknown error occurred.";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function getErrorDetails(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.stack || error.message || fallback;
  }

  try {
    return JSON.stringify(error, null, 2) || fallback;
  } catch {
    return String(error);
  }
}

export function ErrorState({ error, reset }: ComponentProps<ErrorRouteComponent>) {
  const message = getErrorMessage(error, UNKNOWN_MESSAGE);
  const details = getErrorDetails(error, UNKNOWN_MESSAGE);

  return (
    <section
      className="flex h-[80svh] min-h-0 w-full items-center justify-center px-4 py-10 sm:px-6"
      role="alert"
      aria-live="assertive"
    >
      <div className="relative max-w-300">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="mt-1 text-sm text-cool">We ran into an issue while loading this page.</p>
        <span className="flex items-center gap-3">
          <p className="text-sm font-medium">Error message:</p>
          <p className="mt-1 text-sm text-rose-500">{message}</p>
        </span>
        <CopyableButton text={details} className="top-2 h-fit" />
        <pre className="mt-3 max-h-56 max-w-xs overflow-auto rounded-lg bg-muted/25 p-3 text-xs leading-relaxed wrap-break-word whitespace-pre-wrap md:max-w-md">
          {details}
        </pre>
        <Button
          variant="link"
          size="sm"
          onClick={reset}
          className="mt-3 inline-flex text-sm text-blue-500 hover:underline"
        >
          <HugeiconsIcon icon={RotateCcw} size={16} aria-hidden />
          Try again
        </Button>
      </div>
    </section>
  );
}
