import DeleteUserModal from "@/components/ModalContent/DeleteUserModal";
import NewUserModal from "@/components/ModalContent/NewUserModal";
import useUserStore from "@/store/admin/users";
import { User as U } from "@prisma/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps";

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

  const { users, setUsers } = useUserStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>();

  const [deleteUserModal, setDeleteUserModal] = useState<UserModal>({
    isOpen: false,
    userId: null,
  });

  const [newUserModal, setNewUserModal] = useState(false);

  useEffect(() => {
    setUsers();
  }, []);

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
              placeholder={"Search for Users"}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);

                if (users) {
                  setFilteredUsers(
                    users.filter((user) =>
                      JSON.stringify(user)
                        .toLowerCase()
                        .includes(e.target.value.toLowerCase())
                    )
                  );
                }
              }}
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

      <div className="divider my-3"></div>

      {filteredUsers && filteredUsers.length > 0 && searchQuery !== "" ? (
        UserListing(filteredUsers, deleteUserModal, setDeleteUserModal)
      ) : searchQuery !== "" ? (
        <p>No users found with the given search query.</p>
      ) : users && users.length > 0 ? (
        UserListing(users, deleteUserModal, setDeleteUserModal)
      ) : (
        <p>No users found.</p>
      )}

      {newUserModal ? (
        <NewUserModal onClose={() => setNewUserModal(false)} />
      ) : null}
    </div>
  );
}

const UserListing = (
  users: User[],
  deleteUserModal: UserModal,
  setDeleteUserModal: Function
) => {
  return (
    <div className="overflow-x-auto whitespace-nowrap w-full">
      <table className="table w-full">
        <thead>
          <tr>
            <th></th>
            <th>Username</th>
            {process.env.NEXT_PUBLIC_EMAIL_PROVIDER === "true" && (
              <th>Email</th>
            )}
            {process.env.NEXT_PUBLIC_STRIPE === "true" && <th>Subscribed</th>}
            <th>Created At</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr
              key={index}
              className="group hover:bg-neutral-content hover:bg-opacity-30 duration-100"
            >
              <td className="text-primary">{index + 1}</td>
              <td>{user.username ? user.username : <b>N/A</b>}</td>
              {process.env.NEXT_PUBLIC_EMAIL_PROVIDER === "true" && (
                <td>{user.email}</td>
              )}
              {process.env.NEXT_PUBLIC_STRIPE === "true" && (
                <td>
                  {user.subscriptions?.active ? (
                    JSON.stringify(user.subscriptions?.active)
                  ) : (
                    <b>N/A</b>
                  )}
                </td>
              )}
              <td>{new Date(user.createdAt).toLocaleString()}</td>
              <td className="relative">
                <button
                  className="btn btn-sm btn-ghost duration-100 hidden group-hover:block absolute z-20 right-[0.35rem] top-[0.35rem]"
                  onClick={() =>
                    setDeleteUserModal({ isOpen: true, userId: user.id })
                  }
                >
                  <i className="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {deleteUserModal.isOpen && deleteUserModal.userId ? (
        <DeleteUserModal
          onClose={() => setDeleteUserModal({ isOpen: false, userId: null })}
          userId={deleteUserModal.userId}
        />
      ) : null}
    </div>
  );
};

export { getServerSideProps };
