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
import TextInput from "@/components/TextInput";

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
  const { update, data } = useSession();
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

      if (user.email !== account.email) {
        update({
          id: data?.user.id,
        });

        signOut();
      } else if (
        user.username !== account.username ||
        user.name !== account.name
      )
        update({
          id: data?.user.id,
        });

      setUser({ ...user, newPassword: undefined });
      toggleSettingsModal();
    } else toast.error(response.data as string);
    setSubmitLoader(false);
  };

  return (
    <div className="flex flex-col gap-3 justify-between sm:w-[35rem] w-80">
      <div className="grid sm:grid-cols-2 gap-3 auto-rows-auto">
        <div className="sm:row-span-2 sm:justify-self-center mx-auto mb-3">
          <p className="text-sm text-black dark:text-white mb-2 text-center">
            Profile Photo
          </p>
          <div className="w-28 h-28 flex items-center justify-center rounded-full relative">
            <ProfilePhoto
              src={user.profilePic}
              className="h-auto border-none w-28"
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
                className="absolute top-1 left-1 w-5 h-5 flex items-center justify-center border p-1 border-slate-200 dark:border-neutral-700 rounded-full bg-white dark:bg-neutral-800 text-center select-none cursor-pointer duration-100 hover:text-red-500"
              >
                <FontAwesomeIcon icon={faClose} className="w-3 h-3" />
              </div>
            )}

            <div className="absolute -bottom-3 left-0 right-0 mx-auto w-fit text-center">
              <label
                htmlFor="upload-photo"
                title="PNG or JPG (Max: 3MB)"
                className="border border-slate-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 px-2 text-center select-none cursor-pointer duration-100 hover:border-sky-300 hover:dark:border-sky-600"
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
            <p className="text-sm text-black dark:text-white mb-2">
              Display Name
            </p>
            <TextInput
              value={user.name || ""}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
            />
          </div>

          <div>
            <p className="text-sm text-black dark:text-white mb-2">Username</p>
            <TextInput
              value={user.username || ""}
              onChange={(e) => setUser({ ...user, username: e.target.value })}
            />
          </div>

          {emailEnabled ? (
            <div>
              <p className="text-sm text-black dark:text-white mb-2">Email</p>
              <TextInput
                value={user.email || ""}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
              />
            </div>
          ) : undefined}

          {user.email !== account.email ? (
            <p className="text-gray-500">
              You will need to log back in after you apply this Email.
            </p>
          ) : undefined}
        </div>
      </div>

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
