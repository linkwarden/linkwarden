import {
  registerSheet,
  RouteDefinition,
  SheetDefinition,
} from "react-native-actions-sheet";
import AddLinkSheet from "./AddLinkSheet";
import EditLinkSheet from "./EditLinkSheet";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types";

registerSheet("add-link-sheet", AddLinkSheet);
registerSheet("edit-link-sheet", EditLinkSheet);

declare module "react-native-actions-sheet" {
  interface Sheets {
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
      };
    }>;
  }
}

export {};
