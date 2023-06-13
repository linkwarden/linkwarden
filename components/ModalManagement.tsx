import useModalStore from "@/store/modals";
import Modal from "./Modal";
import LinkModal from "./Modal/LinkModal";
import {
  AccountSettings,
  CollectionIncludingMembers,
  LinkIncludingCollectionAndTags,
} from "@/types/global";
import CollectionModal from "./Modal/Collection";
import UserModal from "./Modal/User";

export default function ModalManagement() {
  const { modal, setModal } = useModalStore();

  const toggleModal = () => {
    setModal(null);
  };

  if (modal && modal.modal === "LINK")
    return (
      <Modal toggleModal={toggleModal}>
        <LinkModal
          toggleLinkModal={toggleModal}
          method={modal.method}
          activeLink={modal.active as LinkIncludingCollectionAndTags}
        />
      </Modal>
    );
  else if (modal && modal.modal === "COLLECTION")
    return (
      <Modal toggleModal={toggleModal}>
        <CollectionModal
          toggleCollectionModal={toggleModal}
          method={modal.method}
          defaultIndex={modal.defaultIndex}
          activeCollection={modal.active as CollectionIncludingMembers}
        />
      </Modal>
    );
  else if (modal && modal.modal === "ACCOUNT")
    return (
      <Modal toggleModal={toggleModal}>
        <UserModal
          toggleSettingsModal={toggleModal}
          defaultIndex={modal.defaultIndex}
          activeUser={modal.active as AccountSettings}
        />
      </Modal>
    );
  else return <></>;
}
