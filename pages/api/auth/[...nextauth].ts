import { prisma } from "@/lib/api/db";
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuthOptions } from "next-auth";
import bcrypt from "bcrypt";
import EmailProvider from "next-auth/providers/email";

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    // EmailProvider({
    //   server: process.env.EMAIL_SERVER,
    //   from: process.env.EMAIL_FROM,
    // }),
    CredentialsProvider({
      type: "credentials",
      credentials: {
        username: {
          label: "Username",
          type: "text",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials, req) {
        if (!credentials) return null;

        // const { username, password } = credentials as {
        //   id: number;
        //   username: string;
        //   password: string;
        // };

        console.log(credentials);

        const findUser = await prisma.user.findFirst({
          where: {
            username: credentials.username.toLowerCase(),
          },
        });

        let passwordMatches: boolean = false;

        if (findUser?.password) {
          passwordMatches = bcrypt.compareSync(
            credentials.password,
            findUser.password
          );
        }

        console.log({
          id: findUser?.id,
          name: findUser?.name,
          username: findUser?.username.toLowerCase(),
        });

        if (passwordMatches) {
          return {
            id: findUser?.id,
            name: findUser?.name,
            email: findUser?.username.toLowerCase(),
          };
        } else return null as any;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session: async ({ session, token }) => {
      console.log("TOKEN:", token);
      session.user.id = parseInt(token?.sub as any);
      session.user.username = session.user.email;
      console.log("SESSION:", session);

      return session;
    },
    // Using the `...rest` parameter to be able to narrow down the type based on `trigger`
    jwt({ token, trigger, session }) {
      if (trigger === "update" && session?.name && session?.username) {
        // Note, that `session` can be any arbitrary object, remember to validate it!
        token.name = session.name;
        token.username = session.username.toLowerCase();
        token.email = session.email.toLowerCase();
      }
      return token;
    },
  },
};

export default NextAuth(authOptions);
