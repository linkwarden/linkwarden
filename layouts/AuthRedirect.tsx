// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import Loader from "../components/Loader";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import getInitialData from "@/lib/client/getInitialData";

interface Props {
  children: ReactNode;
}

export default function ({ children }: Props) {
  const router = useRouter();
  const { status } = useSession();
  const [redirect, setRedirect] = useState(true);

  getInitialData();

  useEffect(() => {
    if (!router.pathname.startsWith("/public")) {
      if (
        status === "authenticated" &&
        (router.pathname === "/login" || router.pathname === "/register")
      ) {
        router.push("/").then(() => {
          setRedirect(false);
        });
      } else if (
        status === "unauthenticated" &&
        !(router.pathname === "/login" || router.pathname === "/register")
      ) {
        router.push("/login").then(() => {
          setRedirect(false);
        });
      } else if (status === "loading") setRedirect(true);
      else setRedirect(false);
    } else {
      setRedirect(false);
    }
  }, [status]);

  if (status !== "loading" && !redirect) return <>{children}</>;
  else return <></>;
}
