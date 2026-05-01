import {
  registerSheet,
  RouteDefinition,
  SheetDefinition,
} from "react-native-actions-sheet";
import SupportSheet from "./SupportSheet";
import AddLinkSheet from "./AddLinkSheet";
import EditLinkSheet from "./EditLinkSheet";
import NewCollectionSheet from "./NewCollectionSheet";
import LinkDetailsSheet from "./LinkDetailsSheet";
import ReadableHighlightSheet, {
  ReadableHighlightDraft,
} from "./ReadableHighlightSheet";
import ReadableHighlightsSheet from "./ReadableHighlightsSheet";
import ReaderSettingsSheet from "./ReaderSettingsSheet";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types/global";

registerSheet("support-sheet", SupportSheet);
registerSheet("add-link-sheet", AddLinkSheet);
registerSheet("link-details-sheet", LinkDetailsSheet);
registerSheet("edit-link-sheet", EditLinkSheet);
registerSheet("new-collection-sheet", NewCollectionSheet);
registerSheet("readable-highlight-sheet", ReadableHighlightSheet);
registerSheet("readable-highlights-sheet", ReadableHighlightsSheet);
registerSheet("reader-settings-sheet", ReaderSettingsSheet);

declare module "react-native-actions-sheet" {
  interface Sheets {
    "support-sheet": SheetDefinition;
    "add-link-sheet": SheetDefinition;
    "link-details-sheet": SheetDefinition<{
      payload: {
        link: LinkIncludingShortenedCollectionAndTags;
      };
    }>;
    "edit-link-sheet": SheetDefinition<{
      payload: {
        link: LinkIncludingShortenedCollectionAndTags;
      };
      routes: {
        main: RouteDefinition<{
          link: LinkIncludingShortenedCollectionAndTags;
        }>;
        collections: RouteDefinition<{
          link: LinkIncludingShortenedCollectionAndTags;
        }>;
        tags: RouteDefinition<{
          link: LinkIncludingShortenedCollectionAndTags;
        }>;
      };
    }>;
    "new-collection-sheet": SheetDefinition;
    "readable-highlight-sheet": SheetDefinition<{
      payload: {
        draft: ReadableHighlightDraft;
      };
    }>;
    "readable-highlights-sheet": SheetDefinition<{
      payload: {
        linkId: number;
      };
      returnValue: number | null;
    }>;
    "reader-settings-sheet": SheetDefinition;
  }
}

export {};
