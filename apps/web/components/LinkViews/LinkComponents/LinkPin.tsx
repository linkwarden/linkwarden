import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types";
import { useRouter } from "next/router";
import clsx from "clsx";
import usePinLink from "@/lib/client/pinLink";
import { Button } from "@/components/ui/Button";

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
    <Button
      variant="simple"
      size="icon"
      className={clsx(
        "absolute top-3 right-[3.25rem] group-hover:opacity-100 group-focus-within:opacity-100 opacity-0 duration-100 text-neutral",
        btnStyle
      )}
      onClick={() => pinLink(link)}
    >
      <i
        title="Pin"
        className={clsx("text-xl", isAlreadyPinned ? "bi-pin-fill" : "bi-pin")}
      />
    </Button>
  );
}
