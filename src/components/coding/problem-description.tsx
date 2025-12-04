"use client";

import { AlertCircle, FileText, History } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCoding } from "@/contexts/CodingContext";

export default function ProblemDescription() {
  const { state, dispatch } = useCoding();
  const question = state.currentQuestion;

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
        <p>No problem selected</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background">
      <Tabs
        value={state.activeTab}
        onValueChange={(v) =>
          dispatch({
            type: "SET_ACTIVE_TAB",
            payload: v as "description" | "submissions",
          })
        }
        className="flex flex-col h-full"
      >
        <div className="flex items-center px-3 py-2 border-b bg-muted/30">
          <TabsList className="h-8">
            <TabsTrigger value="description" className="text-xs px-3 gap-1">
              <FileText className="h-3 w-3" />
              Description
            </TabsTrigger>
            <TabsTrigger value="submissions" className="text-xs px-3 gap-1">
              <History className="h-3 w-3" />
              Submissions
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Description Tab */}
        <TabsContent value="description" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {/* Title */}
              <div>
                <h1 className="text-xl font-bold">{question.title}</h1>
              </div>

              {/* Description */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div
                  dangerouslySetInnerHTML={{ __html: question.description }}
                />
              </div>

              {/* Examples */}
              {question.examples && question.examples.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Examples</h3>
                  {question.examples.map((example, idx) => (
                    <div
                      key={`example-${idx}-${example.input}`}
                      className="p-4 rounded-lg bg-muted/30 space-y-2"
                    >
                      <div className="font-medium text-sm">
                        Example {idx + 1}:
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Input: </span>
                          <code className="bg-muted px-1.5 py-0.5 rounded text-sm">
                            {example.input}
                          </code>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">
                            Output:{" "}
                          </span>
                          <code className="bg-muted px-1.5 py-0.5 rounded text-sm">
                            {example.output}
                          </code>
                        </div>
                        {example.explanation && (
                          <div className="text-sm text-muted-foreground mt-2">
                            <span className="font-medium">Explanation: </span>
                            {example.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Constraints */}
              {question.constraints && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Constraints</h3>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <pre className="text-sm whitespace-pre-wrap">
                      {question.constraints}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="text-center text-muted-foreground py-8">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No submissions yet</p>
                <p className="text-sm">Submit your solution to see history</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
