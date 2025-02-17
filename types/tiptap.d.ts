import { Commands } from '@tiptap/core';

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		extendedComment: {
			setCommentContent: (commentId: string, content: string) => ReturnType;
		};
	}
}
