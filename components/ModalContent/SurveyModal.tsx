import React, { useState } from "react";
import Modal from "../Modal";
import Button from "../ui/Button";
import { useTranslation } from "next-i18next";

type Props = {
  onClose: Function;
  submit: Function;
};

export default function SurveyModal({ onClose, submit }: Props) {
  const { t } = useTranslation();
  const [referer, setReferrer] = useState("rather_not_say");
  const [other, setOther] = useState("");

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin">{t("quick_survey")}</p>

      <div className="divider mb-3 mt-1"></div>

      <div className="flex flex-col gap-4">
        <p>{t("how_did_you_discover_linkwarden")}</p>

        <select
          onChange={(e) => {
            setReferrer(e.target.value);
            setOther("");
          }}
          className="select border border-neutral-content focus:outline-none focus:border-primary duration-100 w-full bg-base-200 rounded-[0.375rem] min-h-0 h-[2.625rem] leading-4 p-2"
        >
          <option value="rather_not_say">{t("rather_not_say")}</option>
          <option value="search_engine">{t("search_engine")}</option>
          <option value="people_recommendation">
            {t("people_recommendation")}
          </option>
          <option value="reddit">{t("reddit")}</option>
          <option value="github">{t("github")}</option>
          <option value="twitter">{t("twitter")}</option>
          <option value="mastodon">{t("mastodon")}</option>
          <option value="lemmy">{t("lemmy")}</option>
          <option value="other">{t("other")}</option>
        </select>

        {referer === "other" && (
          <input
            type="text"
            placeholder={t("please_specify")}
            onChange={(e) => {
              setOther(e.target.value);
            }}
            value={other}
            className="input border border-neutral-content focus:border-primary focus:outline-none duration-100 w-full bg-base-200 rounded-[0.375rem] min-h-0 h-[2.625rem] leading-4 p-2"
          />
        )}

        <Button
          className="ml-auto mt-3"
          intent="accent"
          onClick={() => submit(referer, other)}
        >
          {t("submit")}
        </Button>
      </div>
    </Modal>
  );
}
