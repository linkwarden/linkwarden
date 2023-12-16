import {
    CollectionIncludingMembersAndLinkCount,
    LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import {faLink} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useEffect, useState} from "react";
import Image from "next/image";
import useLinkStore from "@/store/links";
import useCollectionStore from "@/store/collections";
import {
    faFileImage,
    faFilePdf,
} from "@fortawesome/free-regular-svg-icons";
import isValidUrl from "@/lib/shared/isValidUrl";
import unescapeString from "@/lib/client/unescapeString";
import LinkActions from "@/components/LinkViews/LinkComponents/LinkActions";
import LinkDate from "@/components/LinkViews/LinkComponents/LinkDate";
import LinkCollection from "@/components/LinkViews/LinkComponents/LinkCollection";
import LinkIcon from "@/components/LinkViews/LinkComponents/LinkIcon";

type Props = {
    link: LinkIncludingShortenedCollectionAndTags;
    count: number;
    className?: string;
};

export default function LinkCard({link, count, className}: Props) {
    const {links} = useLinkStore();

    const {collections} = useCollectionStore();

    const [collection, setCollection] =
        useState<CollectionIncludingMembersAndLinkCount>(
            collections.find(
                (e) => e.id === link.collection.id
            ) as CollectionIncludingMembersAndLinkCount
        );

    useEffect(() => {
        setCollection(
            collections.find(
                (e) => e.id === link.collection.id
            ) as CollectionIncludingMembersAndLinkCount
        );
    }, [collections, links]);

    let shortendURL;

    try {
        shortendURL = new URL(link.url || "").host.toLowerCase();
    } catch (error) {
        console.log(error);
    }

    const url =
        isValidUrl(link.url || "") && link.url ? new URL(link.url) : undefined;

    return (
        <div
            className={`h-fit hover:bg-base-300 hover:border-base-300 border border-solid border-neutral-content bg-base-200 shadow-md hover:shadow-none duration-200 rounded-2xl relative ${
                className || ""
            }`}
        >
            <div
                onClick={() => link.url && window.open(link.url || "", "_blank")}
                className="flex flex-col justify-between cursor-pointer h-full w-full gap-1 p-3"
            >
                <div className="absolute bottom-3 right-3">
                    <LinkIcon link={link} />
                </div>

                <div className="flex items-baseline gap-1">
                    <p className="text-sm text-neutral">{count + 1}</p>
                    <p className="text-lg truncate w-full pr-8">
                        {unescapeString(link.name || link.description) || link.url}
                    </p>
                </div>

                {link.url ? (
                    <div className="flex items-center gap-1 max-w-full w-fit text-neutral">
                        <FontAwesomeIcon icon={faLink} className="mt-1 w-4 h-4"/>
                        <p className="truncate w-full">{shortendURL}</p>
                    </div>
                ) : (
                    <div className="badge badge-primary badge-sm my-1">{link.type}</div>
                )}

                <LinkCollection link={link} collection={collection}/>

                <LinkDate link={link}/>
                {/* {link.tags[0] ? (
<div className="flex gap-3 items-center flex-wrap mt-2 truncate relative">
<div className="flex gap-1 items-center flex-nowrap">
{link.tags.map((e, i) => (
<Link
  href={"/tags/" + e.id}
  key={i}
  onClick={(e) => {
    e.stopPropagation();
  }}
  className="btn btn-xs btn-ghost truncate max-w-[19rem]"
>
  #{e.name}
</Link>
))}
</div>
<div className="absolute w-1/2 top-0 bottom-0 right-0 bg-gradient-to-r from-transparent to-base-200 to-35%"></div>
</div>
) : (
<p className="text-xs mt-2 p-1 font-semibold italic">No Tags</p>
)} */}
            </div>

            <LinkActions link={link} collection={collection}/>
        </div>
    );
}
