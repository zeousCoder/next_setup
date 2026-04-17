import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { sqlQuery } from "@/lib/db/mysql";

interface DBUser {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        type: { label: "Type", type: "text" },
      },

      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const type = credentials?.type as string | undefined;

        if (!email || !password) return null;

        const result = await sqlQuery<DBUser[]>(
          `SELECT id, name, email, password, role
           FROM login_details
           WHERE email = ?
           LIMIT 1`,
          [email],
        );

        if (!Array.isArray(result) || result.length === 0) return null;

        const user = result[0];

        if (type && user.role !== type) return null;

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt", // Stateless authentication
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
      }

      return {
        ...session,
      };
    },
  },

  pages: {
    signIn: "/login",
  },
});
