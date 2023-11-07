import { CollectionIncludingMembersAndLinkCount, Member } from "@/types/global";
import getPublicUserData from "./getPublicUserData";
import { toast } from "react-hot-toast";

const addMemberToCollection = async (
  ownerUsername: string,
  memberUsername: string,
  collection: CollectionIncludingMembersAndLinkCount,
  setMember: (newMember: Member) => null | undefined
) => {
  const checkIfMemberAlreadyExists = collection.members.find((e) => {
    const username = (e.user.username || "").toLowerCase();
    return username === memberUsername.toLowerCase();
  });

  if (
    // no duplicate members
    !checkIfMemberAlreadyExists &&
    // member can't be empty
    memberUsername.trim() !== "" &&
    // member can't be the owner
    memberUsername.trim().toLowerCase() !== ownerUsername.toLowerCase()
  ) {
    // Lookup, get data/err, list ...
    const user = await getPublicUserData(memberUsername.trim().toLowerCase());

    if (user.username) {
      setMember({
        collectionId: collection.id,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        userId: user.id,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          image: user.image,
        },
      });
    }
  } else if (checkIfMemberAlreadyExists) toast.error("User already exists.");
  else if (memberUsername.trim().toLowerCase() === ownerUsername.toLowerCase())
    toast.error("You are already the collection owner.");
};

export default addMemberToCollection;
