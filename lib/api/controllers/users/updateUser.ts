import { prisma } from "@/lib/api/db";
import { AccountSettings } from "@/types/global";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";

export default async function (user: AccountSettings, userId: number) {
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
    }
  } else if (profilePic == "") {
    fs.unlink(`data/uploads/avatar/${userId}.jpg`, (err) => {
      if (err) console.log(err);
    });
  }

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

  if (user.newPassword && user.oldPassword) {
    const saltRounds = 10;

    if (bcrypt.compareSync(user.oldPassword, updatedUser.password)) {
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
      return { response: "Passwords do not match.", status: 403 };
    }
  }

  const { password, ...userInfo } = updatedUser;

  const response: Omit<AccountSettings, "password"> = {
    ...userInfo,
    profilePic: `/api/avatar/${userInfo.id}?${Date.now()}`,
  };

  return { response, status: 200 };
}
