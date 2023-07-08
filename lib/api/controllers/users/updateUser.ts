import { prisma } from "@/lib/api/db";
import { AccountSettings } from "@/types/global";
import bcrypt from "bcrypt";
import removeFile from "@/lib/api/storage/removeFile";
import createFile from "@/lib/api/storage/createFile";

export default async function updateUser(
  user: AccountSettings,
  userId: number
) {
  // Password Settings
  if (user.newPassword && user.oldPassword) {
    const targetUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });

    if (
      targetUser &&
      bcrypt.compareSync(user.oldPassword, targetUser.password)
    ) {
      const saltRounds = 10;
      const newHashedPassword = bcrypt.hashSync(user.newPassword, saltRounds);

      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          password: newHashedPassword,
        },
      });
    } else {
      return { response: "Old password is incorrect.", status: 400 };
    }
  }

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

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      name: user.name,
      username: user.username.toLowerCase(),
      isPrivate: user.isPrivate,
      whitelistedUsers: user.whitelistedUsers,
    },
  });

  const { password, ...userInfo } = updatedUser;

  const response: Omit<AccountSettings, "password"> = {
    ...userInfo,
    profilePic: `/api/avatar/${userInfo.id}?${Date.now()}`,
  };

  return { response, status: 200 };
}
