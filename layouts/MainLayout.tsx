// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import Loader from "../components/Loader";
import useRedirection from "@/hooks/useRedirection";
import { useRouter } from "next/router";
import getInitialData from "@/lib/client/getInitialData";

interface Props {
  children: ReactNode;
}

export default function ({ children }: Props) {
  const { status } = useSession();
  const router = useRouter();
  const redirection = useRedirection();
  const routeExists = router.route === "/_error" ? false : true;

  getInitialData();

  if (status === "authenticated" && !redirection && routeExists)
    return (
      <>
        <Sidebar />
        <div className="ml-80">
          <Navbar />
          {children}
        </div>
      </>
    );
  else if ((status === "unauthenticated" && !redirection) || !routeExists)
    return <>{children}</>;
  else return <Loader />;
}
