import DeleteUserModal from "@/components/ModalContent/DeleteUserModal";
import { User as U } from "@prisma/client";
import { TFunction } from "i18next";

interface User extends U {
  subscriptions: {
    active: boolean;
  };
}

type UserModal = {
  isOpen: boolean;
  userId: number | null;
};

const UserListing = (
  users: User[],
  deleteUserModal: UserModal,
  setDeleteUserModal: Function,
  t: TFunction<"translation", undefined>
) => {
  return (
    <div className="overflow-x-auto whitespace-nowrap w-full">
      <table className="table w-full">
        <thead>
          <tr>
            <th></th>
            <th>{t("username")}</th>
            {process.env.NEXT_PUBLIC_EMAIL_PROVIDER === "true" && (
              <th>{t("email")}</th>
            )}
            {process.env.NEXT_PUBLIC_STRIPE === "true" && (
              <th>{t("subscribed")}</th>
            )}
            <th>{t("created_at")}</th>
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
              <td>
                {user.username ? user.username : <b>{t("not_available")}</b>}
              </td>
              {process.env.NEXT_PUBLIC_EMAIL_PROVIDER === "true" && (
                <td>{user.email}</td>
              )}
              {process.env.NEXT_PUBLIC_STRIPE === "true" && (
                <td>
                  {user.subscriptions?.active ? (
                    <i className="bi bi-check text-green-500"></i>
                  ) : (
                    <i className="bi bi-x text-red-500"></i>
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

export default UserListing;
