import LinkList from "@/components/LinkViews/LinkList";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";

export default function ListView({
  links,
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
}) {
  return (
    <div className="flex flex-col">
      {links.map((e, i) => {
        return <LinkList key={i} link={e} count={i} />;
      })}
    </div>
  );
}
