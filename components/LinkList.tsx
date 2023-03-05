import { LinkAndTags } from "@/types/global";

export default function ({
  link,
  count,
}: {
  link: LinkAndTags;
  count: number;
}) {
  return (
    <div className="border border-sky-100 mb-5 bg-gray-100 p-5 rounded">
      <div className="flex items-baseline gap-1">
        <p className="text-sm text-sky-600">{count + 1}.</p>
        <p className="text-lg text-sky-500">{link.name}</p>
      </div>
      <div className="flex gap-1 items-baseline">
        {link.tags.map((e, i) => (
          <p key={i}>{e.name}</p>
        ))}
      </div>
    </div>
  );
}
