import LinkCardGrid from "@/components/LinkViews/LinkComponents/LinkCardGrid";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";

export default function CompactGridView({
  links,
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
}) {
  return (
    <div className="columns-1 xl:columns-2 2xl:columns-3 gap-5">
      {links.map((e, i) => {
        return (
          <div className="break-inside-avoid mb-5">
            <LinkCardGrid key={i} link={e} count={i} />
          </div>
        );
      })}
    </div>
  );
}
