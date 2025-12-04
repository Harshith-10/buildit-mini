"use client";

import { FileCode, Minus, Plus, RotateCcw } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCoding } from "@/contexts/CodingContext";
import { supportedLanguages } from "@/lib/starter-code";

export default function CodeEditor() {
  const { state, dispatch } = useCoding();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: "SET_CODE", payload: e.target.value });
  };

  const handleLanguageChange = (language: string) => {
    dispatch({ type: "SET_LANGUAGE", payload: language });
  };

  const handleResetCode = () => {
    dispatch({ type: "RESET_CODE" });
  };

  const adjustFontSize = (delta: number) => {
    const newSize = Math.max(10, Math.min(24, state.fontSize + delta));
    dispatch({ type: "SET_FONT_SIZE", payload: newSize });
  };

  // Handle Tab key for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      // Insert 4 spaces for tab
      const newValue = `${value.substring(0, start)}    ${value.substring(end)}`;
      dispatch({ type: "SET_CODE", payload: newValue });

      // Move cursor after the inserted spaces
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 4;
          textareaRef.current.selectionEnd = start + 4;
        }
      });
    }
  };

  // Get file extension for display
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

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileCode className="h-4 w-4" />
            <span>main{getFileExtension(state.language)}</span>
          </div>
          <Select value={state.language} onValueChange={handleLanguageChange}>
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
            title="Decrease font size"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-xs text-muted-foreground w-8 text-center">
            {state.fontSize}px
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => adjustFontSize(2)}
            title="Increase font size"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleResetCode}
            title="Reset code"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Code Editor Area */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 flex">
          {/* Line Numbers */}
          <div
            className="flex-shrink-0 bg-muted/20 text-muted-foreground text-right pr-3 pl-3 py-3 select-none border-r overflow-hidden"
            style={{
              fontSize: `${state.fontSize}px`,
              fontFamily:
                '"JetBrains Mono", "Fira Code", "Consolas", monospace',
              lineHeight: "1.5",
            }}
          >
            {state.code.split("\n").map((_, i) => (
              <div key={`line-${i}`}>{i + 1}</div>
            ))}
          </div>

          {/* Code Textarea */}
          <textarea
            ref={textareaRef}
            value={state.code}
            onChange={handleCodeChange}
            onKeyDown={handleKeyDown}
            className="flex-1 resize-none p-3 bg-background focus:outline-none overflow-auto"
            style={{
              fontSize: `${state.fontSize}px`,
              fontFamily:
                '"JetBrains Mono", "Fira Code", "Consolas", monospace',
              lineHeight: "1.5",
              tabSize: 4,
            }}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>
      </div>
    </div>
  );
}
