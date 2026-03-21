import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../../../../lib/auth";
import { connectToDatabase } from "../../../../lib/mongodb";
import User, { USER_ROLES } from "../../../../models/User";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }

  if (session.user.role !== USER_ROLES.SUPER_ADMIN) {
    throw new Error("FORBIDDEN");
  }

  return session;
}

export async function GET() {
  try {
    await requireSuperAdmin();
    await connectToDatabase();

    const users = await User.find({})
      .sort({ approved: 1, role: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return errorResponse("Authentication required", 401);
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return errorResponse("SUPER_ADMIN access required", 403);
    }

    return errorResponse(error instanceof Error ? error.message : "Failed to load users", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireSuperAdmin();

    const body = (await request.json()) as { userId?: string; approved?: boolean };
    const userId = body.userId?.trim();
    const approved = body.approved;

    if (!userId || typeof approved !== "boolean") {
      return errorResponse("userId and approved are required", 400);
    }

    await connectToDatabase();
    const user = await User.findOneAndUpdate(
      { _id: userId, role: USER_ROLES.USER },
      { approved },
      { new: true }
    ).lean();

    if (!user) {
      return errorResponse("User not found", 404);
    }

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return errorResponse("Authentication required", 401);
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return errorResponse("SUPER_ADMIN access required", 403);
    }

    return errorResponse(error instanceof Error ? error.message : "Failed to update user", 500);
  }
}
