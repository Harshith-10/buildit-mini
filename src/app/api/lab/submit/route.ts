import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { labExternalQuestions } from "@/db/schema";
import { getUserContext, requireRole } from "@/lib/proxy";

const submitSchema = z.object({
  externalId: z.string().min(1, "External ID is required"),
  questionId: z.string().min(1, "Question ID is required"),
  code: z.string().min(1, "Code is required"),
  language: z.string().min(1, "Language is required"),
});

// This would typically be stored in the database
// For now, we'll create a simple in-memory store (replace with DB in production)
interface Submission {
  id: string;
  externalId: string;
  questionId: string;
  userId: string;
  code: string;
  language: string;
  status: "pending" | "accepted" | "rejected" | "error";
  score: number;
  testsPassed: number;
  totalTests: number;
  submittedAt: Date;
}

export async function POST(req: Request) {
  const context = await getUserContext();
  if (!requireRole(context, ["student"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = submitSchema.parse(body);

    // Verify the question belongs to the external
    const externalQuestion = await db.query.labExternalQuestions.findFirst({
      where: and(
        eq(labExternalQuestions.externalId, data.externalId),
        eq(labExternalQuestions.questionId, data.questionId),
      ),
      with: {
        question: true,
      },
    });

    if (!externalQuestion) {
      return NextResponse.json(
        { error: "Question not found in this external" },
        { status: 404 },
      );
    }

    // Get test cases from the question
    const testCases =
      (externalQuestion.question.testCases as {
        input?: string;
        expected?: string;
        output?: string;
      }[]) || [];

    // Execute code against all test cases
    // TODO: Replace with actual code execution service
    const results = await Promise.all(
      testCases.map(async (testCase, idx: number) => {
        // Simulate execution - replace with real execution
        await new Promise((resolve) =>
          setTimeout(resolve, 100 + Math.random() * 200),
        );

        // Mock result - in production, this would be actual code execution
        return {
          id: idx + 1,
          input: testCase.input,
          expectedOutput: testCase.expected || testCase.output,
          actualOutput: "[Mock execution result]",
          passed: Math.random() > 0.3, // Random for demo
          executionTime: Math.floor(50 + Math.random() * 100),
        };
      }),
    );

    const testsPassed = results.filter((r) => r.passed).length;
    const totalTests = results.length;
    const score = Math.round(
      (testsPassed / Math.max(totalTests, 1)) * externalQuestion.marks,
    );

    // Create submission record
    const submission: Submission = {
      id: crypto.randomUUID(),
      externalId: data.externalId,
      questionId: data.questionId,
      userId: context?.user?.id ?? "",
      code: data.code,
      language: data.language,
      status: testsPassed === totalTests ? "accepted" : "rejected",
      score,
      testsPassed,
      totalTests,
      submittedAt: new Date(),
    };

    // TODO: Store submission in database
    // For now, just return the result

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        status: submission.status,
        score: submission.score,
        testsPassed: submission.testsPassed,
        totalTests: submission.totalTests,
        submittedAt: submission.submittedAt,
      },
      testResults: results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Submission error:", error);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}

// Get submissions for a student
export async function GET(req: Request) {
  const context = await getUserContext();
  if (!requireRole(context, ["student", "admin", "super_admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const _externalId = searchParams.get("externalId");
  const _questionId = searchParams.get("questionId");

  // TODO: Implement fetching submissions from database
  // For now, return empty array

  return NextResponse.json({
    submissions: [],
  });
}
