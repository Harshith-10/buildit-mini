"use client";

import { Loader2, Play, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCoding } from "@/contexts/CodingContext";

interface ActionBarProps {
  onRun: () => void;
  onSubmit: () => void;
}

export default function ActionBar({ onRun, onSubmit }: ActionBarProps) {
  const { state } = useCoding();

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {state.isRunning && (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Running...</span>
          </>
        )}
        {state.isSubmitting && (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Submitting...</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRun}
          disabled={state.isRunning || state.isSubmitting}
          className="gap-2"
        >
          {state.isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Run
        </Button>

        <Button
          size="sm"
          onClick={onSubmit}
          disabled={state.isRunning || state.isSubmitting}
          className="gap-2"
        >
          {state.isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Submit
        </Button>
      </div>
    </div>
  );
}
