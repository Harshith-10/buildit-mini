import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserContext, requireRole } from "@/lib/proxy";

const executeSchema = z.object({
  code: z.string().min(1, "Code is required"),
  language: z.string().min(1, "Language is required"),
  input: z.string().optional(),
  testCases: z
    .array(
      z.object({
        id: z.number(),
        input: z.string(),
        expectedOutput: z.string().optional(),
      }),
    )
    .optional(),
});

// Mock execution function - replace with actual code execution service
async function executeCode(
  _code: string,
  language: string,
  input: string,
): Promise<{
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
}> {
  // Simulate execution delay
  await new Promise((resolve) =>
    setTimeout(resolve, 500 + Math.random() * 500),
  );

  // This is a placeholder - you'll want to connect this to a real code execution service
  // Options include:
  // 1. Judge0 API (https://judge0.com/)
  // 2. Piston API (https://github.com/engineer-man/piston)
  // 3. Self-hosted Docker-based execution
  // 4. AWS Lambda / Cloud Functions

  // For now, return a mock response
  return {
    success: true,
    output: `[Mock Execution]\nLanguage: ${language}\nInput: ${input || "(none)"}\n\nNote: Connect to a code execution service for real execution.`,
    executionTime: Math.floor(50 + Math.random() * 100),
  };
}

export async function POST(req: Request) {
  const context = await getUserContext();
  if (!requireRole(context, ["student", "admin", "super_admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = executeSchema.parse(body);

    // If test cases are provided, run against each
    if (data.testCases && data.testCases.length > 0) {
      const results = await Promise.all(
        data.testCases.map(async (testCase) => {
          const result = await executeCode(
            data.code,
            data.language,
            testCase.input,
          );

          const actualOutput = result.output?.trim() || "";
          const expectedOutput = testCase.expectedOutput?.trim() || "";
          const passed = expectedOutput
            ? actualOutput.includes(expectedOutput) ||
              expectedOutput === actualOutput
            : true;

          return {
            id: testCase.id,
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: result.output,
            passed,
            executionTime: result.executionTime,
            error: result.error,
          };
        }),
      );

      const allPassed = results.every((r) => r.passed);
      const totalTime = results.reduce(
        (sum, r) => sum + (r.executionTime || 0),
        0,
      );

      return NextResponse.json({
        status: allPassed ? "success" : "error",
        testResults: results,
        executionTime: totalTime,
      });
    }

    // Single execution with custom input
    const result = await executeCode(
      data.code,
      data.language,
      data.input || "",
    );

    return NextResponse.json({
      status: result.success ? "success" : "error",
      output: result.output,
      error: result.error,
      executionTime: result.executionTime,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Execution error:", error);
    return NextResponse.json({ error: "Execution failed" }, { status: 500 });
  }
}
