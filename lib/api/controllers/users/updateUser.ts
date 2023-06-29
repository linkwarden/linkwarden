import { prisma } from "@/lib/api/db";
import { AccountSettings } from "@/types/global";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";

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
        const filePath = path.join(
          process.cwd(),
          `data/uploads/avatar/${userId}.jpg`
        );

        const base64Data = profilePic.replace(/^data:image\/jpeg;base64,/, "");

        fs.writeFile(filePath, base64Data, "base64", function (err) {
          console.log(err);
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
    fs.unlink(`data/uploads/avatar/${userId}.jpg`, (err) => {
      if (err) console.log(err);
    });
  }

  // Other settings

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      name: user.name,
      email: user.email,
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
