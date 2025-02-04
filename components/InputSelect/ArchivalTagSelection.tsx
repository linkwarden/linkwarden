import { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { styles } from "./styles";
import { ArchivalTagOption } from "./types";
import { useTags } from "@/hooks/store/tags";
import { useTranslation } from "next-i18next";
import { Tag } from "@prisma/client";

type Props = {
	onChange: (e: any) => void;
	selectedTags: ArchivalTagOption[] | [];
};

export default function ArchivalTagSelection({
	onChange,
	selectedTags
}: Props) {
	const { data: tags = [] } = useTags();
	const { t } = useTranslation();
	const [options, setOptions] = useState<ArchivalTagOption[]>([]);

	useEffect(() => {
		const formattedTags = tags.map((tag: Tag) => {
			return {
				value: tag.id,
				label: tag.name,
				archiveAsScreenshot: tag.archiveAsScreenshot || false,
				archiveAsMonolith: tag.archiveAsMonolith || false,
				archiveAsPDF: tag.archiveAsPDF || false,
				archiveAsReadable: tag.archiveAsReadable || false,
				archiveAsWaybackMachine: tag.archiveAsWaybackMachine || false,
				aiTag: tag.aiTag || false
			};
		});

		const filteredTags = formattedTags.filter((tag) => {
			return !selectedTags.find((selectedTag) => selectedTag.value === tag.value);
		});

		setOptions(filteredTags);
	}, [tags, selectedTags]);

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
