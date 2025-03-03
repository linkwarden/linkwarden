import { Commands } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    extendedCommentExtension: {
      setCommentContent: (commentId: string, content: string) => ReturnType;
    };
  }
}
