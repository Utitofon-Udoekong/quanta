import { DefaultSession, DefaultUser } from "next-auth";
import { User as PrismaUser } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isCreator: boolean;
      isAdmin: boolean;
      walletAddress: string;
    } & DefaultSession["user"];
  }

  interface User extends Omit<DefaultUser, "id"> {
    id: string;
    isCreator: boolean;
    isAdmin: boolean;
    walletAddress: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isCreator: boolean;
    isAdmin: boolean;
    walletAddress: string;
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    id: string;
    email: string;
    emailVerified: Date | null;
    name: string | null;
    image: string | null;
    isCreator: boolean;
    isAdmin: boolean;
    walletAddress: string;
  }
} 