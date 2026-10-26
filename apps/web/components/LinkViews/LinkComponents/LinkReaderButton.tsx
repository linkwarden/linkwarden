import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types/global";
import { useRouter } from "next/router";
import clsx from "clsx";
import { formatAvailable } from "@linkwarden/lib/formatStats";
import { Button } from "@/components/ui/button";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  btnStyle?: string;
};

export default function LinkReaderButton({ link, btnStyle }: Props) {
  const router = useRouter();
  const isPublic = router.pathname.startsWith("/public");

  if (!formatAvailable(link, "readable")) return null;

  const openReader = () => {
    window.open(
      `${isPublic ? "/public" : ""}/preserved/${link?.id}?format=readability`,
      "_blank"
    );
  };

  return (
    <Button
      variant="simple"
      size="icon"
      className={clsx(
        "absolute top-3 right-[6.5rem] group-hover:opacity-100 group-focus-within:opacity-100 opacity-0 duration-100 text-neutral",
        btnStyle
      )}
      onClick={(e) => {
        e.stopPropagation();
        openReader();
      }}
    >
      <i title="Open Reader" className="bi-book text-xl" />
    </Button>
  );
}
