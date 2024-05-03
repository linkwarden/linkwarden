import toast from "react-hot-toast";
import Modal from "../Modal";
import useUserStore from "@/store/admin/users";

type Props = {
  onClose: Function;
  userId: number;
};

export default function DeleteUserModal({ onClose, userId }: Props) {
  const { removeUser } = useUserStore();

  const deleteUser = async () => {
    const load = toast.loading("Deleting...");

    const response = await removeUser(userId);

    toast.dismiss(load);

    response.ok && toast.success(`User Deleted.`);

    onClose();
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin text-red-500">Delete User</p>

      <div className="divider mb-3 mt-1"></div>

      <div className="flex flex-col gap-3">
        <p>Are you sure you want to remove this user?</p>

        <div role="alert" className="alert alert-warning">
          <i className="bi-exclamation-triangle text-xl" />
          <span>
            <b>Warning:</b> This action is irreversible!
          </span>
        </div>

        <button
          className={`ml-auto btn w-fit text-white flex items-center gap-2 duration-100 bg-red-500 hover:bg-red-400 hover:dark:bg-red-600 cursor-pointer`}
          onClick={deleteUser}
        >
          <i className="bi-trash text-xl" />
          Delete, I know what I&apos;m doing
        </button>
      </div>
    </Modal>
  );
}
