import { LinkIncludingShortenedCollectionAndTags } from '@/types/global';
import { Editor } from '@tiptap/react';
import React, { useState, useEffect, useRef } from 'react';

const CommentDisplay = ({ editor, link }: { editor: Editor, link: LinkIncludingShortenedCollectionAndTags }) => {
	const [comments, setComments] = useState<{
		[key: string]: {
			position: { x: number; y: number };
			visible: boolean;
			id: string;
			content: string;
		}
	}>({});

	console.log(editor?.getHTML())
	const timeoutRef = useRef<{ [key: string]: number }>({});

	useEffect(() => {
		const commentElements = document.querySelectorAll('.linkwarden-comment');

		const handleMouseEnter = (event: MouseEvent) => {
			const element = event.target as HTMLElement;
			const commentId = element.getAttribute('data-comment-id');
			const commentContent = element.getAttribute('data-comment-content') || '';

			if (!commentId) return;

			if (timeoutRef.current[commentId]) {
				window.clearTimeout(timeoutRef.current[commentId]);
				delete timeoutRef.current[commentId];
			}

			const rect = element.getBoundingClientRect();

			setComments(prev => ({
				...prev,
				[commentId]: {
					position: {
						x: rect.left + window.scrollX,
						y: rect.bottom + window.scrollY,
					},
					visible: true,
					id: commentId,
					content: commentContent
				}
			}));
		};

		const handleMouseLeave = (event: MouseEvent) => {
			const element = event.target as HTMLElement;
			const commentId = element.getAttribute('data-comment-id');
			if (!commentId) return;

			timeoutRef.current[commentId] = window.setTimeout(() => {
				setComments(prev => ({
					...prev,
					[commentId]: {
						...prev[commentId],
						visible: false
					}
				}));
				delete timeoutRef.current[commentId];
			}, 300);
		};

		commentElements.forEach(element => {
			element.addEventListener('mouseenter', handleMouseEnter as EventListener);
			element.addEventListener('mouseleave', handleMouseLeave as EventListener);
		});

		return () => {
			commentElements.forEach(element => {
				element.removeEventListener('mouseenter', handleMouseEnter as EventListener);
				element.removeEventListener('mouseleave', handleMouseLeave as EventListener);
			});

			Object.values(timeoutRef.current).forEach(timeoutId => {
				window.clearTimeout(timeoutId);
			});
		};
	}, []);

	const handlePopupMouseEnter = (commentId: string) => {
		if (timeoutRef.current[commentId]) {
			window.clearTimeout(timeoutRef.current[commentId]);
			delete timeoutRef.current[commentId];
		}

		setComments(prev => ({
			...prev,
			[commentId]: {
				...prev[commentId],
				visible: true
			}
		}));
	};

	const handlePopupMouseLeave = (commentId: string) => {
		setComments(prev => ({
			...prev,
			[commentId]: {
				...prev[commentId],
				visible: false
			}
		}));
	};

	const handleCommentChange = (commentId: string, newContent: string) => {
		setComments(prev => ({
			...prev,
			[commentId]: {
				...prev[commentId],
				content: newContent
			}
		}));

		editor.commands.focus();
		editor.state.tr.doc.descendants((node) => {
			if (node.attrs['data-comment-id'] === commentId) {
				editor.commands.updateAttributes(node.type.name, { 'data-comment-content': newContent });
				return false;
			}
			return true;
		})

		const element = document.querySelector(`.linkwarden-comment[data-comment-id="${commentId}"]`);
		if (element) {
			element.setAttribute('data-comment-content', newContent);
		}
	};

	return (
		<>
			{Object.entries(comments).map(([commentId, comment]) => (
				comment.visible && (
					<div
						key={commentId}
						className="fixed z-50 bg-base-100 shadow-lg rounded-lg p-4 w-full max-w-[300px]"
						style={{
							left: `${comment.position.x}px`,
							top: `${comment.position.y + 8}px`,
							transform: 'translateX(-50%)',
						}}
						onMouseEnter={() => handlePopupMouseEnter(commentId)}
						onMouseLeave={() => handlePopupMouseLeave(commentId)}
					>
						<div className="flex items-start gap-2 ">
							<div className="flex flex-col gap-1 w-full">
								<label className="text-lg flex items-center gap-2">
									<i className="bi bi-chat-square-dots text-base text-primary" />
									Comment
								</label>
								<textarea
									value={comment.content}
									onChange={(e) => handleCommentChange(commentId, e.target.value)}
									placeholder="Write your comment here..."
									className="resize-none w-full rounded-md p-2 border-neutral-content bg-base-100 focus:border-sky-300 dark:focus:border-sky-600 border-solid border outline-none duration-100"
								/>
							</div>
						</div>
					</div>
				)
			))}
		</>
	);
};

export default CommentDisplay;