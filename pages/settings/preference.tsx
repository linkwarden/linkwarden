import SettingsLayout from "@/layouts/SettingsLayout";
import { useState, useEffect } from "react";
import useAccountStore from "@/store/account";
import SubmitButton from "@/components/SubmitButton";
import { toast } from "react-hot-toast";
import Checkbox from "@/components/Checkbox";
import useLocalSettingsStore from "@/store/localSettings";
import { useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps"; // Import getServerSideProps for server-side data fetching
import { LinksRouteTo } from "@prisma/client";

export default function Appearance() {
  const { t } = useTranslation();
  const { updateSettings } = useLocalSettingsStore();
  const [submitLoader, setSubmitLoader] = useState(false);
  const { account, updateAccount } = useAccountStore();
  const [user, setUser] = useState(account);

  const [preventDuplicateLinks, setPreventDuplicateLinks] = useState<boolean>(
    account.preventDuplicateLinks
  );
  const [archiveAsScreenshot, setArchiveAsScreenshot] = useState<boolean>(
    account.archiveAsScreenshot
  );
  const [archiveAsPDF, setArchiveAsPDF] = useState<boolean>(
    account.archiveAsPDF
  );

  const [archiveAsMonolith, setArchiveAsMonolith] = useState<boolean>(
    account.archiveAsMonolith
  );

  const [archiveAsWaybackMachine, setArchiveAsWaybackMachine] =
    useState<boolean>(account.archiveAsWaybackMachine);

  const [linksRouteTo, setLinksRouteTo] = useState(account.linksRouteTo);

  useEffect(() => {
    setUser({
      ...account,
      archiveAsScreenshot,
      archiveAsMonolith,
      archiveAsPDF,
      archiveAsWaybackMachine,
      linksRouteTo,
      preventDuplicateLinks,
    });
  }, [
    account,
    archiveAsScreenshot,
    archiveAsMonolith,
    archiveAsPDF,
    archiveAsWaybackMachine,
    linksRouteTo,
    preventDuplicateLinks,
  ]);

  function objectIsEmpty(obj: object) {
    return Object.keys(obj).length === 0;
  }

  useEffect(() => {
    if (!objectIsEmpty(account)) {
      setArchiveAsScreenshot(account.archiveAsScreenshot);
      setArchiveAsMonolith(account.archiveAsMonolith);
      setArchiveAsPDF(account.archiveAsPDF);
      setArchiveAsWaybackMachine(account.archiveAsWaybackMachine);
      setLinksRouteTo(account.linksRouteTo);
      setPreventDuplicateLinks(account.preventDuplicateLinks);
    }
  }, [account]);

  const submit = async () => {
    setSubmitLoader(true);

    const load = toast.loading(t("applying_changes"));

    const response = await updateAccount({ ...user });

    toast.dismiss(load);

    if (response.ok) {
      toast.success(t("settings_applied"));
    } else {
      toast.error(response.data as string);
    }
    setSubmitLoader(false);
  };

  return (
    <SettingsLayout>
      <p className="capitalize text-3xl font-thin inline">{t("preference")}</p>

      <div className="divider my-3"></div>

      <div className="flex flex-col gap-5">
        <div>
          <p className="mb-3">{t("select_theme")}</p>
          <div className="flex gap-3 w-full">
            <div
              className={`w-full text-center outline-solid outline-neutral-content outline dark:outline-neutral-700 h-36 duration-100 rounded-md flex items-center justify-center cursor-pointer select-none bg-black ${
                localStorage.getItem("theme") === "dark"
                  ? "dark:outline-primary text-primary"
                  : "text-white"
              }`}
              onClick={() => updateSettings({ theme: "dark" })}
            >
              <i className="bi-moon-fill text-6xl"></i>
              <p className="ml-2 text-2xl">{t("dark")}</p>
            </div>
            <div
              className={`w-full text-center outline-solid outline-neutral-content outline dark:outline-neutral-700 h-36 duration-100 rounded-md flex items-center justify-center cursor-pointer select-none bg-white ${
                localStorage.getItem("theme") === "light"
                  ? "outline-primary text-primary"
                  : "text-black"
              }`}
              onClick={() => updateSettings({ theme: "light" })}
            >
              <i className="bi-sun-fill text-6xl"></i>
              <p className="ml-2 text-2xl">{t("light")}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="capitalize text-3xl font-thin inline">
            {t("archive_settings")}
          </p>
          <div className="divider my-3"></div>
          <p>{t("formats_to_archive")}</p>
          <div className="p-3">
            <Checkbox
              label={t("screenshot")}
              state={archiveAsScreenshot}
              onClick={() => setArchiveAsScreenshot(!archiveAsScreenshot)}
            />

            <Checkbox
              label={t("webpage")}
              state={archiveAsMonolith}
              onClick={() => setArchiveAsMonolith(!archiveAsMonolith)}
            />

            <Checkbox
              label={t("pdf")}
              state={archiveAsPDF}
              onClick={() => setArchiveAsPDF(!archiveAsPDF)}
            />
            <Checkbox
              label={t("archive_org_snapshot")}
              state={archiveAsWaybackMachine}
              onClick={() =>
                setArchiveAsWaybackMachine(!archiveAsWaybackMachine)
              }
            />
          </div>
        </div>

        <div>
          <p className="capitalize text-3xl font-thin inline">
            {t("link_settings")}
          </p>
          <div className="divider my-3"></div>
          <div className="mb-3">
            <Checkbox
              label={t("prevent_duplicate_links")}
              state={preventDuplicateLinks}
              onClick={() => setPreventDuplicateLinks(!preventDuplicateLinks)}
            />
          </div>
          <p>{t("clicking_on_links_should")}</p>
          <div className="p-3">
            <label
              className="label cursor-pointer flex gap-2 justify-start w-fit"
              tabIndex={0}
              role="button"
            >
              <input
                type="radio"
                name="link-preference-radio"
                className="radio checked:bg-primary"
                value="Original"
                checked={linksRouteTo === LinksRouteTo.ORIGINAL}
                onChange={() => setLinksRouteTo(LinksRouteTo.ORIGINAL)}
              />
              <span className="label-text">{t("open_original_content")}</span>
            </label>

            <label
              className="label cursor-pointer flex gap-2 justify-start w-fit"
              tabIndex={0}
              role="button"
            >
              <input
                type="radio"
                name="link-preference-radio"
                className="radio checked:bg-primary"
                value="PDF"
                checked={linksRouteTo === LinksRouteTo.PDF}
                onChange={() => setLinksRouteTo(LinksRouteTo.PDF)}
              />
              <span className="label-text">{t("open_pdf_if_available")}</span>
            </label>

            <label
              className="label cursor-pointer flex gap-2 justify-start w-fit"
              tabIndex={0}
              role="button"
            >
              <input
                type="radio"
                name="link-preference-radio"
                className="radio checked:bg-primary"
                value="Readable"
                checked={linksRouteTo === LinksRouteTo.READABLE}
                onChange={() => setLinksRouteTo(LinksRouteTo.READABLE)}
              />
              <span className="label-text">
                {t("open_readable_if_available")}
              </span>
            </label>

            <label
              className="label cursor-pointer flex gap-2 justify-start w-fit"
              tabIndex={0}
              role="button"
            >
              <input
                type="radio"
                name="link-preference-radio"
                className="radio checked:bg-primary"
                value="Monolith"
                checked={linksRouteTo === LinksRouteTo.MONOLITH}
                onChange={() => setLinksRouteTo(LinksRouteTo.MONOLITH)}
              />
              <span className="label-text">
                {t("open_webpage_if_available")}
              </span>
            </label>

            <label
              className="label cursor-pointer flex gap-2 justify-start w-fit"
              tabIndex={0}
              role="button"
            >
              <input
                type="radio"
                name="link-preference-radio"
                className="radio checked:bg-primary"
                value="Screenshot"
                checked={linksRouteTo === LinksRouteTo.SCREENSHOT}
                onChange={() => setLinksRouteTo(LinksRouteTo.SCREENSHOT)}
              />
              <span className="label-text">
                {t("open_screenshot_if_available")}
              </span>
            </label>
          </div>
        </div>

        <SubmitButton
          onClick={submit}
          loading={submitLoader}
          label={t("save_changes")}
          className="mt-2 w-full sm:w-fit"
        />
      </div>
    </SettingsLayout>
  );
}

export { getServerSideProps };
