import CreatableSelect from "react-select/creatable";
import { styles } from "./styles";
import { useTranslation } from "next-i18next";
import { ArchivalTagOption } from "./types";
import { Tag } from "@prisma/client";


export const transformTag = (tag: Tag) => ({
	label: tag.name,
	value: tag.id,
	archiveAsScreenshot: tag.archiveAsScreenshot || false,
	archiveAsMonolith: tag.archiveAsMonolith || false,
	archiveAsPDF: tag.archiveAsPDF || false,
	archiveAsReadable: tag.archiveAsReadable || false,
	archiveAsWaybackMachine: tag.archiveAsWaybackMachine || false,
	aiTag: tag.aiTag || false,
});

export const isArchivalTag = (tag: Tag) =>
	tag.archiveAsScreenshot ||
	tag.archiveAsMonolith ||
	tag.archiveAsPDF ||
	tag.archiveAsReadable ||
	tag.archiveAsWaybackMachine ||
	tag.aiTag;

type Props = {
	options: ArchivalTagOption[] | []
	onChange: (e: any) => void;
};

export default function ArchivalTagSelection({
	options,
	onChange
}: Props) {
	const { t } = useTranslation();

	return (
		<CreatableSelect
			isClearable={false}
			className="react-select-container"
			classNamePrefix="react-select"
			onChange={onChange}
			options={options}
			styles={styles}
			value={[]}
			placeholder={t("tag_selection_placeholder")}
			isMulti
		/>
	);
}
