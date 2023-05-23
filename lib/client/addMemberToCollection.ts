import { ExtendedCollection, NewCollection } from "@/types/global";
import getPublicUserDataByEmail from "./getPublicUserDataByEmail";

const addMemberToCollection = async (
  ownerEmail: string,
  memberEmail: string,
  collection: ExtendedCollection,
  setMemberState: Function,
  collectionMethod: "ADD" | "UPDATE"
) => {
  const checkIfMemberAlreadyExists = collection.members.find((e: any) => {
    const email = collectionMethod === "ADD" ? e.email : e.user.email;
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

    if (user.email) {
      const newMember =
        collectionMethod === "ADD"
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
              canCreate: false,
              canUpdate: false,
              canDelete: false,
            }
          : {
              collectionId: collection.id,
              userId: user.id,
              canCreate: false,
              canUpdate: false,
              canDelete: false,
              user: {
                name: user.name,
                email: user.email,
              },
            };

      setMemberState(newMember);
    }
  }
};

export default addMemberToCollection;
