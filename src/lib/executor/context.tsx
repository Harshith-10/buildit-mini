"use client";

/**
 * React context for the ExecutorClient.
 * @module lib/executor/context
 */

import { createContext, type ReactNode, useContext, useMemo } from "react";
import { ExecutorClient } from "./client";

/**
 * Context value containing the ExecutorClient instance.
 */
interface ExecutorContextValue {
  /** ExecutorClient instance */
  client: ExecutorClient;
}

/**
 * React context for the ExecutorClient.
 */
const ExecutorContext = createContext<ExecutorContextValue | null>(null);

/**
 * Props for the ExecutorProvider component.
 */
interface ExecutorProviderProps {
  /** Child components */
  children: ReactNode;
  /** Optional base URL override for the execution server */
  baseUrl?: string;
}

/**
 * Provider component that supplies an ExecutorClient instance to the component tree.
 *
 * @example
 * ```tsx
 * // In your app layout or root component
 * import { ExecutorProvider } from '@/lib/executor';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <ExecutorProvider>
 *       {children}
 *     </ExecutorProvider>
 *   );
 * }
 *
 * // With custom URL
 * <ExecutorProvider baseUrl="https://executor.example.com">
 *   {children}
 * </ExecutorProvider>
 * ```
 */
export function ExecutorProvider({ children, baseUrl }: ExecutorProviderProps) {
  const value = useMemo<ExecutorContextValue>(
    () => ({
      client: new ExecutorClient(baseUrl),
    }),
    [baseUrl],
  );

  return (
    <ExecutorContext.Provider value={value}>
      {children}
    </ExecutorContext.Provider>
  );
}

/**
 * Hook to access the ExecutorClient from context.
 *
 * @returns ExecutorClient instance
 * @throws Error if used outside of ExecutorProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { client } = useExecutorContext();
 *
 *   const handleExecute = async () => {
 *     const result = await client.executeCode('python', 'print("Hello")', [
 *       { id: 1, input: '', expected: 'Hello\n' }
 *     ]);
 *     console.log(result);
 *   };
 *
 *   return <button onClick={handleExecute}>Execute</button>;
 * }
 * ```
 */
export function useExecutorContext(): ExecutorContextValue {
  const context = useContext(ExecutorContext);

  if (!context) {
    throw new Error(
      "useExecutorContext must be used within an ExecutorProvider. " +
        "Make sure to wrap your component tree with <ExecutorProvider>.",
    );
  }

  return context;
}

/**
 * Optional hook that returns null if used outside of ExecutorProvider.
 * Useful for components that can work with or without the provider.
 *
 * @returns ExecutorContextValue or null
 */
export function useOptionalExecutorContext(): ExecutorContextValue | null {
  return useContext(ExecutorContext);
}
