import NewUserModal from "@/components/ModalContent/NewUserModal";
import { User as U } from "@prisma/client";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps";
import UserListing from "@/components/UserListing";
import { useUsers } from "@/hooks/store/admin/users";
import Divider from "@/components/ui/Divider";

interface User extends U {
  subscriptions: {
    active: boolean;
  };
}

type UserModal = {
  isOpen: boolean;
  userId: number | null;
};

export default function Admin() {
  const { t } = useTranslation();

  const { data: users = [] } = useUsers();

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[] | null>(null);

  const [deleteUserModal, setDeleteUserModal] = useState<UserModal>({
    isOpen: false,
    userId: null,
  });

  const [newUserModal, setNewUserModal] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (users) {
      const filtered = users.filter((user: any) =>
        JSON.stringify(user).toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-5">
      <div className="flex sm:flex-row flex-col justify-between gap-2">
        <div className="gap-2 inline-flex items-center">
          <Link
            href="/dashboard"
            className="text-neutral btn btn-square btn-sm btn-ghost"
          >
            <i className="bi-chevron-left text-xl"></i>
          </Link>
          <p className="capitalize text-3xl font-thin inline">
            {t("user_administration")}
          </p>
        </div>

        <div className="flex items-center relative justify-between gap-2">
          <div>
            <label
              htmlFor="search-box"
              className="inline-flex items-center w-fit absolute left-1 pointer-events-none rounded-md p-1 text-primary"
            >
              <i className="bi-search"></i>
            </label>

            <input
              id="search-box"
              type="text"
              placeholder={t("search_users")}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="border border-neutral-content bg-base-200 focus:border-primary py-1 rounded-md pl-9 pr-2 w-full max-w-[15rem] md:w-[15rem] md:max-w-full duration-200 outline-none"
            />
          </div>

          <div
            onClick={() => setNewUserModal(true)}
            className="flex items-center btn btn-accent dark:border-violet-400 text-white btn-sm px-2 aspect-square relative"
          >
            <i className="bi-plus text-3xl absolute"></i>
          </div>
        </div>
      </div>

      <Divider className="my-3" />

      {searchQuery && filteredUsers && filteredUsers.length > 0 ? (
        <UserListing
          users={filteredUsers}
          deleteUserModal={deleteUserModal}
          setDeleteUserModal={setDeleteUserModal}
          t={t}
        />
      ) : searchQuery ? (
        <p>{t("no_user_found_in_search")}</p>
      ) : users && users.length > 0 ? (
        <UserListing
          users={users}
          deleteUserModal={deleteUserModal}
          setDeleteUserModal={setDeleteUserModal}
          t={t}
        />
      ) : (
        <p>{t("no_users_found")}</p>
      )}

      {newUserModal && <NewUserModal onClose={() => setNewUserModal(false)} />}
    </div>
  );
}

export { getServerSideProps };
