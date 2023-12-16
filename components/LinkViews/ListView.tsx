import LinkRow from "@/components/LinkViews/LinkRow";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";

export default function ListView({
  links,
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
}) {
  return (
    <div>
      <div className="flex flex-col border border-neutral-content bg-base-200 rounded-md">
        {links.map((e, i) => {
          return <LinkRow key={i} link={e} count={i} />;
        })}
        {links.map((e, i) => {
          return <LinkRow key={i} link={e} count={i} />;
        })}
        {links.map((e, i) => {
          return <LinkRow key={i} link={e} count={i} />;
        })}
      </div>
    </div>
  );
}
