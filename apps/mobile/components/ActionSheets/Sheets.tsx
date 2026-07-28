import {
  registerSheet,
  RouteDefinition,
  SheetDefinition,
} from "react-native-actions-sheet";
import SupportSheet from "./SupportSheet";
import AddLinkSheet from "./AddLinkSheet";
import EditLinkSheet from "./EditLinkSheet";
import NewCollectionSheet from "./NewCollectionSheet";
import AddTagSheet from "./AddTagSheet";
import LinkDetailsSheet from "./LinkDetailsSheet";
import ReadableHighlightSheet, {
  ReadableHighlightDraft,
} from "./ReadableHighlightSheet";
import ReadableHighlightsSheet from "./ReadableHighlightsSheet";
import ReaderSettingsSheet from "./ReaderSettingsSheet";
import LoginSheet from "./LoginSheet";
import SignUpSheet from "./SignUpSheet";
import VerifyEmailSheet from "./VerifyEmailSheet";
import SelfHostedServerSheet from "./SelfHostedServerSheet";
import DeleteAccountSheet from "./DeleteAccountSheet";
import WhatsNewSheet from "./WhatsNewSheet";
import RefreshPreservedFormatsSheet from "./RefreshPreservedFormatsSheet";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types/global";

registerSheet("support-sheet", SupportSheet);
registerSheet("login-sheet", LoginSheet);
registerSheet("sign-up-sheet", SignUpSheet);
registerSheet("verify-email-sheet", VerifyEmailSheet);
registerSheet("self-hosted-server-sheet", SelfHostedServerSheet);
registerSheet("add-link-sheet", AddLinkSheet);
registerSheet("link-details-sheet", LinkDetailsSheet);
registerSheet("edit-link-sheet", EditLinkSheet);
registerSheet("new-collection-sheet", NewCollectionSheet);
registerSheet("add-tag-sheet", AddTagSheet);
registerSheet("readable-highlight-sheet", ReadableHighlightSheet);
registerSheet("readable-highlights-sheet", ReadableHighlightsSheet);
registerSheet("reader-settings-sheet", ReaderSettingsSheet);
registerSheet("delete-account-sheet", DeleteAccountSheet);
registerSheet("whats-new-sheet", WhatsNewSheet);
registerSheet("refresh-preserved-formats-sheet", RefreshPreservedFormatsSheet);

declare module "react-native-actions-sheet" {
  interface Sheets {
    "support-sheet": SheetDefinition;
    "login-sheet": SheetDefinition;
    "sign-up-sheet": SheetDefinition;
    "verify-email-sheet": SheetDefinition<{
      payload: {
        email: string;
        instance: string;
      };
    }>;
    "self-hosted-server-sheet": SheetDefinition;
    "add-link-sheet": SheetDefinition<{
      payload: {
        collection?: { id?: number; name?: string };
        tag?: { id?: number; name?: string };
      };
    }>;
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
    "add-tag-sheet": SheetDefinition;
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
    "delete-account-sheet": SheetDefinition;
    "whats-new-sheet": SheetDefinition;
    "refresh-preserved-formats-sheet": SheetDefinition<{
      payload: {
        linkId: number;
      };
    }>;
  }
}

export {};
