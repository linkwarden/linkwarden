import SettingsLayout from "@/layouts/SettingsLayout";
import { useState, useEffect } from "react";
import SubmitButton from "@/components/SubmitButton";
import { toast } from "react-hot-toast";
import Checkbox from "@/components/Checkbox";
import useLocalSettingsStore from "@/store/localSettings";
import { useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { AiTaggingMethod, LinksRouteTo } from "@prisma/client";
import { useUpdateUser, useUser } from "@/hooks/store/user";
import TagSelection from "@/components/InputSelect/TagSelection";
import { useConfig } from "@/hooks/store/config";

export default function Appearance() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useLocalSettingsStore();
  const [submitLoader, setSubmitLoader] = useState(false);
  const { data: account } = useUser();
  const updateUser = useUpdateUser();
  const [user, setUser] = useState(account);

  const [preventDuplicateLinks, setPreventDuplicateLinks] = useState<boolean>(
    account.preventDuplicateLinks || false
  );
  const [archiveAsScreenshot, setArchiveAsScreenshot] = useState<boolean>(
    account.archiveAsScreenshot || false
  );
  const [archiveAsPDF, setArchiveAsPDF] = useState<boolean>(
    account.archiveAsPDF || false
  );
  const [archiveAsMonolith, setArchiveAsMonolith] = useState<boolean>(
    account.archiveAsMonolith || false
  );
  const [dashboardPinnedLinks, setDashboardPinnedLinks] = useState<boolean>(
    account.dashboardPinnedLinks || false
  );
  const [dashboardRecentLinks, setDashboardRecentLinks] = useState<boolean>(
    account.dashboardRecentLinks || false
  );
  const [archiveAsWaybackMachine, setArchiveAsWaybackMachine] =
    useState<boolean>(account.archiveAsWaybackMachine || false);
  const [linksRouteTo, setLinksRouteTo] = useState(account.linksRouteTo);
  const [aiTaggingMethod, setAiTaggingMethod] = useState<AiTaggingMethod>(
    account.aiTaggingMethod
  );
  const [aiPredefinedTags, setAiPredefinedTags] = useState<string[]>();

  const { data: config } = useConfig();

  useEffect(() => {
    setUser({
      ...account,
      archiveAsScreenshot,
      archiveAsMonolith,
      archiveAsPDF,
      archiveAsWaybackMachine,
      linksRouteTo,
      preventDuplicateLinks,
      aiTaggingMethod,
      aiPredefinedTags,
      dashboardRecentLinks,
      dashboardPinnedLinks,
    });
  }, [
    account,
    archiveAsScreenshot,
    archiveAsMonolith,
    archiveAsPDF,
    archiveAsWaybackMachine,
    linksRouteTo,
    preventDuplicateLinks,
    aiTaggingMethod,
    aiPredefinedTags,
    dashboardRecentLinks,
    dashboardPinnedLinks,
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
      setAiTaggingMethod(account.aiTaggingMethod);
      setAiPredefinedTags(account.aiPredefinedTags);
      setDashboardRecentLinks(account.dashboardRecentLinks);
      setDashboardPinnedLinks(account.dashboardPinnedLinks);
    }
  }, [account]);

  const submit = async () => {
    setSubmitLoader(true);

    const load = toast.loading(t("applying_settings"));

    await updateUser.mutateAsync(
      { ...user },
      {
        onSettled: (data, error) => {
          setSubmitLoader(false);
          toast.dismiss(load);

          if (error) {
            toast.error(error.message);
          } else {
            toast.success(t("settings_applied"));
          }
        },
      }
    );
  };

  return (
    <SettingsLayout>
      <p className="capitalize text-3xl font-thin inline">{t("preference")}</p>

      <div className="divider my-3"></div>

      <div className="flex flex-col gap-5">
        <div>
          <div className="flex gap-3 w-full">
            {[
              {
                theme: "dark",
                icon: "bi-moon-fill",
                bgColor: "bg-black",
                textColor: "text-white",
                activeColor: "text-primary",
              },
              {
                theme: "light",
                icon: "bi-sun-fill",
                bgColor: "bg-white",
                textColor: "text-black",
                activeColor: "text-primary",
              },
            ].map(({ theme, icon, bgColor, textColor, activeColor }) => (
              <div
                key={theme}
                className={`w-full text-center outline-solid outline-neutral-content outline h-20 duration-100 rounded-xl flex items-center justify-center cursor-pointer select-none ${bgColor} ${
                  localStorage.getItem("theme") === theme
                    ? `outline-primary ${activeColor}`
                    : textColor
                }`}
                onClick={() => updateSettings({ theme })}
              >
                <i className={`${icon} text-3xl`}></i>
                <p className="ml-2 text-2xl">{t(theme)}</p>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <div className="flex gap-3 w-3/4 mx-auto">
              {[
                "--default",
                "--red",
                "--rose",
                "--yellow",
                "--green",
                "--orange",
                "--zinc",
              ].map((color) => (
                <div
                  key={color}
                  className="relative rounded-full w-full aspect-square cursor-pointer"
                  style={{ backgroundColor: `oklch(var(${color}))` }}
                  onClick={() => updateSettings({ color })}
                >
                  {settings.color === color && (
                    <i className="bi-check2 text-xl text-base-100 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></i>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {config?.AI_ENABLED && (
          <div>
            <p className="capitalize text-3xl font-thin inline">
              {t("ai_settings")}
            </p>

            <div className="divider my-3"></div>

            <p>{t("ai_tagging_method")}</p>

            <div className="p-3">
              <label
                className="label cursor-pointer flex gap-2 justify-start w-fit"
                tabIndex={0}
                role="button"
              >
                <input
                  type="radio"
                  name="ai-tagging-method-radio"
                  className="radio checked:bg-primary"
                  value="DISABLED"
                  checked={aiTaggingMethod === AiTaggingMethod.DISABLED}
                  onChange={() => setAiTaggingMethod(AiTaggingMethod.DISABLED)}
                />
                <span className="label-text">{t("disabled")}</span>
              </label>
              <p className="text-neutral text-sm pl-5">
                {t("ai_tagging_disabled_desc")}
              </p>

              <label
                className="label cursor-pointer flex gap-2 justify-start w-fit"
                tabIndex={0}
                role="button"
              >
                <input
                  type="radio"
                  name="ai-tagging-method-radio"
                  className="radio checked:bg-primary"
                  value="GENERATE"
                  checked={aiTaggingMethod === AiTaggingMethod.GENERATE}
                  onChange={() => setAiTaggingMethod(AiTaggingMethod.GENERATE)}
                />
                <span className="label-text">{t("auto_generate_tags")}</span>
              </label>
              <p className="text-neutral text-sm pl-5">
                {t("auto_generate_tags_desc")}
              </p>

              <label
                className="label cursor-pointer flex gap-2 justify-start w-fit"
                tabIndex={0}
                role="button"
              >
                <input
                  type="radio"
                  name="ai-tagging-method-radio"
                  className="radio checked:bg-primary"
                  value="PREDEFINED"
                  checked={aiTaggingMethod === AiTaggingMethod.PREDEFINED}
                  onChange={() =>
                    setAiTaggingMethod(AiTaggingMethod.PREDEFINED)
                  }
                />
                <span className="label-text">
                  {t("based_on_predefined_tags")}
                </span>
              </label>
              <div className="pl-5">
                <p className="text-neutral text-sm mb-2">
                  {t("based_on_predefined_tags_desc")}
                </p>
                {aiPredefinedTags && (
                  <TagSelection
                    onChange={(e: any) => {
                      setAiPredefinedTags(e.map((e: any) => e.label));
                    }}
                    defaultValue={aiPredefinedTags
                      .map((e) => ({ label: e }))
                      .filter((e) => e.label !== "")}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          <p className="capitalize text-3xl font-thin inline">
            {t("dashboard_settings")}
          </p>
          <div className="divider my-3"></div>
          <p>{t("choose_whats_displayed_dashboard")}</p>
          <div className="p-3">
            <Checkbox
              label={t("pinned_links")}
              state={dashboardPinnedLinks}
              onClick={() => setDashboardPinnedLinks(!dashboardPinnedLinks)}
            />

            <Checkbox
              label={t("recent_links")}
              state={dashboardRecentLinks}
              onClick={() => setDashboardRecentLinks(!dashboardRecentLinks)}
            />
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
                value="Details"
                checked={linksRouteTo === LinksRouteTo.DETAILS}
                onChange={() => setLinksRouteTo(LinksRouteTo.DETAILS)}
              />
              <span className="label-text">{t("show_link_details")}</span>
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
