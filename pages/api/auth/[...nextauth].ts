// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { prisma } from "@/lib/api/db";
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
          id: number;
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

        let passwordMatches: boolean = false;

        if (findUser?.password) {
          passwordMatches = bcrypt.compareSync(password, findUser.password);
        }

        console.log(passwordMatches);

        if (passwordMatches) {
          return {
            id: findUser?.id,
            name: findUser?.name,
            email: findUser?.email,
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
      session.user.id = parseInt(token?.sub as any);

      return session;
    },
  },
};

export default NextAuth(authOptions);
