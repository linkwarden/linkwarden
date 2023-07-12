import { prisma } from "@/lib/api/db";
import { AccountSettings } from "@/types/global";
import bcrypt from "bcrypt";
import removeFile from "@/lib/api/storage/removeFile";
import createFile from "@/lib/api/storage/createFile";

export default async function updateUser(
  user: AccountSettings,
  userId: number
) {
  if (!user.username || !user.email)
    return {
      response: "Username/Email invalid.",
      status: 400,
    };

  // Avatar Settings

  const profilePic = user.profilePic;

  if (profilePic.startsWith("data:image/jpeg;base64")) {
    if (user.profilePic.length < 1572864) {
      try {
        const base64Data = profilePic.replace(/^data:image\/jpeg;base64,/, "");

        await createFile({
          filePath: `uploads/avatar/${userId}.jpg`,
          data: base64Data,
          isBase64: true,
        });
      } catch (err) {
        console.log("Error saving image:", err);
      }
    } else {
      console.log("A file larger than 1.5MB was uploaded.");
      return {
        response: "A file larger than 1.5MB was uploaded.",
        status: 400,
      };
    }
  } else if (profilePic == "") {
    removeFile({ filePath: `uploads/avatar/${userId}.jpg` });
  }

  // Other settings

  const saltRounds = 10;
  const newHashedPassword = bcrypt.hashSync(user.newPassword || "", saltRounds);

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      name: user.name,
      username: user.username.toLowerCase(),
      email: user.email?.toLowerCase(),
      isPrivate: user.isPrivate,
      whitelistedUsers: user.whitelistedUsers,
      password:
        user.newPassword && user.newPassword !== ""
          ? newHashedPassword
          : undefined,
    },
  });

  const { password, ...userInfo } = updatedUser;

  const response: Omit<AccountSettings, "password"> = {
    ...userInfo,
    profilePic: `/api/avatar/${userInfo.id}?${Date.now()}`,
  };

  return { response, status: 200 };
}
