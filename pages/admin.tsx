import { User as U } from "@prisma/client";
import Link from "next/link";
import { useEffect, useState } from "react";

interface User extends U {
  subscriptions: {
    active: boolean;
  };
}

export default function Admin() {
  const [users, setUsers] = useState<User[]>();

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>();

  useEffect(() => {
    // fetch users
    fetch("/api/v1/users")
      .then((res) => res.json())
      .then((data) => setUsers(data.response));
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
          <p className="capitalize sm:text-3xl text-2xl font-thin inline">
            User Administration
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

          <div className="flex items-center btn btn-accent dark:border-violet-400 text-white btn-sm px-2 aspect-square relative">
            <i className="bi-plus text-3xl absolute"></i>
          </div>
        </div>
      </div>

      <div className="divider my-3"></div>

      {filteredUsers && filteredUsers.length > 0 && searchQuery !== "" ? (
        UserLising(filteredUsers)
      ) : searchQuery !== "" ? (
        <p>No users found with the given search query.</p>
      ) : users && users.length > 0 ? (
        UserLising(users)
      ) : (
        <p>No users found.</p>
      )}
    </div>
  );
}

const UserLising = (users: User[]) => {
  return (
    <div className="overflow-x-auto whitespace-nowrap w-full">
      <table className="table table-zebra w-full">
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
            <tr key={user.id}>
              <td className="rounded-tl">{index + 1}</td>
              <td>{user.username}</td>
              {process.env.NEXT_PUBLIC_EMAIL_PROVIDER === "true" && (
                <td>{user.email}</td>
              )}
              {process.env.NEXT_PUBLIC_STRIPE === "true" && (
                <td>{JSON.stringify(user.subscriptions.active)}</td>
              )}
              <td>{new Date(user.createdAt).toLocaleString()}</td>
              <td>
                <button className="btn btn-sm btn-ghost">
                  <i className="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
