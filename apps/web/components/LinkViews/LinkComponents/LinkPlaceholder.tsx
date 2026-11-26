import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types/global";
import React, { useMemo } from "react";
import { getLinkPlaceholder } from "@linkwarden/lib/linkPlaceholder";

// Banner for a link without a preview: a faint tint of the site's color. The
// link's icon goes on top like on any other banner (LinkIcon), blurred under it
// like a preview.
function LinkPlaceholder({
  link,
  className,
  blur,
}: {
  link: LinkIncludingShortenedCollectionAndTags;
  className?: string;
  blur?: boolean;
}) {
  const { url, name } = link;

  const style = useMemo(() => {
    const { color } = getLinkPlaceholder({ url, name });

    // Mixed in oklab: the theme grays are oklch with a hue of 0, which would
    // pull every site color toward red in an oklch mix.
    const ground = "var(--link-placeholder-ground)";

    return {
      backgroundColor: `color-mix(in oklab, ${color} 12%, ${ground})`,
      backgroundImage: `radial-gradient(circle, color-mix(in oklab, ${color} 30%, ${ground}) 1px, transparent 1.5px)`,
      backgroundSize: "14px 14px",
      filter: blur ? "blur(1px)" : undefined,
    };
  }, [url, name, blur]);

  return <div className={className} style={style}></div>;
}

export default React.memo(LinkPlaceholder);
