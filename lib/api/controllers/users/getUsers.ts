// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { prisma } from "@/lib/api/db";

export default async function (
  lookupEmail: string,
  isSelf: boolean,
  userEmail: string
) {
  const user = await prisma.user.findUnique({
    where: {
      email: lookupEmail,
    },
  });

  if (!user) return { response: "User not found.", status: 404 };

  if (
    !isSelf &&
    user?.isPrivate &&
    !user.whitelistedUsers.includes(userEmail)
  ) {
    return { response: "This profile is private.", status: 401 };
  }

  const { password, ...unsensitiveInfo } = user;

  const data = isSelf
    ? // If user is requesting its own data
      unsensitiveInfo
    : {
        // If user is requesting someone elses data
        id: unsensitiveInfo.id,
        name: unsensitiveInfo.name,
        email: unsensitiveInfo.email,
      };

  return { response: data || null, status: 200 };
}
