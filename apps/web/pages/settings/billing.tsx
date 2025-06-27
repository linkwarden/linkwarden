import SettingsLayout from "@/layouts/SettingsLayout";
import { useRouter } from "next/router";
import InviteModal from "@/components/ModalContent/InviteModal";
import { User as U } from "@linkwarden/prisma/client";
import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useUsers } from "@linkwarden/router/users";
import DeleteUserModal from "@/components/ModalContent/DeleteUserModal";
import { useUser } from "@linkwarden/router/user";
import clsx from "clsx";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface User extends U {
  subscriptions: {
    active: boolean;
  };
}

type UserModal = {
  isOpen: boolean;
  userId: number | null;
};

export default function Billing() {
  const router = useRouter();
  const { t } = useTranslation();

  const { data: account } = useUser();
  const { data: users = [] } = useUsers();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_STRIPE || account?.parentSubscriptionId)
      router.push("/settings/account");
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>();

  useEffect(() => {
    if (users.length > 0) {
      setFilteredUsers(users);
    }
  }, [users]);

  const [deleteUserModal, setDeleteUserModal] = useState<UserModal>({
    isOpen: false,
    userId: null,
  });

  const [inviteModal, setInviteModal] = useState(false);

  return (
    <SettingsLayout>
      <p className="capitalize text-3xl font-thin inline">
        {t("billing_settings")}
      </p>

      <Separator className="my-3" />

      <div className="w-full mx-auto flex flex-col gap-3 justify-between">
        <p className="text-md">
          {t("manage_subscription_intro")}{" "}
          <a
            href={process.env.NEXT_PUBLIC_STRIPE_BILLING_PORTAL_URL}
            className="underline"
            target="_blank"
          >
            {t("billing_portal")}
          </a>
          .
        </p>

        <p className="text-md">
          {t("help_contact_intro")}{" "}
          <a className="font-semibold" href="mailto:support@linkwarden.app">
            support@linkwarden.app
          </a>
        </p>
      </div>

      <div className="flex items-center gap-2 w-full rounded-md h-8 mt-5">
        <p className="truncate w-full pr-7 text-3xl font-thin">
          {t("manage_seats")}
        </p>
      </div>

      <Separator className="my-3" />

      <div className="flex items-center justify-between gap-2 mb-3 relative">
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
            onChange={(e) => {
              setSearchQuery(e.target.value);

              if (users) {
                setFilteredUsers(
                  users.filter((user: any) =>
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

        <div className="flex gap-3">
          <Button
            variant="accent"
            onClick={() => setInviteModal(true)}
            className="flex items-center px-2 h-[2.15rem] relative"
          >
            <p>{t("invite_user")}</p>
            <i className="bi-plus text-xl"></i>
          </Button>
        </div>
      </div>

      <div className="border rounded-md shadow border-neutral-content">
        <table className="table bg-base-300 rounded-md">
          <thead>
            <tr className="sm:table-row hidden border-b-neutral-content">
              {process.env.NEXT_PUBLIC_EMAIL_PROVIDER === "true" && (
                <th>{t("email")}</th>
              )}
              {process.env.NEXT_PUBLIC_STRIPE === "true" && (
                <th>{t("status")}</th>
              )}
              <th>{t("date_added")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers?.map((user, index) => (
              <tr
                key={index}
                className={clsx(
                  "group border-b-neutral-content duration-100 w-full relative flex flex-col sm:table-row",
                  user.id !== account?.id &&
                    "hover:bg-neutral-content hover:bg-opacity-30"
                )}
              >
                {process.env.NEXT_PUBLIC_EMAIL_PROVIDER === "true" && (
                  <td className="truncate max-w-full" title={user.email || ""}>
                    <p className="sm:hidden block text-neutral text-xs font-bold mb-2">
                      {t("email")}
                    </p>
                    <p>{user.email}</p>
                  </td>
                )}
                {process.env.NEXT_PUBLIC_STRIPE === "true" && (
                  <td>
                    <p className="sm:hidden block text-neutral text-xs font-bold mb-2">
                      {t("status")}
                    </p>
                    {user.emailVerified ? (
                      <p className="font-bold px-2 bg-green-600 text-white rounded-md w-fit">
                        {t("active")}
                      </p>
                    ) : (
                      <p className="font-bold px-2 bg-neutral-content rounded-md w-fit">
                        {t("pending")}
                      </p>
                    )}
                  </td>
                )}
                <td>
                  <p className="sm:hidden block text-neutral text-xs font-bold mb-2">
                    {t("date_added")}
                  </p>
                  <p className="whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString(t("locale"), {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </td>
                {user.id !== account?.id && (
                  <td className="relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onMouseDown={(e) => e.preventDefault()}
                          title={t("more")}
                        >
                          <i
                            className={"bi bi-three-dots text-lg text-neutral"}
                          ></i>
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        sideOffset={4}
                        align="end"
                        className="bg-base-200 border border-neutral-content rounded-box p-1"
                      >
                        {!user.emailVerified && (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                signIn("invite", {
                                  email: user.email,
                                  callbackUrl: "/member-onboarding",
                                  redirect: false,
                                }).then(() =>
                                  toast.success(t("resend_invite_success"))
                                );
                              }}
                            >
                              <i className="bi-envelope"></i>
                              {t("resend_invite")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}

                        <DropdownMenuItem
                          onClick={() => {
                            setDeleteUserModal({
                              isOpen: true,
                              userId: user.id,
                            });
                          }}
                          className="text-error"
                        >
                          <i className="bi-trash"></i>
                          {t("remove_user")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-center font-bold mt-3">
        {t(
          account?.subscription?.quantity === 1
            ? "seat_purchased"
            : "seats_purchased",
          { count: account?.subscription?.quantity }
        )}
      </p>
      {inviteModal && <InviteModal onClose={() => setInviteModal(false)} />}
      {deleteUserModal.isOpen && deleteUserModal.userId && (
        <DeleteUserModal
          onClose={() => setDeleteUserModal({ isOpen: false, userId: null })}
          userId={deleteUserModal.userId}
        />
      )}
    </SettingsLayout>
  );
}

export { getServerSideProps };
