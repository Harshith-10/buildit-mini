/**
 * Build-It-Agent Code Execution Library
 *
 * A complete wrapper for interacting with the remote code execution service.
 *
 * @example
 * ```tsx
 * // Using hooks in a React component
 * import { useCodeExecution, useLanguages } from '@/lib/executor';
 *
 * function CodeRunner() {
 *   const { languages } = useLanguages();
 *   const { execute, result, isLoading } = useCodeExecution();
 *
 *   const handleRun = () => execute({
 *     language: 'python',
 *     code: 'print("Hello")',
 *     testcases: [{ id: 1, input: '', expected: 'Hello\n' }]
 *   });
 *
 *   return <button onClick={handleRun}>{isLoading ? 'Running...' : 'Run'}</button>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Using the client directly
 * import { ExecutorClient } from '@/lib/executor';
 *
 * const client = new ExecutorClient();
 * const result = await client.executeCode('python', 'print("Hello")', [
 *   { id: 1, input: '', expected: 'Hello\n' }
 * ]);
 * ```
 *
 * @example
 * ```tsx
 * // Using with context provider
 * import { ExecutorProvider, useExecutorContext } from '@/lib/executor';
 *
 * // In your layout
 * function Layout({ children }) {
 *   return <ExecutorProvider>{children}</ExecutorProvider>;
 * }
 *
 * // In a component
 * function MyComponent() {
 *   const { client } = useExecutorContext();
 *   // Use client...
 * }
 * ```
 *
 * @module lib/executor
 */

// Server Actions
export {
  executeCodeAction,
  executeCodeServerAction,
  getJobStatusAction,
  getLanguagesAction,
  healthCheckAction,
  submitJobAction,
} from "./actions";

// Client
export { createExecutorClient, ExecutorClient, ExecutorError } from "./client";

// Context
export {
  ExecutorProvider,
  useExecutorContext,
  useOptionalExecutorContext,
} from "./context";

// Hooks
export {
  type UseCodeExecutionResult,
  type UseHealthCheckResult,
  type UseLanguagesResult,
  useCodeExecution,
  useExecutor,
  useHealthCheck,
  useLanguages,
} from "./hooks";
// Types
export type {
  ExecuteAndWaitOptions,
  ExecuteJobResponse,
  ExecuteRequest,
  ExecuteResponse,
  ExecuteResult,
  ExecutionState,
  ExecutionStatus,
  ExecutorErrorCode,
  HealthResponse,
  JobStatus,
  JobStatusCompleted,
  JobStatusError,
  JobStatusQueued,
  JobStatusRunning,
  Language,
  TestCase,
  TestCaseResult,
} from "./types";
