import {
  registerSheet,
  RouteDefinition,
  SheetDefinition,
} from "react-native-actions-sheet";
import SupportSheet from "./SupportSheet";
import AddLinkSheet from "./AddLinkSheet";
import EditLinkSheet from "./EditLinkSheet";
import NewCollectionSheet from "./NewCollectionSheet";
import ReadableHighlightSheet, {
  ReadableHighlightDraft,
} from "./ReadableHighlightSheet";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types/global";

registerSheet("support-sheet", SupportSheet);
registerSheet("add-link-sheet", AddLinkSheet);
registerSheet("edit-link-sheet", EditLinkSheet);
registerSheet("new-collection-sheet", NewCollectionSheet);
registerSheet("readable-highlight-sheet", ReadableHighlightSheet);

declare module "react-native-actions-sheet" {
  interface Sheets {
    "support-sheet": SheetDefinition;
    "add-link-sheet": SheetDefinition;
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
  }
}

export {};
