import { eq } from "drizzle-orm";
import { db } from "../src/db";
import {
  labExternals,
  labQuestions,
  labSubjects,
  studentGroups,
} from "../src/db/schema";

async function main() {
  console.log("Starting verification...");

  // 1. Create a Student Group
  console.log("Creating Student Group...");
  const [group] = await db
    .insert(studentGroups)
    .values({
      batch: "Test Batch",
      branch: "CSE",
      section: "A",
      semester: 1,
      regulation: "R24",
    })
    .returning();
  console.log("Created Group:", group.id);

  // 2. Create a Lab Subject
  console.log("Creating Lab Subject...");
  const [subject] = await db
    .insert(labSubjects)
    .values({
      title: "Test Subject",
      description: "Test Description",
      batches: ["Test Batch"],
      regulation: "R24",
    })
    .returning();
  console.log("Created Subject:", subject.id);

  // 3. Create a Lab Question
  console.log("Creating Lab Question...");
  const [question] = await db
    .insert(labQuestions)
    .values({
      title: "Test Question",
      description: "Test Description",
      examples: [{ input: "1", output: "1" }],
      testCases: [{ input: "1", output: "1" }],
      subjectId: subject.id,
    })
    .returning();
  console.log("Created Question:", question.id);

  // 4. Create a Lab External
  console.log("Creating Lab External...");
  const [external] = await db
    .insert(labExternals)
    .values({
      subjectId: subject.id,
      duration: 60,
      schedule: new Date(),
    })
    .returning();
  console.log("Created External:", external.id);

  // 5. Soft Delete Question
  console.log("Soft Deleting Question...");
  await db
    .update(labQuestions)
    .set({ isDeleted: true })
    .where(eq(labQuestions.id, question.id));

  const fetchedQuestion = await db.query.labQuestions.findFirst({
    where: eq(labQuestions.id, question.id),
  });
  console.log("Fetched Question isDeleted:", fetchedQuestion?.isDeleted);

  console.log("Verification complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
