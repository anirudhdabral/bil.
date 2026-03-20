import { NextResponse } from "next/server";

import { connectToDatabase } from "../../../../lib/mongodb";
import User, { USER_ROLES } from "../../../../models/User";

const MAX_PENDING_USERS = 3;

export async function GET() {
  try {
    await connectToDatabase();
    const pendingUsers = await User.countDocuments({
      approved: false,
      role: USER_ROLES.USER,
    });

    return NextResponse.json({
      paused: pendingUsers >= MAX_PENDING_USERS,
      pendingUsers,
      maxPendingUsers: MAX_PENDING_USERS,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load sign-in status" },
      { status: 500 }
    );
  }
}
