import { useEffect, useState } from "react";
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import ProfilePhoto from "@/components/ProfilePhoto";
import getPublicUserData from "@/lib/client/getPublicUserData";

type Props = {
  collection: CollectionIncludingMembersAndLinkCount;
};

export default function ViewTeam({ collection }: Props) {
  const [collectionOwner, setCollectionOwner] = useState({
    id: null,
    name: "",
    username: "",
    image: "",
  });

  useEffect(() => {
    const fetchOwner = async () => {
      const owner = await getPublicUserData(collection.ownerId as number);
      setCollectionOwner(owner);
    };

    fetchOwner();
  }, []);

  return (
    <div className="flex flex-col gap-3 sm:w-[35rem] w-80">
      <p className="ml-10 text-xl font-thin">Team</p>

      <p>Here are all the members who are collaborating on this collection.</p>

      <div
        className="relative border px-2 rounded-md border-neutral flex min-h-[4rem] gap-2 justify-between"
        title={`@${collectionOwner.username} is the owner of this collection.`}
      >
        <div className="flex items-center gap-2 w-full">
          <ProfilePhoto
            src={collectionOwner.image ? collectionOwner.image : undefined}
            className="border-[3px]"
          />
          <div className="w-full">
            <div className="flex items-center gap-1 w-full justify-between">
              <p className="text-sm font-bold">{collectionOwner.name}</p>
              <div className="flex text-xs gap-1 items-center">
                Admin
              </div>
            </div>
            <p className="text-neutral">@{collectionOwner.username}</p>
          </div>
        </div>
      </div>

      {collection?.members[0]?.user && (
        <>
          <div className="flex flex-col gap-3 rounded-md">
            {collection.members
              .sort((a, b) => (a.userId as number) - (b.userId as number))
              .map((e, i) => {
                return (
                  <div
                    key={i}
                    className="relative border p-2 rounded-md border-neutral flex flex-col sm:flex-row sm:items-center gap-2 justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <ProfilePhoto
                        src={e.user.image ? e.user.image : undefined}
                        className="border-[3px]"
                      />
                      <div>
                        <p className="text-sm font-bold">{e.user.name}</p>
                        <p className="text-neutral">@{e.user.username}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
