import useModalStore from "@/store/modals";
import Modal from "./Modal";
import LinkModal from "./Modal/Link";
import {
  AccountSettings,
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import CollectionModal from "./Modal/Collection";
import UserModal from "./Modal/User";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function ModalManagement() {
  const { modal, setModal } = useModalStore();

  const toggleModal = () => {
    setModal(null);
  };

  const router = useRouter();
  useEffect(() => {
    toggleModal();
  }, [router]);

  if (modal && modal.modal === "LINK")
    return (
      <Modal toggleModal={toggleModal}>
        <LinkModal
          toggleLinkModal={toggleModal}
          method={modal.method}
          defaultIndex={modal.defaultIndex}
          activeLink={modal.active as LinkIncludingShortenedCollectionAndTags}
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
          activeCollection={
            modal.active as CollectionIncludingMembersAndLinkCount
          }
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
