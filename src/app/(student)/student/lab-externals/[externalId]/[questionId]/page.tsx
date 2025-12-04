"use client";

import { ArrowLeft, Clock, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import ActionBar from "@/components/coding/action-bar";
import CodeEditor from "@/components/coding/code-editor";
import ConsolePane from "@/components/coding/console-pane";
import ProblemDescription from "@/components/coding/problem-description";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  CodingProvider,
  type Question,
  useCoding,
} from "@/contexts/CodingContext";

function CodingInterface() {
  const params = useParams();
  const router = useRouter();
  const { state, dispatch } = useCoding();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [externalInfo, setExternalInfo] = useState<{
    title: string;
    duration: number;
    schedule: Date;
  } | null>(null);

  const externalId = params.externalId as string;
  const questionId = params.questionId as string;

  // Load question data
  useEffect(() => {
    const loadQuestion = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch external details with questions
        const response = await fetch(`/api/lab/externals/${externalId}`);
        if (!response.ok) {
          throw new Error("Failed to load exam");
        }

        const external = await response.json();
        setExternalInfo({
          title: external.subject?.title || "Lab External",
          duration: external.duration,
          schedule: new Date(external.schedule),
        });

        // Find the specific question
        const externalQuestion = external.questions?.find(
          (eq: { questionId: string }) => eq.questionId === questionId,
        );

        if (!externalQuestion) {
          throw new Error("Question not found");
        }

        const question = externalQuestion.question;

        // Transform to expected format
        const formattedQuestion: Question = {
          id: question.id,
          title: question.title,
          description: question.description,
          examples:
            (question.examples as {
              input: string;
              output: string;
              explanation?: string;
            }[]) || [],
          constraints: question.constraints || undefined,
          testCases: (
            (question.testCases as {
              input?: string;
              expected?: string;
              output?: string;
              hidden?: boolean;
            }[]) || []
          ).map((tc, idx: number) => ({
            id: idx + 1,
            input: tc.input || "",
            expectedOutput: tc.expected || tc.output || "",
            isVisible: !tc.hidden,
          })),
        };

        dispatch({ type: "SET_QUESTION", payload: formattedQuestion });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load question",
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (externalId && questionId) {
      loadQuestion();
    }
  }, [externalId, questionId, dispatch]);

  // Run code
  const handleRun = useCallback(async () => {
    if (!state.code.trim()) {
      toast.error("Please write some code first");
      return;
    }

    dispatch({ type: "SET_RUNNING", payload: true });
    dispatch({ type: "SET_EXECUTION_RESULT", payload: null });

    try {
      const response = await fetch("/api/lab/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: state.code,
          language: state.language,
          input: state.customInput,
          testCases: state.testCases.filter((tc) => tc.isVisible),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Execution failed");
      }

      dispatch({
        type: "SET_EXECUTION_RESULT",
        payload: {
          status: result.status,
          output: result.output,
          error: result.error,
          testResults: result.testResults,
          executionTime: result.executionTime,
        },
      });

      dispatch({ type: "SET_CONSOLE_TAB", payload: "result" });
    } catch (err) {
      dispatch({
        type: "SET_EXECUTION_RESULT",
        payload: {
          status: "error",
          error: err instanceof Error ? err.message : "Execution failed",
        },
      });
      toast.error("Execution failed");
    } finally {
      dispatch({ type: "SET_RUNNING", payload: false });
    }
  }, [
    state.code,
    state.language,
    state.customInput,
    state.testCases,
    dispatch,
  ]);

  // Submit solution
  const handleSubmit = useCallback(async () => {
    if (!state.code.trim()) {
      toast.error("Please write some code first");
      return;
    }

    dispatch({ type: "SET_SUBMITTING", payload: true });

    try {
      const response = await fetch("/api/lab/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalId,
          questionId,
          code: state.code,
          language: state.language,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Submission failed");
      }

      dispatch({
        type: "SET_EXECUTION_RESULT",
        payload: {
          status: result.submission.status === "accepted" ? "success" : "error",
          testResults: result.testResults,
          executionTime: 0,
        },
      });

      dispatch({ type: "SET_CONSOLE_TAB", payload: "result" });

      if (result.submission.status === "accepted") {
        toast.success(
          `Accepted! Score: ${result.submission.score} (${result.submission.testsPassed}/${result.submission.totalTests} tests passed)`,
        );
      } else {
        toast.warning(
          `${result.submission.testsPassed}/${result.submission.totalTests} tests passed`,
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      dispatch({ type: "SET_SUBMITTING", payload: false });
    }
  }, [externalId, questionId, state.code, state.language, dispatch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading question...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="font-semibold">{externalInfo?.title}</h1>
            <p className="text-sm text-muted-foreground">
              {state.currentQuestion?.title}
            </p>
          </div>
        </div>

        {externalInfo && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{externalInfo.duration} minutes</span>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - Problem Description */}
          <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
            <div className="h-full p-2">
              <ProblemDescription />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Editor and Console */}
          <ResizablePanel defaultSize={65}>
            <ResizablePanelGroup direction="vertical">
              {/* Code Editor */}
              <ResizablePanel defaultSize={60} minSize={30}>
                <div className="h-full p-2 pb-0">
                  <CodeEditor />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Console */}
              <ResizablePanel defaultSize={40} minSize={20}>
                <div className="h-full p-2 pt-0">
                  <ConsolePane />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Action Bar */}
      <ActionBar onRun={handleRun} onSubmit={handleSubmit} />
    </div>
  );
}

export default function CodingPage() {
  return (
    <CodingProvider>
      <CodingInterface />
    </CodingProvider>
  );
}
