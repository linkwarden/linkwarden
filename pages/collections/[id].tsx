import LinkList from "@/components/LinkList";
import useLinkStore from "@/store/links";
import { useRouter } from "next/router";

export default function () {
  const router = useRouter();
  const { links } = useLinkStore();

  const linksByCollection = links.filter(
    (e) => e.collectionId === Number(router.query.id)
  );

  return (
    // ml-80
    <div className="p-5">
      <p className="text-center mb-5 text-gray-500 font-bold text-sm">
        {linksByCollection.length || 0} Links Found
      </p>
      {linksByCollection.map((e, i) => {
        return <LinkList key={i} link={e} count={i} />;
      })}
    </div>
  );
}
