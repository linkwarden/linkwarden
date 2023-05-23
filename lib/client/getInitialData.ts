// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import useCollectionStore from "@/store/collections";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import useTagStore from "@/store/tags";
import useLinkStore from "@/store/links";
import useAccountStore from "@/store/account";

export default function () {
  const { status, data } = useSession();
  const { setCollections } = useCollectionStore();
  const { setTags } = useTagStore();
  const { setLinks } = useLinkStore();
  const { setAccount } = useAccountStore();

  useEffect(() => {
    if (status === "authenticated") {
      setCollections();
      setTags();
      setLinks();
      setAccount(data.user.email as string);
    }
  }, [status]);
}
