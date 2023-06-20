import {
  AccountSettings,
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { create } from "zustand";

type Modal =
  | {
      modal: "ACCOUNT";
      state: boolean;
      active: AccountSettings;
      defaultIndex?: number;
    }
  | {
      modal: "LINK";
      state: boolean;
      method: "CREATE";
      active?: LinkIncludingShortenedCollectionAndTags;
      defaultIndex?: number;
    }
  | {
      modal: "LINK";
      state: boolean;
      method: "UPDATE";
      active: LinkIncludingShortenedCollectionAndTags;
      defaultIndex?: number;
    }
  | {
      modal: "COLLECTION";
      state: boolean;
      method: "UPDATE";
      active: CollectionIncludingMembersAndLinkCount;
      defaultIndex?: number;
    }
  | {
      modal: "COLLECTION";
      state: boolean;
      method: "CREATE";
      active?: CollectionIncludingMembersAndLinkCount;
      defaultIndex?: number;
    }
  | null;

type ModalsStore = {
  modal: Modal;
  setModal: (modal: Modal) => void;
};

const useLocalSettingsStore = create<ModalsStore>((set) => ({
  modal: null,
  setModal: (modal: Modal) => {
    set({ modal });
  },
}));

export default useLocalSettingsStore;
