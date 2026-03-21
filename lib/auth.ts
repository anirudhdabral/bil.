import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import User, { USER_ROLES } from "../models/User";
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

  // Check existence before the upsert so we can track new vs returning users.
  // This is only called once per login (jwt callback guards with !user check),
  // so the extra read is acceptable.
  const alreadyExisted = await User.exists({ email: normalizedEmail });

  // Single upsert: $set refreshes profile fields (name/image) on every login;
  // $setOnInsert sets role/approved only when creating a new document so that
  // any admin-granted role or approval status already in the DB is preserved.
  const dbUser = await User.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        email: normalizedEmail,
        ...(name?.trim() ? { name: name.trim() } : {}),
        ...(image?.trim() ? { image: image.trim() } : {}),
        // Super-admin always gets elevated role + approved on every login
        ...(isSuperAdmin ? { role: USER_ROLES.SUPER_ADMIN, approved: true } : {}),
      },
      $setOnInsert: {
        // Only applied when the document is brand-new (upsert insert)
        ...(!isSuperAdmin ? { role: USER_ROLES.USER, approved: false } : {}),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return {
    dbUser,
    existedBeforeSignIn: Boolean(alreadyExisted),
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
    async jwt({ token, user, trigger }) {
      // Only sync with DB on initial sign-in (user object is present)
      // or when an explicit session update is triggered.
      // On every other call (session polls, page navigations) just return
      // the existing token — avoids a MongoDB round-trip per request and
      // prevents transient DB errors from invalidating the session.
      if (!user && trigger !== "update") {
        return token;
      }

      const normalizedEmail = (user?.email ?? token.email)?.trim().toLowerCase();
      if (!normalizedEmail) {
        return token;
      }

      const result = await syncUserAccess({
        email: normalizedEmail,
        name: user?.name ?? token.name,
        image: user?.image ?? (typeof token.picture === "string" ? token.picture : null),
      });

      if (!result.dbUser) {
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
