import { parseRollNumber } from "../src/lib/jntu";

const testCases = [
  { email: "23951A052X@iare.ac.in", expectedRole: "student", validRoll: true },
  { email: "faculty.name@iare.ac.in", expectedRole: "admin", validRoll: false },
  { email: "21951A0501@iare.ac.in", expectedRole: "student", validRoll: true },
  { email: "random.user@gmail.com", expectedRole: "admin", validRoll: false }, // Logic would treat as admin if domain check passed, but domain check is separate
];

console.log("Verifying Auth Logic...");

let passed = 0;
let failed = 0;

testCases.forEach(({ email, expectedRole, validRoll }) => {
  const username = email.split("@")[0];
  const rollDetails = parseRollNumber(username);

  const isRoll = rollDetails?.isValid ?? false;
  const role = isRoll ? "student" : "admin";

  console.log(`Email: ${email}`);
  console.log(`  Username: ${username}`);
  console.log(`  Is Roll Number: ${isRoll} (Expected: ${validRoll})`);
  console.log(`  Assigned Role: ${role} (Expected: ${expectedRole})`);

  if (isRoll === validRoll && role === expectedRole) {
    console.log("  ✅ PASS");
    passed++;
  } else {
    console.log("  ❌ FAIL");
    failed++;
  }
  console.log("---");
});

console.log(`Total: ${testCases.length}, Passed: ${passed}, Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
