"use client";

/**
 * React hooks for the Build-It-Agent code execution service.
 * @module lib/executor/hooks
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExecutorClient, ExecutorError } from "./client";
import { useOptionalExecutorContext } from "./context";
import type {
  ExecuteAndWaitOptions,
  ExecuteRequest,
  ExecuteResponse,
  ExecutionState,
  Language,
} from "./types";

/**
 * Hook to get an ExecutorClient instance.
 * Uses the context if available, otherwise creates a standalone instance.
 *
 * @param baseUrl - Optional base URL override
 * @returns ExecutorClient instance
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const executor = useExecutor();
 *
 *   const checkHealth = async () => {
 *     const isHealthy = await executor.healthCheck();
 *     console.log('Server healthy:', isHealthy);
 *   };
 * }
 * ```
 */
export function useExecutor(baseUrl?: string): ExecutorClient {
  const context = useOptionalExecutorContext();

  const standaloneClient = useMemo(() => {
    // If we have a context and no URL override, use context client
    if (context && !baseUrl) {
      return null;
    }
    // Otherwise create a standalone client
    return new ExecutorClient(baseUrl);
  }, [baseUrl, context]);

  return context?.client ?? standaloneClient!;
}

/**
 * Return type for the useLanguages hook.
 */
export interface UseLanguagesResult {
  /** Array of available languages */
  languages: Language[] | null;
  /** Whether the languages are currently loading */
  isLoading: boolean;
  /** Error that occurred during fetching */
  error: ExecutorError | null;
  /** Function to manually refetch languages */
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch available programming languages.
 *
 * @param options - Hook options
 * @returns Languages state and controls
 *
 * @example
 * ```tsx
 * function LanguageSelector() {
 *   const { languages, isLoading, error } = useLanguages();
 *
 *   if (isLoading) return <div>Loading languages...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <select>
 *       {languages?.map(lang => (
 *         <option key={lang.language} value={lang.language}>
 *           {lang.display_name}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * }
 * ```
 */
export function useLanguages(options?: {
  /** Custom executor client */
  client?: ExecutorClient;
  /** Whether to fetch on mount (default: true) */
  fetchOnMount?: boolean;
}): UseLanguagesResult {
  const { client: customClient, fetchOnMount = true } = options ?? {};
  const defaultClient = useExecutor();
  const client = customClient ?? defaultClient;

  const [languages, setLanguages] = useState<Language[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ExecutorError | null>(null);

  const fetchLanguages = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await client.getLanguages();
      setLanguages(result);
    } catch (err) {
      const executorError =
        err instanceof ExecutorError
          ? err
          : new ExecutorError(
              err instanceof Error ? err.message : "Unknown error",
              "NETWORK_ERROR",
            );
      setError(executorError);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (fetchOnMount) {
      fetchLanguages();
    }
  }, [fetchOnMount, fetchLanguages]);

  return {
    languages,
    isLoading,
    error,
    refetch: fetchLanguages,
  };
}

/**
 * Return type for the useCodeExecution hook.
 */
export interface UseCodeExecutionResult {
  /** Execute code with the given request */
  execute: (
    request: ExecuteRequest,
    options?: ExecuteAndWaitOptions,
  ) => Promise<ExecuteResponse | null>;
  /** Current execution result */
  result: ExecuteResponse | null;
  /** Current execution state */
  status: ExecutionState;
  /** Whether code is currently executing */
  isLoading: boolean;
  /** Error that occurred during execution */
  error: ExecutorError | null;
  /** Reset the execution state */
  reset: () => void;
  /** Cancel the current execution */
  cancel: () => void;
}

