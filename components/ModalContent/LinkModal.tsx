import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import LinkDetails from "../LinkDetails";
import Modal from "../Modal";
import { atLeastOneFormatAvailable } from "@/lib/shared/formatStats";

type Props = {
  onClose: Function;
  onDelete: Function;
  onUpdateArchive: Function;
  onPin: Function;
  link: LinkIncludingShortenedCollectionAndTags;
  activeMode?: "view" | "edit";
};

export default function LinkModal({
  onClose,
  onDelete,
  onUpdateArchive,
  onPin,
  link,
  activeMode,
}: Props) {
  return (
    <Modal
      toggleModal={onClose}
      linkModal={{
        state: true,
        size: atLeastOneFormatAvailable(link) ? "full" : "half",
      }}
    >
      <LinkDetails
        activeLink={link}
        className="sm:mt-0 -mt-11"
        onUpdateArchive={onUpdateArchive}
        onClose={onClose}
        activeMode={activeMode}
        onDelete={onDelete}
        onPin={onPin}
      />
    </Modal>
  );
}
