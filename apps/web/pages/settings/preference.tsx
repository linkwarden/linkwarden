import SettingsLayout from "@/layouts/SettingsLayout";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Checkbox from "@/components/Checkbox";
import useLocalSettingsStore from "@/store/localSettings";
import { useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { AiTaggingMethod, LinksRouteTo } from "@linkwarden/prisma/client";
import {
  useUpdateUser,
  useUpdateUserPreference,
  useUser,
} from "@linkwarden/router/user";
import { useConfig } from "@linkwarden/router/config";
import { useTags, useUpdateArchivalTags } from "@linkwarden/router/tags";
import TagSelection from "@/components/InputSelect/TagSelection";
import { useArchivalTags } from "@/hooks/useArchivalTags";
import { isArchivalTag } from "@linkwarden/lib";
import { Button } from "@/components/ui/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Preference() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useLocalSettingsStore();
  const updateUserPreference = useUpdateUserPreference();
  const [submitLoader, setSubmitLoader] = useState(false);
  const { data: account } = useUser() as any;
  const { data: tags } = useTags();
  const updateArchivalTags = useUpdateArchivalTags();
  const {
    ARCHIVAL_OPTIONS,
    archivalTags,
    options,
    addTags,
    toggleOption,
    removeTag,
  } = useArchivalTags(tags ? tags : []);
  const updateUser = useUpdateUser();
  const [user, setUser] = useState(account);

  const [preventDuplicateLinks, setPreventDuplicateLinks] = useState<boolean>(
    account.preventDuplicateLinks || false
  );
  const [archiveAsScreenshot, setArchiveAsScreenshot] = useState<boolean>(
    account.archiveAsScreenshot || false
  );
  const [archiveAsMonolith, setArchiveAsMonolith] = useState<boolean>(
    account.archiveAsMonolith || false
  );
  const [archiveAsPDF, setArchiveAsPDF] = useState<boolean>(
    account.archiveAsPDF || false
  );
  const [archiveAsReadable, setArchiveAsReadable] = useState<boolean>(false);
  const [archiveAsWaybackMachine, setArchiveAsWaybackMachine] =
    useState<boolean>(account.archiveAsWaybackMachine || false);
  const [dashboardPinnedLinks, setDashboardPinnedLinks] = useState<boolean>(
    account.dashboardPinnedLinks || false
  );
  const [dashboardRecentLinks, setDashboardRecentLinks] = useState<boolean>(
    account.dashboardRecentLinks || false
  );
  const [linksRouteTo, setLinksRouteTo] = useState(account.linksRouteTo);
  const [aiTaggingMethod, setAiTaggingMethod] = useState<AiTaggingMethod>(
    account.aiTaggingMethod
  );
  const [aiPredefinedTags, setAiPredefinedTags] = useState<string[]>();
  const [aiTagExistingLinks, setAiTagExistingLinks] = useState<boolean>(
    account.aiTagExistingLinks ?? false
  );
  const [hasAccountChanges, setHasAccountChanges] = useState(false);
  const [hasTagChanges, setHasTagChanges] = useState(false);
  const { data: config } = useConfig();

  useEffect(() => {
    setUser({
      ...account,
      archiveAsScreenshot,
      archiveAsMonolith,
      archiveAsPDF,
      archiveAsReadable,
      archiveAsWaybackMachine,
      linksRouteTo,
      preventDuplicateLinks,
      aiTaggingMethod,
      aiPredefinedTags,
      aiTagExistingLinks,
      dashboardRecentLinks,
      dashboardPinnedLinks,
    });
  }, [
    account,
    archiveAsScreenshot,
    archiveAsMonolith,
    archiveAsPDF,
    archiveAsReadable,
    archiveAsWaybackMachine,
    linksRouteTo,
    preventDuplicateLinks,
    aiTaggingMethod,
    aiPredefinedTags,
    aiTagExistingLinks,
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
      setArchiveAsReadable(account.archiveAsReadable);
      setArchiveAsWaybackMachine(account.archiveAsWaybackMachine);
      setLinksRouteTo(account.linksRouteTo);
      setPreventDuplicateLinks(account.preventDuplicateLinks);
      setAiTaggingMethod(account.aiTaggingMethod);
      setAiPredefinedTags(account.aiPredefinedTags);
      setAiTagExistingLinks(account.aiTagExistingLinks);
      setDashboardRecentLinks(account.dashboardRecentLinks);
      setDashboardPinnedLinks(account.dashboardPinnedLinks);
    }
  }, [account]);

  useEffect(() => {
    const relevantKeys = [
      "archiveAsScreenshot",
      "archiveAsMonolith",
      "archiveAsPDF",
      "archiveAsReadable",
      "archiveAsWaybackMachine",
      "linksRouteTo",
      "preventDuplicateLinks",
      "aiTaggingMethod",
      "aiPredefinedTags",
      "aiTagExistingLinks",
      "dashboardRecentLinks",
      "dashboardPinnedLinks",
    ];

    const hasChanges = relevantKeys.some((key) => account[key] !== user[key]);

    setHasAccountChanges(hasChanges);
  }, [account, user]);

  useEffect(() => {
    if (!tags || !archivalTags) return;

    const hasChanges = archivalTags.some((newTag) => {
      const originalTag = tags.find((t) => t.name === newTag.label);

      if (!originalTag) return true;

      return (
        newTag.archiveAsScreenshot !== originalTag.archiveAsScreenshot ||
        newTag.archiveAsMonolith !== originalTag.archiveAsMonolith ||
        newTag.archiveAsPDF !== originalTag.archiveAsPDF ||
        newTag.archiveAsReadable !== originalTag.archiveAsReadable ||
        newTag.archiveAsWaybackMachine !==
          originalTag.archiveAsWaybackMachine ||
        newTag.aiTag !== originalTag.aiTag
      );
    });

    setHasTagChanges(hasChanges);
  }, [archivalTags, tags]);

  const submit = async () => {
    setSubmitLoader(true);

    const load = toast.loading(t("applying_settings"));

    try {
      const promises = [];

      if (hasAccountChanges) promises.push(updateUser.mutateAsync({ ...user }));
      if (hasTagChanges)
        promises.push(updateArchivalTags.mutateAsync(archivalTags));

      if (promises.length > 0) {
        await Promise.all(promises);
        toast.success(t("settings_applied"));
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitLoader(false);
      toast.dismiss(load);
    }
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
                onClick={() =>
                  updateUserPreference.mutate({ theme: theme as any })
                }
              >
                <i className={`${icon} text-3xl`}></i>
                <p className="ml-2 text-xl">{t(theme)}</p>
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
                  value="EXISTING"
                  checked={aiTaggingMethod === AiTaggingMethod.EXISTING}
                  onChange={() => setAiTaggingMethod(AiTaggingMethod.EXISTING)}
                />
                <span className="label-text">
                  {t("based_on_existing_tags")}
                </span>
              </label>
              <p className="text-neutral text-sm pl-5">
                {t("based_on_existing_tags_desc")}
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
            <div
              className={`mb-3 ${
                aiTaggingMethod === AiTaggingMethod.DISABLED ? "opacity-50" : ""
              }`}
            >
              <Checkbox
                label={t("generate_tags_for_existing_links")}
                state={aiTagExistingLinks}
                onClick={() =>
                  aiTaggingMethod !== AiTaggingMethod.DISABLED &&
                  setAiTagExistingLinks(!aiTagExistingLinks)
                }
                disabled={aiTaggingMethod === AiTaggingMethod.DISABLED}
              />
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
              label={t("readable")}
              state={archiveAsReadable}
              onClick={() => setArchiveAsReadable(!archiveAsReadable)}
            />

            <Checkbox
              label={t("archive_org_snapshot")}
              state={archiveAsWaybackMachine}
              onClick={() =>
                setArchiveAsWaybackMachine(!archiveAsWaybackMachine)
              }
            />
          </div>
          <div className="max-w-full">
            <p>{t("tag_preservation_rule_label")}</p>
          </div>
          <div className="p-3">
            <TagSelection
              isArchivalSelection
              onChange={addTags}
              options={options}
            />
            <div className="flex flex-col gap-2">
              {archivalTags &&
                archivalTags.filter(isArchivalTag).map((tag) => (
                  <div
                    key={tag.label}
                    className="w-full bg-base-200 py-2 px-4 rounded-md first-of-type:mt-4 max-w-full shadow"
                  >
                    <div className="flex justify-between gap-1">
                      <span className="block sm:text-lg truncate max-w-sm">
                        {tag.label}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTag(tag)}
                        className="hover:text-error"
                      >
                        <i className="bi-x text-lg leading-none"></i>
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-1 mt-1">
                      <p className="text-sm">{t("preservation_rules")}</p>
                      <div className="flex gap-1">
                        {ARCHIVAL_OPTIONS.map(({ type, icon, label }) => (
                          <TooltipProvider key={type}>
                            <Tooltip>
                              <TooltipTrigger>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleOption(tag, type)}
                                  className={
                                    tag[type]
                                      ? "bg-primary hover:bg-primary text-primary-foreground hover:text-primary-foreground"
                                      : ""
                                  }
                                >
                                  <i
                                    className={`${icon} text-lg leading-none`}
                                  ></i>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{label}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
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

        <Button
          onClick={submit}
          disabled={submitLoader}
          className="mt-2 w-full sm:w-fit"
          variant="accent"
        >
          {t("save_changes")}
        </Button>
      </div>
    </SettingsLayout>
  );
}

export { getServerSideProps };
