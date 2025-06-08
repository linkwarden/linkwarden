import DeleteUserModal from "@/components/ModalContent/DeleteUserModal";
import { useConfig } from "@linkwarden/router/config";
import { User as U } from "@linkwarden/prisma/client";
import { TFunction } from "i18next";
import { Button } from "./ui/Button";

interface User extends U {
  subscriptions: {
    active: boolean;
  };
}
type UserModal = {
  isOpen: boolean;
  userId: number | null;
};

interface UserListingProps {
  users: User[];
  deleteUserModal: UserModal;
  setDeleteUserModal: (modal: UserModal) => void;
  t: TFunction<"translation", undefined>;
}

const UserListing: React.FC<UserListingProps> = ({
  users,
  deleteUserModal,
  setDeleteUserModal,
  t,
}) => {
  const { data: config } = useConfig();

  return (
    <div className="overflow-x-auto whitespace-nowrap w-full">
      <table className="table w-full">
        <thead>
          <tr>
            <th></th>
            <th>{t("username")}</th>
            {config?.EMAIL_PROVIDER && <th>{t("email")}</th>}
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
              {config?.EMAIL_PROVIDER && <td>{user.email}</td>}
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden group-hover:block hover:text-error absolute z-20 right-[0.35rem] top-[0.35rem]"
                  onClick={() =>
                    setDeleteUserModal({ isOpen: true, userId: user.id })
                  }
                >
                  <i className="bi bi-trash"></i>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {deleteUserModal.isOpen && deleteUserModal.userId && (
        <DeleteUserModal
          onClose={() => setDeleteUserModal({ isOpen: false, userId: null })}
          userId={deleteUserModal.userId}
        />
      )}
    </div>
  );
};

export default UserListing;
