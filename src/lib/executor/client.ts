/**
 * Client class for interacting with the Build-It-Agent code execution service.
 * @module lib/executor/client
 */

import type {
  ExecuteAndWaitOptions,
  ExecuteJobResponse,
  ExecuteRequest,
  ExecuteResponse,
  ExecutorErrorCode,
  HealthResponse,
  JobStatus,
  Language,
  TestCase,
} from "./types";

/**
 * Default configuration values.
 */
const DEFAULT_BASE_URL = "http://localhost:8910";
const DEFAULT_POLL_INTERVAL = 500; // ms
const DEFAULT_TIMEOUT = 60000; // ms

/**
 * Custom error class for executor-related errors.
 */
export class ExecutorError extends Error {
  /** Error code for programmatic handling */
  readonly code: ExecutorErrorCode;
  /** HTTP status code (if applicable) */
  readonly statusCode?: number;
  /** Original error (if wrapping another error) */
  readonly cause?: Error;

  constructor(
    message: string,
    code: ExecutorErrorCode,
    options?: { statusCode?: number; cause?: Error },
  ) {
    super(message);
    this.name = "ExecutorError";
    this.code = code;
    this.statusCode = options?.statusCode;
    this.cause = options?.cause;

    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ExecutorError);
    }
  }
}

/**
 * Client for the Build-It-Agent code execution service.
 *
 * @example
 * ```ts
 * const client = new ExecutorClient();
 *
 * // Check if service is healthy
 * const isHealthy = await client.healthCheck();
 *
 * // Get available languages
 * const languages = await client.getLanguages();
 *
 * // Execute code and wait for result
 * const result = await client.executeCode('python', 'print("Hello")', [
 *   { id: 1, input: '', expected: 'Hello\n' }
 * ]);
 * ```
 */
export class ExecutorClient {
  private readonly baseUrl: string;

  /**
   * Creates a new ExecutorClient instance.
   *
   * @param baseUrl - Base URL of the execution server.
   *                  Defaults to NEXT_PUBLIC_EXECUTOR_URL env var or http://localhost:8910
   */
  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl ||
      (typeof process !== "undefined"
        ? process.env.NEXT_PUBLIC_EXECUTOR_URL
        : undefined) ||
      (typeof window !== "undefined"
        ? (window as unknown as Record<string, string>).NEXT_PUBLIC_EXECUTOR_URL
        : undefined) ||
      DEFAULT_BASE_URL;

    // Remove trailing slash if present
    this.baseUrl = this.baseUrl.replace(/\/$/, "");
  }

  /**
   * Makes an HTTP request to the execution server.
   *
   * @param endpoint - API endpoint (without base URL)
   * @param options - Fetch options
   * @returns Parsed JSON response
   * @throws {ExecutorError} On network or server errors
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorBody = await response.json();
          if (errorBody.error) {
            errorMessage = errorBody.error;
          }
        } catch {
          // Ignore JSON parse errors for error responses
        }

        throw new ExecutorError(errorMessage, "SERVER_ERROR", {
          statusCode: response.status,
        });
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof ExecutorError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ExecutorError("Request was aborted", "ABORT_ERROR", {
          cause: error,
        });
      }

      throw new ExecutorError(
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
        "NETWORK_ERROR",
        { cause: error instanceof Error ? error : undefined },
      );
    }
  }

  /**
   * Checks if the execution server is healthy.
   *
   * @returns true if the server is healthy, false otherwise
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.request<HealthResponse>("/health");
      return response.status === "ok";
    } catch {
      return false;
    }
  }

  /**
   * Fetches the list of available programming languages.
   *
   * @returns Array of available languages
   * @throws {ExecutorError} On network or server errors
   */
  async getLanguages(): Promise<Language[]> {
    return this.request<Language[]>("/languages");
  }

  /**
   * Submits a code execution job to the server.
   *
   * @param request - Execution request containing language, code, and test cases
   * @param signal - Optional AbortSignal for cancellation
   * @returns Job ID for polling
   * @throws {ExecutorError} On network or server errors
   */
  async submitJob(
    request: ExecuteRequest,
    signal?: AbortSignal,
  ): Promise<number> {
    const response = await this.request<ExecuteJobResponse>("/execute", {
      method: "POST",
      body: JSON.stringify(request),
      signal,
    });

    return response.id;
  }

  /**
   * Gets the current status of a job.
   *
   * @param id - Job ID
   * @param signal - Optional AbortSignal for cancellation
   * @returns Current job status
   * @throws {ExecutorError} On network or server errors
   */
  async getJobStatus(id: number, signal?: AbortSignal): Promise<JobStatus> {
    return this.request<JobStatus>(`/status/${id}`, { signal });
  }

  /**
   * Submits a job and polls until completion.
   *
   * @param request - Execution request
   * @param options - Polling options
   * @returns Execution result
   * @throws {ExecutorError} On timeout, cancellation, or server errors
   */
  async executeAndWait(
    request: ExecuteRequest,
    options: ExecuteAndWaitOptions = {},
  ): Promise<ExecuteResponse> {
    const {
      pollInterval = DEFAULT_POLL_INTERVAL,
      timeout = DEFAULT_TIMEOUT,
      signal,
    } = options;

    const startTime = Date.now();

    // Submit the job
    const jobId = await this.submitJob(request, signal);

    // Poll for completion
    while (true) {
      // Check for timeout
      if (Date.now() - startTime > timeout) {
        throw new ExecutorError(
          `Execution timed out after ${timeout}ms`,
          "TIMEOUT_ERROR",
        );
      }

      // Check for cancellation
      if (signal?.aborted) {
        throw new ExecutorError("Execution was cancelled", "ABORT_ERROR");
      }

      const status = await this.getJobStatus(jobId, signal);

      switch (status.status) {
        case "completed":
          return status.result;

        case "error":
          throw new ExecutorError(
            `Job execution failed: ${status.error}`,
            "JOB_ERROR",
          );

        case "queued":
        case "running":
          // Wait before polling again
          await this.sleep(pollInterval, signal);
          break;

        default:
          throw new ExecutorError(
            `Unknown job status: ${(status as { status: string }).status}`,
            "INVALID_RESPONSE",
          );
      }
    }
  }

  /**
   * Convenience method for executing code with test cases.
   *
   * @param language - Programming language identifier
   * @param code - Source code to execute
   * @param testcases - Test cases to run
   * @param options - Execution options
   * @returns Execution result
   * @throws {ExecutorError} On timeout, cancellation, or server errors
   */
  async executeCode(
    language: string,
    code: string,
    testcases: TestCase[],
    options?: ExecuteAndWaitOptions,
  ): Promise<ExecuteResponse> {
    return this.executeAndWait({ language, code, testcases }, options);
  }

  /**
   * Sleeps for a specified duration, respecting abort signals.
   *
   * @param ms - Duration in milliseconds
   * @param signal - Optional AbortSignal for cancellation
   */
  private sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new ExecutorError("Sleep was aborted", "ABORT_ERROR"));
        return;
      }

      const timeoutId = setTimeout(resolve, ms);

      signal?.addEventListener("abort", () => {
        clearTimeout(timeoutId);
        reject(new ExecutorError("Sleep was aborted", "ABORT_ERROR"));
      });
    });
  }

  /**
   * Gets the base URL of the executor service.
   *
   * @returns The base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

/**
 * Creates a new ExecutorClient instance.
 *
 * @param baseUrl - Optional base URL override
 * @returns ExecutorClient instance
 */
export function createExecutorClient(baseUrl?: string): ExecutorClient {
  return new ExecutorClient(baseUrl);
}
