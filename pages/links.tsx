import LinkList from "@/components/LinkList";
import useLinkStore from "@/store/links";

export default function Links() {
  const { links } = useLinkStore();

  return (
    <div className="p-5 flex flex-col gap-5 w-full">
      {links.map((e, i) => {
        return <LinkList key={i} link={e} count={i} />;
      })}
    </div>
  );
}
