import { CollectionIncludingMembersAndLinkCount, Member } from "@/types/global";
import getPublicUserDataByEmail from "./getPublicUserDataByEmail";

const addMemberToCollection = async (
  ownerEmail: string,
  memberEmail: string,
  collection: CollectionIncludingMembersAndLinkCount,
  setMember: (newMember: Member) => null | undefined
) => {
  console.log(collection.members);
  const checkIfMemberAlreadyExists = collection.members.find((e) => {
    const email = e.user.email;
    return email === memberEmail;
  });

  if (
    // no duplicate members
    !checkIfMemberAlreadyExists &&
    // member can't be empty
    memberEmail.trim() !== "" &&
    // member can't be the owner
    memberEmail.trim() !== ownerEmail
  ) {
    // Lookup, get data/err, list ...
    const user = await getPublicUserDataByEmail(memberEmail.trim());

    console.log(collection);

    if (user.email) {
      setMember({
        collectionId: collection.id,
        userId: user.id,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        user: {
          name: user.name,
          email: user.email,
        },
      });
    }
  }
};

export default addMemberToCollection;
