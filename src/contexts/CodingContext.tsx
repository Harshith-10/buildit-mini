"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  useContext,
  useReducer,
} from "react";
import { getDefaultStarterCode } from "@/lib/starter-code";

// Types
export interface TestCase {
  id: number;
  input: string;
  expectedOutput?: string;
  actualOutput?: string;
  passed?: boolean;
  executionTime?: number;
  error?: string;
  isVisible?: boolean;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints?: string;
  testCases: TestCase[];
}

export interface ExecutionResult {
  status: "idle" | "running" | "success" | "error" | "compile_error";
  output?: string;
  error?: string;
  testResults?: TestCase[];
  executionTime?: number;
}

export interface CodingState {
  // Current question
  currentQuestion: Question | null;

  // Editor state
  code: string;
  language: string;
  fontSize: number;

  // Execution state
  isRunning: boolean;
  isSubmitting: boolean;
  executionResult: ExecutionResult | null;

  // Test cases
  testCases: TestCase[];
  customInput: string;

  // UI state
  activeTab: "description" | "submissions";
  consoleTab: "testcase" | "result";
}

type CodingAction =
  | { type: "SET_QUESTION"; payload: Question }
  | { type: "SET_CODE"; payload: string }
  | { type: "SET_LANGUAGE"; payload: string }
  | { type: "SET_FONT_SIZE"; payload: number }
  | { type: "SET_RUNNING"; payload: boolean }
  | { type: "SET_SUBMITTING"; payload: boolean }
  | { type: "SET_EXECUTION_RESULT"; payload: ExecutionResult | null }
  | { type: "SET_TEST_CASES"; payload: TestCase[] }
  | {
      type: "UPDATE_TEST_CASE";
      payload: { id: number; updates: Partial<TestCase> };
    }
  | { type: "SET_CUSTOM_INPUT"; payload: string }
  | { type: "SET_ACTIVE_TAB"; payload: "description" | "submissions" }
  | { type: "SET_CONSOLE_TAB"; payload: "testcase" | "result" }
  | { type: "RESET_CODE" };

const initialState: CodingState = {
  currentQuestion: null,
  code: getDefaultStarterCode("python"),
  language: "python",
  fontSize: 14,
  isRunning: false,
  isSubmitting: false,
  executionResult: null,
  testCases: [],
  customInput: "",
  activeTab: "description",
  consoleTab: "testcase",
};

function codingReducer(state: CodingState, action: CodingAction): CodingState {
  switch (action.type) {
    case "SET_QUESTION":
      return {
        ...state,
        currentQuestion: action.payload,
        testCases: action.payload.testCases.map((tc, idx) => ({
          ...tc,
          id: tc.id ?? idx + 1,
          isVisible: tc.isVisible ?? true,
        })),
        code: getDefaultStarterCode(state.language),
        executionResult: null,
      };

    case "SET_CODE":
      return { ...state, code: action.payload };

    case "SET_LANGUAGE":
      return {
        ...state,
        language: action.payload,
        code: getDefaultStarterCode(action.payload),
      };

    case "SET_FONT_SIZE":
      return { ...state, fontSize: action.payload };

    case "SET_RUNNING":
      return { ...state, isRunning: action.payload };

    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.payload };

    case "SET_EXECUTION_RESULT":
      return {
        ...state,
        executionResult: action.payload,
        consoleTab: action.payload ? "result" : state.consoleTab,
      };

    case "SET_TEST_CASES":
      return { ...state, testCases: action.payload };

    case "UPDATE_TEST_CASE":
      return {
        ...state,
        testCases: state.testCases.map((tc) =>
          tc.id === action.payload.id
            ? { ...tc, ...action.payload.updates }
            : tc,
        ),
      };

    case "SET_CUSTOM_INPUT":
      return { ...state, customInput: action.payload };

    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };

    case "SET_CONSOLE_TAB":
      return { ...state, consoleTab: action.payload };

    case "RESET_CODE":
      return {
        ...state,
        code: getDefaultStarterCode(state.language),
        executionResult: null,
      };

    default:
      return state;
  }
}

const CodingContext = createContext<{
  state: CodingState;
  dispatch: Dispatch<CodingAction>;
} | null>(null);

export function CodingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(codingReducer, initialState);

  return (
    <CodingContext.Provider value={{ state, dispatch }}>
      {children}
    </CodingContext.Provider>
  );
}

export function useCoding() {
  const context = useContext(CodingContext);
  if (!context) {
    throw new Error("useCoding must be used within a CodingProvider");
  }
  return context;
}
