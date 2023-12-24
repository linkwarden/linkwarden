import LinkCard from "@/components/LinkViews/LinkCard";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";

export default function CardView({
  links,
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
}) {
  return (
    <div className="grid min-[1900px]:grid-cols-4 xl:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-5">
      {links.map((e, i) => {
        return <LinkCard key={i} link={e} count={i} />;
      })}
    </div>
  );
}
