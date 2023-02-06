import { prisma } from "@/lib/db";
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuthOptions } from "next-auth";
import bcrypt from "bcrypt";

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      type: "credentials",
      credentials: {},
      async authorize(credentials, req) {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        console.log(email, password);

        const findUser = await prisma.user.findFirst({
          where: {
            email: email,
          },
        });

        console.log(findUser);

        // const findUser = await prisma.user.findMany({
        //   where: {
        //     email: email,
        //   },
        //   include: {
        //     collections: {
        //       include: {
        //         collection: true,
        //       },
        //     },
        //   },
        // });

        // console.log("BOOM!", findUser[0].collections);

        let passwordMatches: boolean = false;

        if (findUser?.password) {
          passwordMatches = bcrypt.compareSync(password, findUser.password);
        }

        if (passwordMatches) {
          return { name: findUser?.name, email: findUser?.email };
        } else return null as any;
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
};

export default NextAuth(authOptions);
