import LinkCardCompact from "@/components/LinkViews/LinkCardCompact";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";

export default function CompactGridView({
  links,
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
}) {
  return (
    <div className="grid 2xl:grid-cols-3 xl:grid-cols-2 grid-cols-1 gap-5">
      {links.map((e, i) => {
        return <LinkCardCompact key={i} link={e} count={i} />;
      })}
    </div>
  );
}
