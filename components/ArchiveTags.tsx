import React from 'react';
import { ArchivalTagOption } from './InputSelect/types';
import { useTranslation } from 'react-i18next';

interface ArchiveTagsProps {
	archivalTags?: ArchivalTagOption[];
	// onUpdateTag: (id: number, tag: ArchivalTagOptions) => void;
}

const ArchiveTags: React.FC<ArchiveTagsProps> = ({ archivalTags }) => {
	const { t } = useTranslation();
	const buttons = [
		{ key: 'screenshot', icon: 'file-earmark-image', flag: 'archiveAsScreenshot' },
		{ key: 'webpage', icon: 'filetype-html', flag: 'archiveAsMonolith' },
		{ key: 'pdf', icon: 'file-earmark-pdf', flag: 'archiveAsPDF' },
		{ key: 'readable', icon: 'file-earmark-text', flag: 'archiveAsReadable' },
		{ key: 'archive_org_snapshot', icon: 'archive', flag: 'archiveAsWaybackMachine' }
	] as const;

	return (
		<>
			{archivalTags?.map((tag, index) => (
				<div
					key={`${tag.label}-${index}`}
					className="w-full flex items-center justify-between bg-base-200 p-2 rounded first-of-type:mt-4"
				>
					<span className="text-lg text-white">{tag.label}</span>
					<div className="grid grid-cols-6 gap-2">
						{buttons.map(({ key, icon, flag }) => (
							<div key={key} className="tooltip tooltip-top" data-tip={t(key)}>
								<button
									className={`py-1 px-2 bg-base-300 rounded ${tag[flag] ? 'bg-primary bg-opacity-25' : ''}`}
								>
									<i className={`bi-${icon} text-lg leading-none`}></i>
								</button>
							</div>
						))}
						<div className="tooltip tooltip-top" data-tip={t("delete")}>
							<button className="py-1 px-2">
								<i className="bi-x text-lg leading-none"></i>
							</button>
						</div>
					</div>
				</div>
			))}
		</>
	);
};

export default ArchiveTags;