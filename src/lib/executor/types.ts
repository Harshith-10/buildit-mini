/**
 * Type definitions for the Build-It-Agent code execution service.
 * @module lib/executor/types
 */

/**
 * Represents an available programming language on the execution server.
 */
export interface Language {
  /** Human-readable name of the language (e.g., "Python 3") */
  display_name: string;
  /** Language identifier used in API calls (e.g., "python") */
  language: string;
}

/**
 * Represents a single test case for code execution.
 */
export interface TestCase {
  /** Unique identifier for the test case */
  id: number;
  /** Input to be provided to the program via stdin */
  input: string;
  /** Expected output to compare against (optional) */
  expected?: string | null;
  /** Per-test timeout in milliseconds (optional) */
  timeout_ms?: number | null;
}

/**
 * Request body for the /execute endpoint.
 */
export interface ExecuteRequest {
  /** Programming language identifier */
  language: string;
  /** Source code to execute */
  code: string;
  /** Array of test cases to run */
  testcases: TestCase[];
}

/**
 * Response from the /execute endpoint (202 Accepted).
 */
export interface ExecuteJobResponse {
  /** Job ID for polling status */
  id: number;
}

/**
 * Result of a single test case execution.
 */
export interface TestCaseResult {
  /** Test case identifier */
  id: number;
  /** Whether execution succeeded (no crash) */
  ok: boolean;
  /** Whether output matches expected */
  passed: boolean;
  /** Input provided to the program */
  input: string;
  /** Expected output (if provided) */
  expected: string | null;
  /** Standard output from the program */
  stdout: string;
  /** Standard error from the program */
  stderr: string;
  /** Whether the test case timed out */
  timed_out: boolean;
  /** Execution duration in milliseconds */
  duration_ms: number;
  /** Memory usage in kilobytes */
  memory_kb: number;
  /** Process exit code (null if terminated by signal) */
  exit_code: number | null;
  /** Termination signal (null if exited normally) */
  term_signal: number | null;
}

/**
 * Overall execution status values.
 */
export type ExecutionStatus =
  | "success"
  | "error"
  | "timeout"
  | "compile_error"
  | "runtime_error"
  | "unsupported_language"
  | null;

/**
 * Complete execution result returned when job is completed.
 */
export interface ExecuteResult {
  /** Whether the code compiled successfully (for compiled languages) */
  compiled: boolean;
  /** Language used for execution */
  language: string;
  /** Overall execution status */
  status: ExecutionStatus;
  /** Additional message (e.g., compilation error details) */
  message: string | null;
  /** Individual test case results */
  results: TestCaseResult[];
  /** Total execution duration in milliseconds */
  total_duration_ms: number;
}

/**
 * Job status when queued.
 */
export interface JobStatusQueued {
  status: "queued";
}

/**
 * Job status when running.
 */
export interface JobStatusRunning {
  status: "running";
}

/**
 * Job status when completed.
 */
export interface JobStatusCompleted {
  status: "completed";
  result: ExecuteResult;
}

/**
 * Job status when error occurred.
 */
export interface JobStatusError {
  status: "error";
  error: string;
}

/**
 * Union type for all possible job statuses.
 */
export type JobStatus =
  | JobStatusQueued
  | JobStatusRunning
  | JobStatusCompleted
  | JobStatusError;

/**
 * Health check response.
 */
export interface HealthResponse {
  status: "ok";
}

/**
 * Execution response (alias for completed job result).
 */
export type ExecuteResponse = ExecuteResult;

/**
 * Options for the executeAndWait method.
 */
export interface ExecuteAndWaitOptions {
  /** Polling interval in milliseconds (default: 500) */
  pollInterval?: number;
  /** Maximum timeout in milliseconds (default: 60000) */
  timeout?: number;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
}

/**
 * State of the code execution hook.
 */
export type ExecutionState =
  | "idle"
  | "submitting"
  | "polling"
  | "completed"
  | "error";

/**
 * Error codes for ExecutorError.
 */
export type ExecutorErrorCode =
  | "NETWORK_ERROR"
  | "TIMEOUT_ERROR"
  | "ABORT_ERROR"
  | "SERVER_ERROR"
  | "INVALID_RESPONSE"
  | "JOB_ERROR";
