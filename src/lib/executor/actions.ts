"use server";

/**
 * Server actions for the Build-It-Agent code execution service.
 * These actions can be used in Next.js App Router for server-side execution.
 * @module lib/executor/actions
 */

import { ExecutorClient, ExecutorError } from "./client";
import type {
  ExecuteRequest,
  ExecuteResponse,
  Language,
  TestCase,
} from "./types";

/**
 * Result type for server actions.
 */
interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Gets the executor client for server actions.
 * Uses EXECUTOR_URL (server-side) or NEXT_PUBLIC_EXECUTOR_URL.
 */
function getServerClient(): ExecutorClient {
  const baseUrl =
    process.env.EXECUTOR_URL || process.env.NEXT_PUBLIC_EXECUTOR_URL;
  return new ExecutorClient(baseUrl);
}

/**
 * Fetches available programming languages from the execution server.
 *
 * @returns Action result with languages array
 *
 * @example
 * ```tsx
 * // In a Server Component
 * import { getLanguagesAction } from '@/lib/executor/actions';
 *
 * export default async function LanguagePage() {
 *   const result = await getLanguagesAction();
 *
 *   if (!result.success) {
 *     return <div>Error: {result.error}</div>;
 *   }
 *
 *   return (
 *     <ul>
 *       {result.data?.map(lang => (
 *         <li key={lang.language}>{lang.display_name}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export async function getLanguagesAction(): Promise<ActionResult<Language[]>> {
  try {
    const client = getServerClient();
    const languages = await client.getLanguages();

    return {
      success: true,
      data: languages,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof ExecutorError
          ? error.message
          : "Failed to fetch languages",
    };
  }
}

/**
 * Executes code using form data.
 * Useful for form submissions.
 *
 * @param formData - Form data containing language, code, and testcases
 * @returns Action result with execution response
 *
 * @example
 * ```tsx
 * // In a Client Component
 * 'use client';
 *
 * import { executeCodeAction } from '@/lib/executor/actions';
 *
 * export default function CodeForm() {
 *   async function handleSubmit(formData: FormData) {
 *     const result = await executeCodeAction(formData);
 *     console.log(result);
 *   }
 *
 *   return (
 *     <form action={handleSubmit}>
 *       <input name="language" value="python" />
 *       <textarea name="code" />
 *       <input type="hidden" name="testcases" value={JSON.stringify([
 *         { id: 1, input: '5', expected: '10' }
 *       ])} />
 *       <button type="submit">Run</button>
 *     </form>
 *   );
 * }
 * ```
 */
export async function executeCodeAction(
  formData: FormData,
): Promise<ActionResult<ExecuteResponse>> {
  try {
    const language = formData.get("language");
    const code = formData.get("code");
    const testcasesJson = formData.get("testcases");

    if (!language || typeof language !== "string") {
      return { success: false, error: "Language is required" };
    }

    if (!code || typeof code !== "string") {
      return { success: false, error: "Code is required" };
    }

    let testcases: TestCase[] = [];

    if (testcasesJson && typeof testcasesJson === "string") {
      try {
        testcases = JSON.parse(testcasesJson);
      } catch {
        return { success: false, error: "Invalid testcases JSON" };
      }
    }

    // Validate testcases
    if (!Array.isArray(testcases)) {
      return { success: false, error: "Testcases must be an array" };
    }

    const client = getServerClient();
    const result = await client.executeCode(language, code, testcases);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof ExecutorError
          ? error.message
          : "Failed to execute code",
    };
  }
}

/**
 * Executes code with a typed request object.
 * Useful for programmatic server-side execution.
 *
 * @param request - Execution request
 * @returns Action result with execution response
 *
 * @example
 * ```tsx
 * // In a Server Action or API route
 * import { executeCodeServerAction } from '@/lib/executor/actions';
 *
 * const result = await executeCodeServerAction({
 *   language: 'python',
 *   code: 'print(int(input()) * 2)',
 *   testcases: [
 *     { id: 1, input: '5', expected: '10' }
 *   ]
 * });
 * ```
 */
export async function executeCodeServerAction(
  request: ExecuteRequest,
): Promise<ActionResult<ExecuteResponse>> {
  try {
    const client = getServerClient();
    const result = await client.executeAndWait(request);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof ExecutorError
          ? error.message
          : "Failed to execute code",
    };
  }
}

/**
 * Checks if the execution server is healthy.
 *
 * @returns Action result with health status
 *
 * @example
 * ```tsx
 * // In a Server Component or API route
 * import { healthCheckAction } from '@/lib/executor/actions';
 *
 * export default async function StatusPage() {
 *   const result = await healthCheckAction();
 *
 *   return (
 *     <div>
 *       Server Status: {result.data ? '🟢 Online' : '🔴 Offline'}
 *     </div>
 *   );
 * }
 * ```
 */
export async function healthCheckAction(): Promise<ActionResult<boolean>> {
  try {
    const client = getServerClient();
    const isHealthy = await client.healthCheck();

    return {
      success: true,
      data: isHealthy,
    };
  } catch (error) {
    return {
      success: false,
      data: false,
      error:
        error instanceof ExecutorError ? error.message : "Health check failed",
    };
  }
}

/**
 * Submits a job without waiting for completion.
 * Useful when you want to handle polling on the client side.
 *
 * @param request - Execution request
 * @returns Action result with job ID
 */
export async function submitJobAction(
  request: ExecuteRequest,
): Promise<ActionResult<number>> {
  try {
    const client = getServerClient();
    const jobId = await client.submitJob(request);

    return {
      success: true,
      data: jobId,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof ExecutorError ? error.message : "Failed to submit job",
    };
  }
}

/**
 * Gets the status of a job.
 *
 * @param jobId - Job ID to check
 * @returns Action result with job status
 */
export async function getJobStatusAction(
  jobId: number,
): Promise<ActionResult<import("./types").JobStatus>> {
  try {
    const client = getServerClient();
    const status = await client.getJobStatus(jobId);

    return {
      success: true,
      data: status,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof ExecutorError
          ? error.message
          : "Failed to get job status",
    };
  }
}
