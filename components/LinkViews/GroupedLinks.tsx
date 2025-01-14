import { GroupBy, LinkIncludingShortenedCollectionAndTags, Sort, SortToGroupMap } from "@/types/global";
import { useMemo } from "react";
import { useTranslation } from "next-i18next";

function getGroupKeyFromLink(link: LinkIncludingShortenedCollectionAndTags, groupBy: GroupBy) {
    switch (groupBy) {
        case GroupBy.Date: {
            const date = new Date(link.createdAt as string);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            return `${year}.${month}.${day}`;
        }
        case GroupBy.Name:
            return link.name.charAt(0).toUpperCase();
        case GroupBy.Description:
            return link.description ? link.description.charAt(0).toUpperCase() : '#';
        default:
            return '';
    }
}

export default function GroupedLinks({
    links,
    sortBy,
    enableGrouping,
    renderLinks
}: {
    links?: LinkIncludingShortenedCollectionAndTags[];
    sortBy: Sort;
    enableGrouping: boolean;
    renderLinks: (groupLinks: LinkIncludingShortenedCollectionAndTags[]) => React.ReactNode;
}) {
    const { t } = useTranslation();
    const groupedLinks = useMemo(() => {
        if (!links || !enableGrouping) {
            return { "": links || [] };
        }

        const groupBy = SortToGroupMap[sortBy] || GroupBy.None;
        if (groupBy === GroupBy.None) {
            return { "": links };
        }

        return links.reduce((groups: { [key: string]: LinkIncludingShortenedCollectionAndTags[] }, link) => {
            const groupKey = getGroupKeyFromLink(link, groupBy);

            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(link);
            return groups;
        }, {});
    }, [links, sortBy, enableGrouping]);

    return (
        <div className="flex flex-col gap-8">
            {Object.entries(groupedLinks).map(([groupName, groupLinks]) => (
                <div key={groupName} className="space-y-4">
                    {groupName && enableGrouping && (
                        <h2 className="text-xl font-semibold text-neutral">{groupName}</h2>
                    )}
                    {renderLinks(groupLinks)}
                </div>
            ))}
        </div>
    );
} 