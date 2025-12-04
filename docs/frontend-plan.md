# Frontend Implementation Plan

This document outlines the plan for implementing the frontend of the Lab External Examination System. It is based on the backend schema and APIs already implemented.

## 1. Technology Stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **UI Library**: Shadcn UI
- **Icons**: Lucide React
- **State Management**: React Query (TanStack Query) for API data, React Context for global UI state.
- **Forms**: React Hook Form + Zod
- **Code Editor**: Monaco Editor (for coding questions)
- **Date Handling**: date-fns

## 2. Folder Structure (App Router)

```
src/app/
├── (auth)/
│   └── login/              # Login page
├── (dashboard)/            # Protected layout with Sidebar
│   ├── layout.tsx          # Dashboard shell (Sidebar, Header)
│   ├── page.tsx            # Redirects based on role
│   ├── admin/              # Admin-only routes
│   │   ├── dashboard/      # Admin Overview
│   │   ├── subjects/       # Lab Subjects Management
│   │   ├── questions/      # Question Bank Management
│   │   ├── externals/      # Exam Scheduling & Management
│   │   └── users/          # User & Group Management
│   └── student/            # Student-only routes
│       ├── dashboard/      # Student Overview (Upcoming Exams)
│       └── history/        # Past Exams/Results
└── exam/                   # Standalone layout (Minimal UI for focus)
    └── [id]/               # Active Exam Interface
```

## 3. Authentication & Authorization
- **Login Page**: Simple UI with "Sign in with Google".
    - Enforce `@iare.ac.in` domain restriction (handled by backend, show error on frontend).
- **Middleware**:
    - Protect `(dashboard)` and `exam` routes.
    - Redirect unauthenticated users to `/login`.
    - Redirect unauthorized users (e.g., Student trying to access `/admin`) to their respective dashboard or 403 page.
- **Role-Based Sidebar**:
    - **Admin**: Links to Subjects, Questions, Externals, Users.
    - **Student**: Links to Dashboard, History.

## 4. Detailed Page Features

### A. Admin Module

#### 1. Lab Subjects (`/admin/subjects`)
- **List View**: Table showing Title, Regulation, Batches.
- **Create/Edit**:
    - Form: Title, Description, Regulation.
    - Batches: Multi-select or tag input for batch names.

#### 2. Lab Questions (`/admin/questions`)
- **List View**: Table showing Title, Subject, Complexity.
- **Create/Edit**:
    - **Title & Description**: Rich text editor or Markdown.
    - **Examples**: Dynamic list (Input/Output pairs).
    - **Test Cases**: Dynamic list (Input/Output pairs, hidden from students).
    - **Constraints & Challenges**: Text areas.
    - **Subject Link**: Dropdown to select `Lab Subject`.

#### 3. Lab Externals (`/admin/externals`)
- **List View**: Table showing Subject, Schedule, Duration.
- **Create/Edit**:
    - Form: Select Subject, Date/Time Picker, Duration (minutes).
- **Manage Questions (`/admin/externals/[id]`)**:
    - View added questions.
    - "Add Question" button: Opens a modal/drawer to select from the Question Bank (`lab_questions`).
    - Set Marks and optional Duration per question.

#### 4. User Management (`/admin/users`)
- **Student Groups**: Create/Edit Batches, Branches, Sections.
- **User List**: View all users.
    - Filter by Role (Student/Admin).
    - Action: Promote/Demote (though mostly automated).

### B. Student Module

#### 1. Dashboard (`/student/dashboard`)
- **Upcoming Exams**: Cards showing Subject, Date, Duration.
- **Action**: "Start Exam" button (enabled only when scheduled time is active).

#### 2. Exam Interface (`/exam/[id]`)
- **Layout**: Fullscreen, minimal distractions.
- **Left Panel**: Question List (Navigation).
- **Middle Panel**: Question Description, Examples, Constraints.
- **Right Panel**: Code Editor (Monaco).
    - Language Selector (C, C++, Java, Python).
    - "Run Code" button (Compiles against examples).
    - "Submit" button (Runs against test cases).
- **Timer**: Countdown timer at the top. Auto-submit on zero.

## 5. Key Components to Build
- **`DataTable`**: Reusable table with pagination, sorting, and filtering (Shadcn).
- **`CodeEditor`**: Wrapper around Monaco Editor with theme support.
- **`DynamicList`**: Form component for adding multiple Examples/Test Cases.
- **`RoleGuard`**: Wrapper component to hide/show UI elements based on user role.

## 6. API Integration Strategy
- Use **TanStack Query** hooks (`useQuery`, `useMutation`) for all data fetching.
- Create a typed API client (using `axios` or `fetch`) that handles:
    - Base URL
    - Auth headers (cookie handling)
    - Error parsing

## 7. Next Steps
1.  Setup `(dashboard)` layout and Sidebar.
2.  Implement `Lab Subjects` CRUD to establish the pattern.
3.  Implement `Lab Questions` with the complex form (Test Cases).
4.  Build the `Exam Interface` (most complex UI).
