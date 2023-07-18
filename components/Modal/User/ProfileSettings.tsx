import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import useAccountStore from "@/store/account";
import { AccountSettings } from "@/types/global";
import { signOut, useSession } from "next-auth/react";
import { resizeImage } from "@/lib/client/resizeImage";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import SubmitButton from "../../SubmitButton";
import ProfilePhoto from "../../ProfilePhoto";
import { toast } from "react-hot-toast";

type Props = {
  toggleSettingsModal: Function;
  setUser: Dispatch<SetStateAction<AccountSettings>>;
  user: AccountSettings;
};

const emailEnabled = process.env.NEXT_PUBLIC_EMAIL_PROVIDER;

export default function ProfileSettings({
  toggleSettingsModal,
  setUser,
  user,
}: Props) {
  const { update } = useSession();
  const { account, updateAccount } = useAccountStore();
  const [profileStatus, setProfileStatus] = useState(true);

  const [submitLoader, setSubmitLoader] = useState(false);

  const handleProfileStatus = (e: boolean) => {
    setProfileStatus(!e);
  };

  const handleImageUpload = async (e: any) => {
    const file: File = e.target.files[0];

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["png", "jpeg", "jpg"];

    if (allowedExtensions.includes(fileExtension as string)) {
      const resizedFile = await resizeImage(file);

      if (
        resizedFile.size < 1048576 // 1048576 Bytes == 1MB
      ) {
        const reader = new FileReader();

        reader.onload = () => {
          setUser({ ...user, profilePic: reader.result as string });
        };

        reader.readAsDataURL(resizedFile);
      } else {
        toast.error("Please select a PNG or JPEG file thats less than 1MB.");
      }
    } else {
      toast.error("Invalid file format.");
    }
  };

  useEffect(() => {
    setUser({ ...user, newPassword: undefined });
  }, []);

  const submit = async () => {
    setSubmitLoader(true);

    const load = toast.loading("Applying...");

    const response = await updateAccount({
      ...user,
    });

    toast.dismiss(load);

    if (response.ok) {
      toast.success("Settings Applied!");
      toggleSettingsModal();

      if (
        user.username !== account.username ||
        user.name !== account.name ||
        user.email !== account.email
      ) {
        update({
          username: user.username,
          email: user.username,
          name: user.name,
        });

        signOut();
      }

      setUser({ ...user, newPassword: undefined });
      toggleSettingsModal();
    } else toast.error(response.data as string);
    setSubmitLoader(false);
  };

  return (
    <div className="flex flex-col gap-3 justify-between sm:w-[35rem] w-80">
      <div className="grid sm:grid-cols-2 gap-3 auto-rows-auto">
        <div className="sm:row-span-2 sm:justify-self-center mx-auto mb-3">
          <p className="text-sm text-sky-500 mb-2 text-center">Profile Photo</p>
          <div className="w-28 h-28 flex items-center justify-center rounded-full relative">
            <ProfilePhoto
              src={user.profilePic}
              className="h-auto  w-28"
              status={handleProfileStatus}
            />
            {profileStatus && (
              <div
                onClick={() =>
                  setUser({
                    ...user,
                    profilePic: "",
                  })
                }
                className="absolute top-1 left-1 w-5 h-5 flex items-center justify-center border p-1 bg-white border-slate-200 rounded-full text-gray-500 hover:text-red-500 duration-100 cursor-pointer"
              >
                <FontAwesomeIcon icon={faClose} className="w-3 h-3" />
              </div>
            )}

            <div className="absolute -bottom-3 left-0 right-0 mx-auto w-fit text-center">
              <label
                htmlFor="upload-photo"
                title="PNG or JPG (Max: 3MB)"
                className="border border-slate-200 rounded-md bg-white px-2 text-center select-none cursor-pointer text-sky-900 duration-100 hover:border-sky-500"
              >
                Browse...
                <input
                  type="file"
                  name="photo"
                  id="upload-photo"
                  accept=".png, .jpeg, .jpg"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm text-sky-500 mb-2">Display Name</p>
            <input
              type="text"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              className="w-full rounded-md p-2 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
            />
          </div>

          <div>
            <p className="text-sm text-sky-500 mb-2">Username</p>
            <input
              type="text"
              value={user.username}
              onChange={(e) => setUser({ ...user, username: e.target.value })}
              className="w-full rounded-md p-2 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
            />
          </div>

          {emailEnabled ? (
            <div>
              <p className="text-sm text-sky-500 mb-2">Email</p>
              <input
                type="text"
                value={user.email || ""}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                className="w-full rounded-md p-2 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
              />
            </div>
          ) : undefined}
        </div>
      </div>

      {/* <hr /> TODO: Export functionality

      <p className="text-sky-600">Data Settings</p>

      <div className="w-fit">
        <div className="border border-sky-100 rounded-md bg-white px-2 py-1 text-center select-none cursor-pointer text-sky-900 duration-100 hover:border-sky-500">
          Export Data
        </div>
      </div> */}
      <SubmitButton
        onClick={submit}
        loading={submitLoader}
        label="Apply Settings"
        icon={faPenToSquare}
        className="mx-auto mt-2"
      />
    </div>
  );
}
