// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { prisma } from "@/lib/api/db";
import { AccountSettings } from "@/types/global";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";

export default async function (user: AccountSettings, userId: number) {
  const profilePic = user.profilePic;

  if (profilePic && profilePic !== "DELETE") {
    if ((user?.profilePic?.length as number) < 1572864) {
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
  } else if (profilePic === "DELETE") {
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

    const requestOldHashedPassword = bcrypt.hashSync(
      user.oldPassword,
      saltRounds
    );
    console.log(requestOldHashedPassword);

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

  const { password, ...unsensitiveInfo } = updatedUser;

  return { response: unsensitiveInfo, status: 200 };
}
