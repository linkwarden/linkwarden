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

  useEffect(() => {
    // fetch users
    fetch("/api/v1/users")
      .then((res) => res.json())
      .then((data) => setUsers(data.response));
  }, []);

  return (
    <div className="max-w-5xl mx-auto mt-5 px-5">
      <div className="gap-2 inline-flex items-center">
        <Link
          href="/dashboard"
          className="text-neutral btn btn-square btn-sm btn-ghost"
        >
          <i className="bi-chevron-left text-xl"></i>
        </Link>
        <p className="capitalize text-3xl font-thin inline">
          User Administration
        </p>
      </div>

      <div className="divider my-3"></div>

      {users && users.length > 0 ? (
        <div className="overflow-x-auto whitespace-nowrap w-full">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th></th>
                <th>Username</th>
                {process.env.NEXT_PUBLIC_EMAIL_PROVIDER === "true" && (
                  <th>Email</th>
                )}
                {process.env.NEXT_PUBLIC_STRIPE === "true" && (
                  <th>Subscribed</th>
                )}
                <th>Created At</th>
                <th>Updated At</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id}>
                  <td>{index + 1}</td>
                  <td>{user.username}</td>
                  {process.env.NEXT_PUBLIC_EMAIL_PROVIDER === "true" && (
                    <td>{user.email}</td>
                  )}
                  {process.env.NEXT_PUBLIC_STRIPE === "true" && (
                    <td>{user.subscriptions.active ? "Yes" : "No"}</td>
                  )}
                  <td>{new Date(user.createdAt).toLocaleString()}</td>
                  <td>{new Date(user.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No users found.</p>
      )}
    </div>
  );
}
