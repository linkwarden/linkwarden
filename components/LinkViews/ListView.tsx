import LinkRow from "@/components/LinkViews/LinkComponents/LinkRow";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";

export default function ListView({
  links,
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
}) {
  return (
    <div className="flex flex-col">
      {links.map((e, i) => {
        return <LinkRow key={i} link={e} count={i} />;
      })}
    </div>
  );
}
