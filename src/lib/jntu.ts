/**
 * Validates a JNTU Roll Number based on specific format rules.
 * @param {string} rollNo - The roll number to validate (e.g., "23951A052X")
 * @returns {object|null} - Returns parsed details if valid, or null if invalid.
 */
export function parseRollNumber(rollNo: string) {
  // 1. Normalize input (uppercase, remove whitespace)
  const cleanRollNo = rollNo.trim().toUpperCase();

  // 2. Define the Regex Parts
  // Group 1: Year (2 digits)
  const year = "(\\d{2})";

  // Group 2: College Code (2 alphanumeric)
  const college = "([A-Z0-9]{2})";

  // Group 3: Type (1 or 5)
  const type = "([15])";

  // Group 4: Course Code (Specific letters)
  const course = "([ADEFRST])";

  // Group 5: Branch Code (Strict whitelist based on your provided list)
  // Matches: 00-08, 10-13, 15, 19, 21-23, 38, 57, 58
  const branch = "(0[0-8]|1[0-359]|2[1-3]|38|5[78])";

  // Group 6: Serial No (Digit followed by Alphanumeric)
  // Matches 00-0Z, 10-1Z, etc.
  const serial = "(\\d[A-Z0-9])";

  // Combine pattern
  const pattern = new RegExp(
    `^${year}${college}${type}${course}${branch}${serial}$`,
  );

  // 3. Execute Match
  const match = cleanRollNo.match(pattern);

  if (!match) {
    return null; // Invalid format
  }

  // 4. Return structured data (Optional, useful for your platform)
  return {
    isValid: true,
    fullString: match[0],
    details: {
      yearOfAdmission: `20${match[1]}`,
      collegeCode: match[2],
      typeOfCourse: match[3] === "1" ? "Regular" : "Lateral Entry",
      courseCode: match[4],
      branchCode: match[5],
      serialNumber: match[6],
    },
  };
}
