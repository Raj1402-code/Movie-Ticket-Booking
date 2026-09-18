import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { query } from "./db";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const result = await query('SELECT * FROM users WHERE email = $1', [credentials.email]);
        const user = result.rows[0];

        if (user && user.password_hash) {
          const isValid = await bcrypt.compare(credentials.password, user.password_hash);
          if (isValid) {
            return { id: user.id.toString(), name: user.name, email: user.email };
          }
        }
        return null;
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        // Auto-register user in DB if they don't exist
        try {
          const result = await query('SELECT * FROM users WHERE email = $1', [user.email]);
          if (result.rows.length === 0) {
            await query(
              'INSERT INTO users (name, email) VALUES ($1, $2)',
              [user.name || "Google User", user.email]
            );
          }
        } catch (error) {
          console.error("Error linking google user to db:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session?.user && session.user.email) {
        // Retrieve ID from DB based on email to ensure consistent ID across providers
        try {
           let result = await query('SELECT id FROM users WHERE email = $1', [session.user.email]);
           
           // If user is authenticated but missing from DB (e.g. DB was reset), auto-register them
           if (result.rows.length === 0) {
             const insertResult = await query(
               'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id',
               [session.user.name || "User", session.user.email]
             );
             (session.user as any).id = insertResult.rows[0].id;
           } else {
             (session.user as any).id = result.rows[0].id;
           }
        } catch (error) {
           console.error("Error fetching user ID for session:", error);
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
