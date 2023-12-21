import LinkGrid from "@/components/LinkViews/LinkGrid";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";

export default function GridView({
  links,
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
}) {
  return (
    <div className="columns-1 xl:columns-2 2xl:columns-3 gap-5">
      {links.map((e, i) => {
        return (
          <div key={i} className="break-inside-avoid mb-5">
            <LinkGrid link={e} count={i} />
          </div>
        );
      })}
    </div>
  );
}
