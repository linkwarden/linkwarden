import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import AddOrEditLink from "./AddOrEditLink";
import PreservedFormats from "./PreservedFormats";

type Props =
  | {
      toggleLinkModal: Function;
      method: "CREATE";
      activeLink?: LinkIncludingShortenedCollectionAndTags;
      className?: string;
    }
  | {
      toggleLinkModal: Function;
      method: "UPDATE";
      activeLink: LinkIncludingShortenedCollectionAndTags;
      className?: string;
    }
  | {
      toggleLinkModal: Function;
      method: "FORMATS";
      activeLink: LinkIncludingShortenedCollectionAndTags;
      className?: string;
    };

export default function LinkModal({
  className,
  toggleLinkModal,
  activeLink,
  method,
}: Props) {
  return (
    <div className={className}>
      {method === "CREATE" ? (
        <>
          <p className="ml-10 mt-[0.1rem] text-xl mb-3 font-thin">
            Create a New Link
          </p>
          <AddOrEditLink toggleLinkModal={toggleLinkModal} method="CREATE" />
        </>
      ) : undefined}

      {activeLink && method === "UPDATE" ? (
        <>
          <p className="ml-10 mt-[0.1rem] text-xl mb-3 font-thin">Edit Link</p>
          <AddOrEditLink
            toggleLinkModal={toggleLinkModal}
            method="UPDATE"
            activeLink={activeLink}
          />
        </>
      ) : undefined}

      {method === "FORMATS" ? (
        <>
          <p className="ml-10 mt-[0.1rem] text-xl mb-3 font-thin">
            Preserved Formats
          </p>
          <PreservedFormats />
        </>
      ) : undefined}
    </div>
  );
}
