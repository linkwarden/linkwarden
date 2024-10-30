import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { useRouter } from "next/router";
import clsx from "clsx";
import usePinLink from "@/lib/client/pinLink";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  btnStyle?: string;
};

export default function LinkPin({ link, btnStyle }: Props) {
  const pinLink = usePinLink();
  const router = useRouter();

  const isPublicRoute = router.pathname.startsWith("/public") ? true : false;
  const isAlreadyPinned = link?.pinnedBy && link.pinnedBy[0] ? true : false;

  return (
    <div
      className="absolute top-3 right-[3.25rem] group-hover:opacity-100 group-focus-within:opacity-100 opacity-0 duration-100"
      onClick={() => pinLink(link)}
    >
      <div className={clsx("btn btn-sm btn-square text-neutral", btnStyle)}>
        <i
          title="Pin"
          className={clsx(
            "text-xl",
            isAlreadyPinned ? "bi-pin-fill" : "bi-pin"
          )}
        />
      </div>
    </div>
  );
}
