"use client";

import { CheckCircle, Clock, Terminal, XCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCoding } from "@/contexts/CodingContext";
import { cn } from "@/lib/utils";

export default function ConsolePane() {
  const { state, dispatch } = useCoding();
  const consoleRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new output appears
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, []);

  const handleCustomInputChange = (value: string) => {
    dispatch({ type: "SET_CUSTOM_INPUT", payload: value });
  };

  const handleUpdateTestCaseInput = (id: number, value: string) => {
    dispatch({
      type: "UPDATE_TEST_CASE",
      payload: { id, updates: { input: value } },
    });
  };

  const visibleTestCases = state.testCases.filter((tc) => tc.isVisible);
  const testResults = state.executionResult?.testResults || [];

  // Format output with proper line breaks
  const formatOutput = (text?: string) => {
    if (!text) return "";
    return text.trim();
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background">
      <Tabs
        value={state.consoleTab}
        onValueChange={(v) =>
          dispatch({
            type: "SET_CONSOLE_TAB",
            payload: v as "testcase" | "result",
          })
        }
        className="flex flex-col h-full"
      >
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
          <TabsList className="h-8">
            <TabsTrigger value="testcase" className="text-xs px-3">
              Test Cases
            </TabsTrigger>
            <TabsTrigger value="result" className="text-xs px-3">
              Result
            </TabsTrigger>
          </TabsList>

          {state.isRunning && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
              Running...
            </div>
          )}
        </div>

        {/* Test Cases Tab */}
        <TabsContent value="testcase" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              {visibleTestCases.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No test cases available</p>
                </div>
              ) : (
                visibleTestCases.map((testCase, idx) => (
                  <div
                    key={testCase.id}
                    className="space-y-2 p-3 rounded-lg border bg-muted/20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Test Case {idx + 1}
                      </span>
                      {testCase.passed !== undefined && (
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            testCase.passed
                              ? "bg-green-500/20 text-green-600"
                              : "bg-red-500/20 text-red-600",
                          )}
                        >
                          {testCase.passed ? "Passed" : "Failed"}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">
                        Input:
                      </span>
                      <Textarea
                        value={testCase.input}
                        onChange={(e) =>
                          handleUpdateTestCaseInput(testCase.id, e.target.value)
                        }
                        className="font-mono text-sm min-h-[60px] resize-none"
                        placeholder="Enter input..."
                      />
                    </div>
                    {testCase.expectedOutput && (
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">
                          Expected Output:
                        </span>
                        <pre className="text-sm font-mono bg-muted/50 p-2 rounded overflow-x-auto">
                          {testCase.expectedOutput}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Custom Input Section */}
              <div className="space-y-2 p-3 rounded-lg border bg-muted/20">
                <span className="text-sm font-medium">Custom Input</span>
                <Textarea
                  value={state.customInput}
                  onChange={(e) => handleCustomInputChange(e.target.value)}
                  className="font-mono text-sm min-h-[80px] resize-none"
                  placeholder="Enter custom input for testing..."
                />
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Result Tab */}
        <TabsContent value="result" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full" ref={consoleRef}>
            <div className="p-3 space-y-4">
              {!state.executionResult ? (
                <div className="text-center text-muted-foreground py-8">
                  <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Run your code to see results</p>
                </div>
              ) : (
                <>
                  {/* Overall Status */}
                  <div
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg",
                      state.executionResult.status === "success"
                        ? "bg-green-500/10 text-green-600"
                        : state.executionResult.status === "error" ||
                            state.executionResult.status === "compile_error"
                          ? "bg-red-500/10 text-red-600"
                          : "bg-muted",
                    )}
                  >
                    {state.executionResult.status === "success" ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : state.executionResult.status === "running" ? (
                      <Clock className="h-5 w-5 animate-spin" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                    <span className="font-medium capitalize">
                      {state.executionResult.status === "compile_error"
                        ? "Compilation Error"
                        : state.executionResult.status}
                    </span>
                    {state.executionResult.executionTime && (
                      <span className="ml-auto text-sm text-muted-foreground">
                        {state.executionResult.executionTime}ms
                      </span>
                    )}
                  </div>

                  {/* Error Message */}
                  {state.executionResult.error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <pre className="text-sm font-mono text-red-600 whitespace-pre-wrap">
                        {state.executionResult.error}
                      </pre>
                    </div>
                  )}

                  {/* Output */}
                  {state.executionResult.output && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Output:</span>
                      <pre className="p-3 rounded-lg bg-muted/50 font-mono text-sm whitespace-pre-wrap overflow-x-auto">
                        {formatOutput(state.executionResult.output)}
                      </pre>
                    </div>
                  )}

                  {/* Test Results */}
                  {testResults.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Test Results:
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {testResults.filter((t) => t.passed).length}/
                          {testResults.length} passed
                        </span>
                      </div>

                      {testResults.map((result, idx) => (
                        <div
                          key={result.id}
                          className={cn(
                            "p-3 rounded-lg border",
                            result.passed
                              ? "bg-green-500/5 border-green-500/20"
                              : "bg-red-500/5 border-red-500/20",
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">
                              Test Case {idx + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              {result.executionTime && (
                                <span className="text-xs text-muted-foreground">
                                  {result.executionTime}ms
                                </span>
                              )}
                              {result.passed ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Input:{" "}
                              </span>
                              <code className="bg-muted px-1 rounded">
                                {result.input}
                              </code>
                            </div>
                            {result.expectedOutput && (
                              <div>
                                <span className="text-muted-foreground">
                                  Expected:{" "}
                                </span>
                                <code className="bg-muted px-1 rounded">
                                  {result.expectedOutput}
                                </code>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">
                                Output:{" "}
                              </span>
                              <code
                                className={cn(
                                  "px-1 rounded",
                                  result.passed ? "bg-muted" : "bg-red-500/10",
                                )}
                              >
                                {result.actualOutput || "(no output)"}
                              </code>
                            </div>
                            {result.error && (
                              <div className="text-red-600">
                                <span className="text-muted-foreground">
                                  Error:{" "}
                                </span>
                                {result.error}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
