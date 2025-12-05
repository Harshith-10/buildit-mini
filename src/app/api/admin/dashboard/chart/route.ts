import { count, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { labExternals, user } from "@/db/schema";
import { getUserContext, requireRole } from "@/lib/proxy";

export async function GET() {
  const context = await getUserContext();
  if (!requireRole(context, ["admin", "super_admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get monthly user registrations for the current year
    const currentYear = new Date().getFullYear();

    const monthlyData = await db
      .select({
        month: sql<number>`EXTRACT(MONTH FROM ${user.createdAt})`,
        count: count(),
      })
      .from(user)
      .where(sql`EXTRACT(YEAR FROM ${user.createdAt}) = ${currentYear}`)
      .groupBy(sql`EXTRACT(MONTH FROM ${user.createdAt})`)
      .orderBy(sql`EXTRACT(MONTH FROM ${user.createdAt})`);

    // Get monthly externals scheduled for the current year
    const monthlyExternals = await db
      .select({
        month: sql<number>`EXTRACT(MONTH FROM ${labExternals.schedule})`,
        count: count(),
      })
      .from(labExternals)
      .where(sql`EXTRACT(YEAR FROM ${labExternals.schedule}) = ${currentYear}`)
      .groupBy(sql`EXTRACT(MONTH FROM ${labExternals.schedule})`)
      .orderBy(sql`EXTRACT(MONTH FROM ${labExternals.schedule})`);

    // Create a map of months to counts
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const usersMap = new Map(monthlyData.map((d) => [d.month, d.count]));
    const externalsMap = new Map(
      monthlyExternals.map((d) => [d.month, d.count]),
    );

    // Build the chart data for all 12 months
    const chartData = monthNames.map((name, index) => ({
      name,
      users: usersMap.get(index + 1) ?? 0,
      externals: externalsMap.get(index + 1) ?? 0,
    }));

    return NextResponse.json(chartData);
  } catch (error) {
    console.error("Failed to fetch chart data:", error);
    return NextResponse.json(
      { error: "Failed to fetch chart data" },
      { status: 500 },
    );
  }
}
