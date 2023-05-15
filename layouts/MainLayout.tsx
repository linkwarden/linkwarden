// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import Loader from "../components/Loader";
import useRedirect from "@/hooks/useRedirect";
import { useRouter } from "next/router";

interface Props {
  children: ReactNode;
}

export default function ({ children }: Props) {
  const { status } = useSession();
  const router = useRouter();
  const redirect = useRedirect();
  const routeExists = router.route === "/_error" ? false : true;

  if (status === "authenticated" && !redirect && routeExists)
    return (
      <div className="flex">
        <div className="hidden lg:block">
          <Sidebar className="fixed" />
        </div>

        <div className="w-full lg:ml-64 xl:ml-80">
          <Navbar />
          {children}
        </div>
      </div>
    );
  else if ((status === "unauthenticated" && !redirect) || !routeExists)
    return <>{children}</>;
  else return <></>;
}
