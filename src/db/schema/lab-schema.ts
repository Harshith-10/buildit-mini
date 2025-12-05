import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

// Helper for soft delete and timestamps
const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedAt: timestamp("deleted_at"),
};

// --- Lab Entities ---

export const labSubjects = pgTable("lab_subjects", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  branches: jsonb("branches").$type<string[]>(), // Array of branch names e.g. ["CSE", "ECE"]
  regulation: text("regulation"),
  ...timestamps,
});

export const labQuestions = pgTable("lab_questions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description").notNull(),
  examples: jsonb("examples").notNull(), // Structure to be defined by app logic
  constraints: text("constraints"),
  challenges: text("challenges"),
  testCases: jsonb("test_cases").notNull(), // Structure to be defined by app logic
  subjectId: text("subject_id").references(() => labSubjects.id),
  ...timestamps,
});

export const labExternals = pgTable("lab_externals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  subjectId: text("subject_id")
    .references(() => labSubjects.id)
    .notNull(),
  duration: integer("duration").notNull(), // in minutes
  schedule: timestamp("schedule").notNull(),
  accessPassword: text("access_password"), // Optional password to access the exam
  ...timestamps,
});

export const labExternalQuestions = pgTable("lab_external_questions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  externalId: text("external_id")
    .references(() => labExternals.id)
    .notNull(),
  questionId: text("question_id")
    .references(() => labQuestions.id)
    .notNull(),
  marks: integer("marks").notNull(),
  duration: integer("duration"), // Optional per-question duration
  ...timestamps,
});

// --- User Management Entities ---

export const studentGroups = pgTable("student_groups", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  batch: text("batch").notNull(),
  branch: text("branch").notNull(),
  section: text("section").notNull(),
  semester: integer("semester").notNull(),
  regulation: text("regulation").notNull(),
  ...timestamps,
});

export const students = pgTable("students", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id),
  rollNumber: text("roll_number").unique().notNull(),
  status: text("status").notNull(), // 'Studying' | 'Passout'
  groupId: text("group_id").references(() => studentGroups.id),
  ...timestamps,
});

export const admins = pgTable("admins", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id),
  facultyId: text("faculty_id").unique().notNull(),
  department: text("department").notNull(),
  isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
  managedGroups: jsonb("managed_groups").$type<string[]>(), // Array of student_group IDs
  ...timestamps,
});

// --- Relations ---

export const labSubjectsRelations = relations(labSubjects, ({ many }) => ({
  questions: many(labQuestions),
  externals: many(labExternals),
}));

export const labQuestionsRelations = relations(labQuestions, ({ one }) => ({
  subject: one(labSubjects, {
    fields: [labQuestions.subjectId],
    references: [labSubjects.id],
  }),
}));

export const labExternalsRelations = relations(
  labExternals,
  ({ one, many }) => ({
    subject: one(labSubjects, {
      fields: [labExternals.subjectId],
      references: [labSubjects.id],
    }),
    questions: many(labExternalQuestions),
  }),
);

export const labExternalQuestionsRelations = relations(
  labExternalQuestions,
  ({ one }) => ({
    external: one(labExternals, {
      fields: [labExternalQuestions.externalId],
      references: [labExternals.id],
    }),
    question: one(labQuestions, {
      fields: [labExternalQuestions.questionId],
      references: [labQuestions.id],
    }),
  }),
);

export const studentGroupsRelations = relations(studentGroups, ({ many }) => ({
  students: many(students),
}));

export const studentsRelations = relations(students, ({ one }) => ({
  user: one(user, {
    fields: [students.userId],
    references: [user.id],
  }),
  group: one(studentGroups, {
    fields: [students.groupId],
    references: [studentGroups.id],
  }),
}));

export const adminsRelations = relations(admins, ({ one }) => ({
  user: one(user, {
    fields: [admins.userId],
    references: [user.id],
  }),
}));