/**
 * Hook for executing code with full state management.
 *
 * @param options - Hook options
 * @returns Execution state and controls
 *
 * @example
 * ```tsx
 * function CodeRunner() {
 *   const { execute, result, isLoading, error, reset } = useCodeExecution();
 *
 *   const handleRun = async () => {
 *     await execute({
 *       language: 'python',
 *       code: 'print("Hello")',
 *       testcases: [{ id: 1, input: '', expected: 'Hello\n' }]
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleRun} disabled={isLoading}>
 *         {isLoading ? 'Running...' : 'Run'}
 *       </button>
 *       <button onClick={reset}>Reset</button>
 *       {result && <div>Passed: {result.results.filter(r => r.passed).length}</div>}
 *       {error && <div className="text-red-500">{error.message}</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCodeExecution(options?: {
  /** Custom executor client */
  client?: ExecutorClient;
  /** Default polling interval */
  pollInterval?: number;
  /** Default timeout */
  timeout?: number;
  /** Callback when execution completes */
  onComplete?: (result: ExecuteResponse) => void;
  /** Callback when execution fails */
  onError?: (error: ExecutorError) => void;
}): UseCodeExecutionResult {
  const {
    client: customClient,
    pollInterval,
    timeout,
    onComplete,
    onError,
  } = options ?? {};

  const defaultClient = useExecutor();
  const client = customClient ?? defaultClient;

  const [result, setResult] = useState<ExecuteResponse | null>(null);
  const [status, setStatus] = useState<ExecutionState>("idle");
  const [error, setError] = useState<ExecutorError | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    // Cancel any ongoing execution
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    setResult(null);
    setStatus("idle");
    setError(null);
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setStatus("idle");
  }, []);

  const execute = useCallback(
    async (
      request: ExecuteRequest,
      executeOptions?: ExecuteAndWaitOptions,
    ): Promise<ExecuteResponse | null> => {
      // Cancel any previous execution
      abortControllerRef.current?.abort();

      // Create new abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setError(null);
      setResult(null);
      setStatus("submitting");

      try {
        const executionResult = await client.executeAndWait(request, {
          pollInterval: executeOptions?.pollInterval ?? pollInterval,
          timeout: executeOptions?.timeout ?? timeout,
          signal: abortController.signal,
        });

        // Check if we were cancelled
        if (abortController.signal.aborted) {
          return null;
        }

        setResult(executionResult);
        setStatus("completed");
        onComplete?.(executionResult);

        return executionResult;
      } catch (err) {
        // Check if this was an abort
        if (abortController.signal.aborted) {
          return null;
        }

        const executorError =
          err instanceof ExecutorError
            ? err
            : new ExecutorError(
                err instanceof Error ? err.message : "Unknown error",
                "NETWORK_ERROR",
              );

        setError(executorError);
        setStatus("error");
        onError?.(executorError);

        return null;
      }
    },
    [client, pollInterval, timeout, onComplete, onError],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const isLoading = status === "submitting" || status === "polling";

  return {
    execute,
    result,
    status,
    isLoading,
    error,
    reset,
    cancel,
  };
}

/**
 * Return type for the useHealthCheck hook.
 */
export interface UseHealthCheckResult {
  /** Whether the server is healthy */
  isHealthy: boolean | null;
  /** Whether the health check is in progress */
  isLoading: boolean;
  /** Function to manually check health */
  checkHealth: () => Promise<boolean>;
}

/**
 * Hook to check if the execution server is healthy.
 *
 * @param options - Hook options
 * @returns Health check state and controls
 *
 * @example
 * ```tsx
 * function ServerStatus() {
 *   const { isHealthy, isLoading, checkHealth } = useHealthCheck();
 *
 *   return (
 *     <div>
 *       <span>
 *         Server: {isLoading ? '...' : isHealthy ? '🟢 Online' : '🔴 Offline'}
 *       </span>
 *       <button onClick={checkHealth}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useHealthCheck(options?: {
  /** Custom executor client */
  client?: ExecutorClient;
  /** Whether to check on mount (default: true) */
  checkOnMount?: boolean;
  /** Polling interval for continuous checking (disabled by default) */
  pollingInterval?: number;
}): UseHealthCheckResult {
  const {
    client: customClient,
    checkOnMount = true,
    pollingInterval,
  } = options ?? {};
  const defaultClient = useExecutor();
  const client = customClient ?? defaultClient;

  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkHealth = useCallback(async () => {
    setIsLoading(true);

    try {
      const healthy = await client.healthCheck();
      setIsHealthy(healthy);
      return healthy;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (checkOnMount) {
      checkHealth();
    }
  }, [checkOnMount, checkHealth]);

  useEffect(() => {
    if (!pollingInterval) return;

    const interval = setInterval(checkHealth, pollingInterval);
    return () => clearInterval(interval);
  }, [pollingInterval, checkHealth]);

  return {
    isHealthy,
    isLoading,
    checkHealth,
  };
}
