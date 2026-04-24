import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { sqlQuery } from "@/lib/db/mysql";

export type UserRole =
  | "ADMIN"
  | "ADMINCHILD"
  | "COMPANY"
  | "COMPANYCHILD"
  | "VENDOR"
  | "VENDORCHILD";

interface DBUser {
  id: number;
  name?: string;
  email: string;
  password: string;
  type?: UserRole;
  superadmin?: string | null;
  is_admin?: string | null;
  is_company_admin?: string | null;
  company_id?: number | null;
  group_id?: number | null;
  LoginId?: string | null;
  VendorID?: string | null;
  status?: number | null;
  parent_id?: number | null;
  client_id?: number | null;
  groupName?: string | null;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email?: string;
      role?: UserRole;
      superadmin?: string;
      is_admin?: string;
      is_company_admin?: string;
      companyId?: number | null;
      groupId?: number | null;
      LoginId?: string | null;
      VendorID?: string | null;
      status?: number | null;
      parent_id?: number | null;
      client_id?: number | null;
      groupName?: string | null;
      allPermissCodes?: string[];
    } & DefaultSession["user"];
  }
  interface User {
    id: string;
    name?: string;
    email: string;
    role: UserRole;
    superadmin?: string;
    is_admin?: string;
    is_company_admin?: string;
    companyId?: number | null;
    groupId?: number | null;
    LoginId?: string | null;
    VendorID?: string | null;
    status?: number | null;
    parent_id?: number | null;
    client_id?: number | null;
    groupName?: string | null;
    allPermissCodes?: string[];
  }
}

declare module "next-auth" {
  interface JWT {
    id: string;
    role?: UserRole;
    superadmin?: string;
    is_admin?: string;
    is_company_admin?: string;
    companyId?: number | null;
    groupId?: number | null;
    name: string;
    email: string;
    LoginId?: string | null;
    VendorID?: string | null;
    status?: number | null;
    parent_id?: number | null;
    client_id?: number | null;
    groupName?: string | null;
    allPermissCodes?: string[];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET!,
  trustHost: true,

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        // Accepts an email OR a LoginID. Kept as `email` for backwards
        // compatibility with existing callers of signIn("credentials", { email }).
        email: { label: "Email or Login ID", type: "text" },
        password: { label: "Password", type: "password" },
        type: { label: "Type", type: "text" },
      },

      async authorize(credentials): Promise<any> {
        try {
          // Accept either an email or a LoginID in the same field.
          // Field is named `email` for backwards compatibility with existing
          // callers of signIn("credentials", { email: ... }).
          const identifier = credentials?.email as string;
          const password = credentials?.password as string;
          const type = credentials?.type as string | undefined;

          if (!identifier || !password) return null;

          let loginResult = await sqlQuery<DBUser[]>(
            `SELECT ld.id, ld.name, ld.email, ld.password, ld.type, ld.superadmin,
                    ld.is_admin, ld.is_company_admin, ld.company_id, ld.LoginId,
                    ld.VendorID, ld.group_id, ld.status=0 AS status,
                    ld.parrent_id AS parent_id, ld.CLIENT_ID AS client_id,
                    g.gr_name AS groupName
             FROM login_details ld
             LEFT JOIN tbl_group g ON g.id = ld.group_id
             WHERE ld.email = ? OR ld.LoginID = ?
             LIMIT 1`,
            [identifier, identifier],
            "db1",
          );

          // 👉 If not found, check child table (match on email or userName)
          if (
            !loginResult ||
            (Array.isArray(loginResult) && loginResult.length === 0)
          ) {
            loginResult = await sqlQuery<DBUser[]>(
              `SELECT cu.id, cu.email, cu.password, cu.type, cu.status=1 AS status,
                      cu.group_id, cu.VendorAutoID, cu.VendorID, cu.userName,
                      g.gr_name AS groupName
               FROM tbl_child_user cu
               LEFT JOIN tbl_group g ON g.id = cu.group_id
               WHERE cu.email = ? OR cu.userName = ?
               LIMIT 1`,
              [identifier, identifier],
              "db1",
            );
          }

          if (!Array.isArray(loginResult) || loginResult.length === 0)
            return null;

          const user = loginResult[0];
          if (type && user.type !== type) return null;

          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) return null;

          // Pull every active permission code assigned to the user's group.
          let allPermissCodes: string[] = [];
          if (user.group_id) {
            const permRows = await sqlQuery<{ p_code: string }[]>(
              `SELECT p.p_code
               FROM tbl_permission_group pg
               JOIN tbl_permission p ON p.id = pg.p_id
               WHERE pg.gr_id = ?
                 AND pg.status = 'Y'
                 AND p.p_status = 'Y'`,
              [user.group_id],
              "db1",
            );
            allPermissCodes = Array.isArray(permRows)
              ? permRows
                  .map((r) => r.p_code)
                  .filter((c): c is string => Boolean(c))
              : [];
          }

          return {
            id: String(user.id),
            name: user.name,
            email: user.email,
            role: user.type,
            superadmin: user.superadmin ?? "N",
            is_admin: user.is_admin ?? "N",
            is_company_admin: user.is_company_admin ?? "N",
            companyId: user.company_id ?? null,
            groupId: user.group_id ?? null,
            LoginId: user.LoginId ?? null,
            VendorID: user.VendorID ?? null,
            status: user.status ?? null,
            parent_id: user.parent_id ?? null,
            client_id: user.client_id ?? null,
            groupName: user.groupName ?? null,
            allPermissCodes,
          };
        } catch (error) {
          console.error("[auth] authorize failed:", error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 10 * 60, // 10 minutes
    updateAge: 1 * 60, // 1 minutes
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        token.id = u.id as string;
        token.role = u.role;
        token.superadmin = u.superadmin;
        token.is_admin = u.is_admin;
        token.is_company_admin = u.is_company_admin;
        token.companyId = u.companyId;
        token.groupId = u.groupId;
        token.name = u.name;
        token.email = u.email;
        token.LoginId = u.LoginId;
        token.VendorID = u.VendorID;
        token.status = u.status;
        token.parent_id = u.parent_id;
        token.client_id = u.client_id;
        token.groupName = u.groupName;
        token.allPermissCodes = u.allPermissCodes ?? [];
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.superadmin = token.superadmin as string;
        session.user.is_admin = token.is_admin as string;
        session.user.is_company_admin = token.is_company_admin as string;
        session.user.companyId = token.companyId as number | null;
        session.user.groupId = token.groupId as number | null;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.status = token.status as number | null;
        session.user.LoginId = token.LoginId as string | null;
        session.user.VendorID = token.VendorID as string | null;
        session.user.parent_id = token.parent_id as number | null;
        session.user.client_id = token.client_id as number | null;
        session.user.groupName = token.groupName as string | null;
        session.user.allPermissCodes =
          (token.allPermissCodes as string[] | undefined) ?? [];
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});
