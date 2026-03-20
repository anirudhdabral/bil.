import type { DefaultSession } from "next-auth";

import type { UserRole } from "../models/User";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      approved: boolean;
      existedBeforeSignIn: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
    approved: boolean;
    existedBeforeSignIn: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    approved?: boolean;
    existedBeforeSignIn?: boolean;
  }
}
