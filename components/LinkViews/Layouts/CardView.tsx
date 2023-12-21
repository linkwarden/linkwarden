import LinkCard from "@/components/LinkViews/LinkCard";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";

export default function DefaultGridView({
  links,
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
}) {
  return (
    <div className="grid 2xl:grid-cols-3 xl:grid-cols-2 grid-cols-1 gap-5">
      {links.map((e, i) => {
        return <LinkCard key={i} link={e} count={i} />;
      })}
    </div>
  );
}
