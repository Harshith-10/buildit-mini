import { NextResponse } from "next/server";
import { getUserContext } from "@/lib/proxy";

export async function GET() {
  const context = await getUserContext();

  if (!context) {
    return NextResponse.json({ role: "guest" }, { status: 200 });
  }

  return NextResponse.json({
    role: context.role,
    user: context.user,
    studentDetails: context.studentDetails,
    adminDetails: context.adminDetails,
  });
}
