import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import User, { USER_ROLES, type UserRole } from "../models/User";
import { connectToDatabase } from "./mongodb";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const superAdminEmail = process.env.SUPER_ADMIN?.trim().toLowerCase() ?? "";

if (!googleClientId || !googleClientSecret) {
  throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables.");
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("Missing NEXTAUTH_SECRET environment variable.");
}

type SyncUserInput = {
  email: string;
  name?: string | null;
  image?: string | null;
};

async function syncUserAccess({ email, name, image }: SyncUserInput) {
  await connectToDatabase();

  const normalizedEmail = email.trim().toLowerCase();
  const isSuperAdmin = !!superAdminEmail && normalizedEmail === superAdminEmail;
  const existingUser = await User.findOne({ email: normalizedEmail });

  const nextRole: UserRole = isSuperAdmin ? USER_ROLES.SUPER_ADMIN : (existingUser?.role ?? USER_ROLES.USER);
  const nextApproved = isSuperAdmin ? true : (existingUser?.approved ?? false);

  const dbUser = await User.findOneAndUpdate(
    { email: normalizedEmail },
    {
      email: normalizedEmail,
      name: name?.trim() || existingUser?.name || null,
      image: image?.trim() || existingUser?.image || null,
      role: nextRole,
      approved: nextApproved,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return {
    allowed: true as const,
    dbUser,
    existedBeforeSignIn: Boolean(existingUser),
  };
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 365 * 50,
    updateAge: 60 * 60 * 24 * 30,
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 365 * 50,
  },
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      const normalizedEmail = user.email?.trim().toLowerCase();
      if (!normalizedEmail) {
        return false;
      }

      await syncUserAccess({
        email: normalizedEmail,
        name: user.name,
        image: user.image,
      });

      return true;
    },
    async jwt({ token, user }) {
      const normalizedEmail = (user?.email ?? token.email)?.trim().toLowerCase();
      if (!normalizedEmail) {
        return token;
      }

      const result = await syncUserAccess({
        email: normalizedEmail,
        name: user?.name ?? token.name,
        image: user?.image ?? (typeof token.picture === "string" ? token.picture : null),
      });

      if (!result.allowed || !result.dbUser) {
        return token;
      }

      token.id = result.dbUser._id.toString();
      token.email = normalizedEmail;
      token.role = result.dbUser.role;
      token.approved = result.dbUser.approved;
      token.existedBeforeSignIn = result.existedBeforeSignIn;
      token.picture = result.dbUser.image ?? token.picture;

      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      session.user.id = token.id ?? "";
      session.user.role = token.role ?? USER_ROLES.USER;
      session.user.approved = Boolean(token.approved);
      session.user.existedBeforeSignIn = Boolean(token.existedBeforeSignIn);

      return session;
    },
  },
};
