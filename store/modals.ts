import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { create } from "zustand";

type Modal =
  | {
      modal: "LINK";
      state: boolean;
      method: "CREATE";
      active?: LinkIncludingShortenedCollectionAndTags;
    }
  | {
      modal: "LINK";
      state: boolean;
      method: "UPDATE";
      active: LinkIncludingShortenedCollectionAndTags;
    }
  | {
      modal: "LINK";
      state: boolean;
      method: "FORMATS";
      active: LinkIncludingShortenedCollectionAndTags;
    }
  | {
      modal: "COLLECTION";
      state: boolean;
      method: "UPDATE";
      isOwner: boolean;
      active: CollectionIncludingMembersAndLinkCount;
      defaultIndex?: number;
    }
  | {
      modal: "COLLECTION";
      state: boolean;
      method: "CREATE";
      isOwner?: boolean;
      active?: CollectionIncludingMembersAndLinkCount;
      defaultIndex?: number;
    }
  | {
      modal: "COLLECTION";
      state: boolean;
      method: "VIEW_TEAM";
      isOwner?: boolean;
      active?: CollectionIncludingMembersAndLinkCount;
      defaultIndex?: number;
    }
  | null;

type ModalsStore = {
  modal: Modal;
  setModal: (modal: Modal) => void;
};

const useModalStore = create<ModalsStore>((set) => ({
  modal: null,
  setModal: (modal: Modal) => {
    set({ modal });
  },
}));

export default useModalStore;
