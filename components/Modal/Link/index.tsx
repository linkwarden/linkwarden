import { Tab } from "@headlessui/react";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import AddOrEditLink from "./AddOrEditLink";
import LinkDetails from "./LinkDetails";

type Props =
  | {
      toggleLinkModal: Function;
      method: "CREATE";
      isOwnerOrMod?: boolean;
      activeLink?: LinkIncludingShortenedCollectionAndTags;
      defaultIndex?: number;
      className?: string;
    }
  | {
      toggleLinkModal: Function;
      method: "UPDATE";
      isOwnerOrMod: boolean;
      activeLink: LinkIncludingShortenedCollectionAndTags;
      defaultIndex?: number;
      className?: string;
    };

export default function LinkModal({
  className,
  defaultIndex,
  toggleLinkModal,
  isOwnerOrMod,
  activeLink,
  method,
}: Props) {
  return (
    <div className={className}>
      <Tab.Group defaultIndex={defaultIndex}>
        {method === "CREATE" && (
          <p className="text-xl text-black dark:text-white text-center">
            New Link
          </p>
        )}
        <Tab.List
          className={`flex justify-center flex-col max-w-[15rem] sm:max-w-[30rem] mx-auto sm:flex-row gap-2 sm:gap-3 mb-5 text-black dark:text-white ${
            isOwnerOrMod ? "" : "pb-8"
          }`}
        >
          {method === "UPDATE" && isOwnerOrMod && (
            <>
              <Tab
                className={({ selected }) =>
                  selected
                    ? "px-2 py-1 bg-sky-200 duration-100 rounded-md outline-none"
                    : "px-2 py-1 hover:bg-slate-200 rounded-md duration-100 outline-none"
                }
              >
                Link Details
              </Tab>
              <Tab
                className={({ selected }) =>
                  selected
                    ? "px-2 py-1 bg-sky-200 duration-100 rounded-md outline-none"
                    : "px-2 py-1 hover:bg-slate-200 rounded-md duration-100 outline-none"
                }
              >
                Edit Link
              </Tab>
            </>
          )}
        </Tab.List>
        <Tab.Panels>
          {activeLink && method === "UPDATE" && (
            <Tab.Panel>
              <LinkDetails link={activeLink} />
            </Tab.Panel>
          )}

          <Tab.Panel>
            {activeLink && method === "UPDATE" ? (
              <AddOrEditLink
                toggleLinkModal={toggleLinkModal}
                method="UPDATE"
                activeLink={activeLink}
              />
            ) : (
              <AddOrEditLink
                toggleLinkModal={toggleLinkModal}
                method="CREATE"
              />
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
