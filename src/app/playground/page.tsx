"use client";

import {
  CheckCircle,
  FileCode,
  Loader2,
  Minus,
  Play,
  Plus,
  RotateCcw,
  Send,
  Terminal,
  XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDefaultStarterCode, supportedLanguages } from "@/lib/starter-code";
import { cn } from "@/lib/utils";

// Sample problem for demo
const sampleProblem = {
  title: "Two Sum",
  description: `<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return <em>indices of the two numbers such that they add up to <code>target</code></em>.</p>
<p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.</p>
<p>You can return the answer in any order.</p>`,
  examples: [
    {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
    {
      input: "nums = [3,2,4], target = 6",
      output: "[1,2]",
    },
    {
      input: "nums = [3,3], target = 6",
      output: "[0,1]",
    },
  ],
  constraints: `• 2 <= nums.length <= 10^4
• -10^9 <= nums[i] <= 10^9
• -10^9 <= target <= 10^9
• Only one valid answer exists.`,
  testCases: [
    { id: 1, input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" },
    { id: 2, input: "[3,2,4]\n6", expectedOutput: "[1,2]" },
    { id: 3, input: "[3,3]\n6", expectedOutput: "[0,1]" },
  ],
};

export default function PlaygroundPage() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(getDefaultStarterCode("python"));
  const [fontSize, setFontSize] = useState(14);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"testcase" | "result">("testcase");
  const [_customInput, _setCustomInput] = useState("");
  const [output, setOutput] = useState<{
    status: "idle" | "success" | "error";
    message?: string;
    results?: Array<{
      id: number;
      passed: boolean;
      input: string;
      expected: string;
      actual: string;
      time?: number;
    }>;
  }>({ status: "idle" });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setCode(getDefaultStarterCode(lang));
  };

  const handleResetCode = () => {
    setCode(getDefaultStarterCode(language));
    setOutput({ status: "idle" });
  };

  const adjustFontSize = (delta: number) => {
    setFontSize((prev) => Math.max(10, Math.min(24, prev + delta)));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = `${code.substring(0, start)}    ${code.substring(end)}`;
      setCode(newValue);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 4;
          textareaRef.current.selectionEnd = start + 4;
        }
      });
    }
  };

  const getFileExtension = (lang: string) => {
    const extensions: Record<string, string> = {
      python: ".py",
      java: ".java",
      cpp: ".cpp",
      c: ".c",
      javascript: ".js",
      go: ".go",
    };
    return extensions[lang] || ".txt";
  };

  const handleRun = async () => {
    setIsRunning(true);
    setActiveTab("result");

    // Simulate execution
    await new Promise((r) => setTimeout(r, 1500));

    setOutput({
      status: "success",
      message: "Executed successfully",
      results: sampleProblem.testCases.map((tc) => ({
        id: tc.id,
        passed: Math.random() > 0.3,
        input: tc.input,
        expected: tc.expectedOutput,
        actual: Math.random() > 0.3 ? tc.expectedOutput : "[0,2]",
        time: Math.floor(50 + Math.random() * 100),
      })),
    });

    setIsRunning(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setActiveTab("result");

    // Simulate submission
    await new Promise((r) => setTimeout(r, 2000));

    const results = sampleProblem.testCases.map((tc) => ({
      id: tc.id,
      passed: true,
      input: tc.input,
      expected: tc.expectedOutput,
      actual: tc.expectedOutput,
      time: Math.floor(30 + Math.random() * 50),
    }));

    setOutput({
      status: "success",
      message: "All test cases passed!",
      results,
    });

    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Code Playground</h1>
          <span className="text-sm text-muted-foreground">
            {sampleProblem.title}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">Demo Mode</div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - Problem Description */}
          <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
            <div className="h-full p-2">
              <div className="h-full border rounded-lg overflow-hidden bg-background">
                <div className="px-4 py-2 border-b bg-muted/30">
                  <span className="text-sm font-medium">Description</span>
                </div>
                <ScrollArea className="h-[calc(100%-40px)]">
                  <div className="p-4 space-y-6">
                    <h2 className="text-xl font-bold">{sampleProblem.title}</h2>

                    <div
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: sampleProblem.description,
                      }}
                    />

                    <div className="space-y-4">
                      <h3 className="font-semibold">Examples</h3>
                      {sampleProblem.examples.map((ex, idx) => (
                        <div
                          key={`example-${idx}-${ex.input}`}
                          className="p-4 rounded-lg bg-muted/30 space-y-2"
                        >
                          <div className="font-medium text-sm">
                            Example {idx + 1}:
                          </div>
                          <div className="text-sm space-y-1">
                            <div>
                              <span className="text-muted-foreground">
                                Input:{" "}
                              </span>
                              <code className="bg-muted px-1.5 py-0.5 rounded">
                                {ex.input}
                              </code>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Output:{" "}
                              </span>
                              <code className="bg-muted px-1.5 py-0.5 rounded">
                                {ex.output}
                              </code>
                            </div>
                            {ex.explanation && (
                              <div className="text-muted-foreground mt-2">
                                <span className="font-medium">
                                  Explanation:{" "}
                                </span>
                                {ex.explanation}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold">Constraints</h3>
                      <pre className="p-4 rounded-lg bg-muted/30 text-sm whitespace-pre-wrap">
                        {sampleProblem.constraints}
                      </pre>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Editor and Console */}
          <ResizablePanel defaultSize={65}>
            <ResizablePanelGroup direction="vertical">
              {/* Code Editor */}
              <ResizablePanel defaultSize={60} minSize={30}>
                <div className="h-full p-2 pb-0">
                  <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background">
                    {/* Editor Header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileCode className="h-4 w-4" />
                          <span>main{getFileExtension(language)}</span>
                        </div>
                        <Select
                          value={language}
                          onValueChange={handleLanguageChange}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue placeholder="Language" />
                          </SelectTrigger>
                          <SelectContent>
                            {supportedLanguages.map((lang) => (
                              <SelectItem key={lang.id} value={lang.id}>
                                {lang.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => adjustFontSize(-2)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-xs text-muted-foreground w-8 text-center">
                          {fontSize}px
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => adjustFontSize(2)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={handleResetCode}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Code Area */}
                    <div className="flex-1 relative">
                      <div className="absolute inset-0 flex">
                        <div
                          className="flex-shrink-0 bg-muted/20 text-muted-foreground text-right pr-3 pl-3 py-3 select-none border-r overflow-hidden"
                          style={{
                            fontSize: `${fontSize}px`,
                            fontFamily:
                              '"JetBrains Mono", "Fira Code", "Consolas", monospace',
                            lineHeight: "1.5",
                          }}
                        >
                          {code.split("\n").map((_, i) => (
                            <div key={`line-${i}`}>{i + 1}</div>
                          ))}
                        </div>
                        <textarea
                          ref={textareaRef}
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="flex-1 resize-none p-3 bg-background focus:outline-none overflow-auto"
                          style={{
                            fontSize: `${fontSize}px`,
                            fontFamily:
                              '"JetBrains Mono", "Fira Code", "Consolas", monospace',
                            lineHeight: "1.5",
                            tabSize: 4,
                          }}
                          spellCheck={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Console */}
              <ResizablePanel defaultSize={40} minSize={20}>
                <div className="h-full p-2 pt-0">
                  <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background">
                    <Tabs
                      value={activeTab}
                      onValueChange={(v) =>
                        setActiveTab(v as "testcase" | "result")
                      }
                      className="flex flex-col h-full"
                    >
                      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                        <TabsList className="h-8">
                          <TabsTrigger
                            value="testcase"
                            className="text-xs px-3"
                          >
                            Test Cases
                          </TabsTrigger>
                          <TabsTrigger value="result" className="text-xs px-3">
                            Result
                          </TabsTrigger>
                        </TabsList>
                        {(isRunning || isSubmitting) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {isRunning ? "Running..." : "Submitting..."}
                          </div>
                        )}
                      </div>

                      <TabsContent
                        value="testcase"
                        className="flex-1 m-0 overflow-hidden"
                      >
                        <ScrollArea className="h-full">
                          <div className="p-3 space-y-3">
                            {sampleProblem.testCases.map((tc, idx) => (
                              <div
                                key={tc.id}
                                className="p-3 rounded-lg border bg-muted/20 space-y-2"
                              >
                                <span className="text-sm font-medium">
                                  Test Case {idx + 1}
                                </span>
                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground">
                                    Input:
                                  </span>
                                  <pre className="text-sm font-mono bg-muted/50 p-2 rounded">
                                    {tc.input}
                                  </pre>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground">
                                    Expected:
                                  </span>
                                  <pre className="text-sm font-mono bg-muted/50 p-2 rounded">
                                    {tc.expectedOutput}
                                  </pre>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent
                        value="result"
                        className="flex-1 m-0 overflow-hidden"
                      >
                        <ScrollArea className="h-full">
                          <div className="p-3 space-y-3">
                            {output.status === "idle" ? (
                              <div className="text-center text-muted-foreground py-8">
                                <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Run your code to see results</p>
                              </div>
                            ) : (
                              <>
                                <div
                                  className={cn(
                                    "flex items-center gap-2 p-3 rounded-lg",
                                    output.status === "success"
                                      ? "bg-green-500/10 text-green-600"
                                      : "bg-red-500/10 text-red-600",
                                  )}
                                >
                                  {output.status === "success" ? (
                                    <CheckCircle className="h-5 w-5" />
                                  ) : (
                                    <XCircle className="h-5 w-5" />
                                  )}
                                  <span className="font-medium">
                                    {output.message}
                                  </span>
                                </div>

                                {output.results?.map((r, idx) => (
                                  <div
                                    key={r.id}
                                    className={cn(
                                      "p-3 rounded-lg border",
                                      r.passed
                                        ? "bg-green-500/5 border-green-500/20"
                                        : "bg-red-500/5 border-red-500/20",
                                    )}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-sm">
                                        Test Case {idx + 1}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                          {r.time}ms
                                        </span>
                                        {r.passed ? (
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <XCircle className="h-4 w-4 text-red-600" />
                                        )}
                                      </div>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">
                                          Expected:{" "}
                                        </span>
                                        <code className="bg-muted px-1 rounded">
                                          {r.expected}
                                        </code>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">
                                          Output:{" "}
                                        </span>
                                        <code
                                          className={cn(
                                            "px-1 rounded",
                                            r.passed
                                              ? "bg-muted"
                                              : "bg-red-500/10",
                                          )}
                                        >
                                          {r.actual}
                                        </code>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30">
        <div className="text-sm text-muted-foreground">
          Press Tab for indentation
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
            className="gap-2"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
