import {
  registerSheet,
  RouteDefinition,
  SheetDefinition,
} from "react-native-actions-sheet";
import AddLinkSheet from "./AddLinkSheet";
import EditLinkSheet from "./EditLinkSheet";

registerSheet("add-link-sheet", AddLinkSheet);
registerSheet("edit-link-sheet", EditLinkSheet);

declare module "react-native-actions-sheet" {
  interface Sheets {
    "add-link-sheet": SheetDefinition;
    "edit-link-sheet": SheetDefinition<{
      payload: {
        id: number;
      };
      // routes: {
      //   main: RouteDefinition;
      //   collections: RouteDefinition<{
      //     data: string;
      //   }>;
      // };
    }>;
  }
}

export {};
