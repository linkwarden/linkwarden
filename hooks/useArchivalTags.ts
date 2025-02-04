import { ArchivalOptionKeys, ArchivalTagOption } from '@/components/InputSelect/types';
import { Tag } from '@prisma/client';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const isArchivalTag = (tag: Tag) =>
	tag.archiveAsScreenshot ||
	tag.archiveAsMonolith ||
	tag.archiveAsPDF ||
	tag.archiveAsReadable ||
	tag.archiveAsWaybackMachine ||
	tag.aiTag;

const useArchivalTags = (initialTags: Tag[]) => {
	const [archivalTags, setArchivalTags] = useState<ArchivalTagOption[]>([]);
	const [options, setOptions] = useState<ArchivalTagOption[]>([]);
	const { t } = useTranslation();

	useEffect(() => {
		if (!initialTags) return;

		const transformTag = (tag: Tag): ArchivalTagOption => ({
			label: tag.name,
			value: tag.id,
			archiveAsScreenshot: tag.archiveAsScreenshot || false,
			archiveAsMonolith: tag.archiveAsMonolith || false,
			archiveAsPDF: tag.archiveAsPDF || false,
			archiveAsReadable: tag.archiveAsReadable || false,
			archiveAsWaybackMachine: tag.archiveAsWaybackMachine || false,
			aiTag: tag.aiTag || false,
		});

		const archival = initialTags.filter(isArchivalTag).map(transformTag);
		const nonArchival = initialTags.filter(tag => !isArchivalTag(tag)).map(transformTag);

		setArchivalTags(archival);
		setOptions(nonArchival);
	}, [initialTags]);

	const addTags = (newTags: ArchivalTagOption[]) => {
		console.log("newTags", newTags);
		const uniqueNewTags = newTags
			.filter(newTag => !archivalTags.some(existing => existing.label === newTag.label))
			.map(tag => ({
				...tag,
				archiveAsScreenshot: tag.__isNew__ ? false : tag.archiveAsScreenshot,
				archiveAsMonolith: tag.__isNew__ ? false : tag.archiveAsMonolith,
				archiveAsPDF: tag.__isNew__ ? false : tag.archiveAsPDF,
				archiveAsReadable: tag.__isNew__ ? false : tag.archiveAsReadable,
				archiveAsWaybackMachine: tag.__isNew__ ? false : tag.archiveAsWaybackMachine,
				aiTag: tag.__isNew__ ? false : tag.aiTag,
			}));

		setArchivalTags(prev => [...prev, ...uniqueNewTags]);
		setOptions(prev => prev.filter(option => !newTags.some(({ label }) => label === option.label)));
	};

	const toggleOption = (tag: ArchivalTagOption, option: keyof ArchivalTagOption) => {
		setArchivalTags(prev => prev.map(t =>
			t.label === tag.label ? { ...t, [option]: !t[option] } : t
		));
	};

	const removeTag = (tagToDelete: ArchivalTagOption) => {
		setArchivalTags(prev => prev.filter(tag => tag.label !== tagToDelete.label));

		if (!tagToDelete.__isNew__) {
			const resetTag: ArchivalTagOption = {
				...tagToDelete,
				archiveAsScreenshot: false,
				archiveAsMonolith: false,
				archiveAsPDF: false,
				archiveAsReadable: false,
				archiveAsWaybackMachine: false,
				aiTag: false,
			};

			setOptions(prev => [...prev, resetTag]);
		}
	};

	const ARCHIVAL_OPTIONS: { type: ArchivalOptionKeys; icon: string; label: string }[] = [
		{ type: "aiTag", icon: "bi-tag", label: t("ai_tagging") },
		{ type: "archiveAsScreenshot", icon: "bi-file-earmark-image", label: t("screenshot") },
		{ type: "archiveAsMonolith", icon: "bi-filetype-html", label: t("webpage") },
		{ type: "archiveAsPDF", icon: "bi-file-earmark-pdf", label: t("pdf") },
		{ type: "archiveAsReadable", icon: "bi-file-earmark-text", label: t("readable") },
		{ type: "archiveAsWaybackMachine", icon: "bi-archive", label: t("archive_org_snapshot") },
	];

	return {
		ARCHIVAL_OPTIONS,
		archivalTags,
		options,
		addTags,
		toggleOption,
		removeTag
	};
};

export { useArchivalTags };