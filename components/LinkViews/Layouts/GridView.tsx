import LinkGrid from "@/components/LinkViews/LinkGrid";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";

export default function GridView({
  links,
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
}) {
  return (
    <div className="grid 2xl:grid-cols-3 xl:grid-cols-2 grid-cols-1 gap-5">
      {links.map((e, i) => {
        return <LinkGrid link={e} count={i} key={i} />;
      })}
    </div>
  );
}
