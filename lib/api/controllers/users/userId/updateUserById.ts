import { prisma } from "@/lib/api/db";
import { AccountSettings } from "@/types/global";
import bcrypt from "bcrypt";
import removeFile from "@/lib/api/storage/removeFile";
import createFile from "@/lib/api/storage/createFile";
import updateCustomerEmail from "@/lib/api/updateCustomerEmail";
import createFolder from "@/lib/api/storage/createFolder";

const emailEnabled =
  process.env.EMAIL_FROM && process.env.EMAIL_SERVER ? true : false;

export default async function updateUser(
  sessionUser: {
    id: number;
    username: string;
    email: string;
    isSubscriber: boolean;
  },
  data: AccountSettings
) {
  if (emailEnabled && !data.email)
    return {
      response: "Email invalid.",
      status: 400,
    };
  else if (!data.username)
    return {
      response: "Username invalid.",
      status: 400,
    };

  // Check email (if enabled)
  const checkEmail =
    /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  if (emailEnabled && !checkEmail.test(data.email?.toLowerCase() || ""))
    return {
      response: "Please enter a valid email.",
      status: 400,
    };

  const checkUsername = RegExp("^[a-z0-9_-]{3,31}$");

  if (!checkUsername.test(data.username.toLowerCase()))
    return {
      response:
        "Username has to be between 3-30 characters, no spaces and special characters are allowed.",
      status: 400,
    };

  const userIsTaken = await prisma.user.findFirst({
    where: {
      id: { not: sessionUser.id },
      OR: emailEnabled
        ? [
            {
              username: data.username.toLowerCase(),
            },
            {
              email: data.email?.toLowerCase(),
            },
          ]
        : [
            {
              username: data.username.toLowerCase(),
            },
          ],
    },
  });

  if (userIsTaken) {
    if (data.email?.toLowerCase().trim() === userIsTaken.email?.trim())
      return {
        response: "Email is taken.",
        status: 400,
      };
    else if (
      data.username?.toLowerCase().trim() === userIsTaken.username?.trim()
    )
      return {
        response: "Username is taken.",
        status: 400,
      };

    return {
      response: "Username/Email is taken.",
      status: 400,
    };
  }

  // Avatar Settings

  const profilePic = data.profilePic;

  if (profilePic.startsWith("data:image/jpeg;base64")) {
    if (data.profilePic.length < 1572864) {
      try {
        const base64Data = profilePic.replace(/^data:image\/jpeg;base64,/, "");

        createFolder({ filePath: `uploads/avatar` });

        await createFile({
          filePath: `uploads/avatar/${sessionUser.id}.jpg`,
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
    removeFile({ filePath: `uploads/avatar/${sessionUser.id}.jpg` });
  }

  // Other settings

  const saltRounds = 10;
  const newHashedPassword = bcrypt.hashSync(data.newPassword || "", saltRounds);

  const updatedUser = await prisma.user.update({
    where: {
      id: sessionUser.id,
    },
    data: {
      name: data.name,
      username: data.username.toLowerCase().trim(),
      email: data.email?.toLowerCase().trim(),
      isPrivate: data.isPrivate,
      archiveAsScreenshot: data.archiveAsScreenshot,
      archiveAsPDF: data.archiveAsPDF,
      archiveAsWaybackMachine: data.archiveAsWaybackMachine,
      password:
        data.newPassword && data.newPassword !== ""
          ? newHashedPassword
          : undefined,
    },
    include: {
      whitelistedUsers: true,
    },
  });

  const { whitelistedUsers, password, ...userInfo } = updatedUser;

  // If user.whitelistedUsers is not provided, we will assume the whitelistedUsers should be removed
  const newWhitelistedUsernames: string[] = data.whitelistedUsers || [];

  // Get the current whitelisted usernames
  const currentWhitelistedUsernames: string[] = whitelistedUsers.map(
    (data) => data.username
  );

  // Find the usernames to be deleted (present in current but not in new)
  const usernamesToDelete: string[] = currentWhitelistedUsernames.filter(
    (username) => !newWhitelistedUsernames.includes(username)
  );

  // Find the usernames to be created (present in new but not in current)
  const usernamesToCreate: string[] = newWhitelistedUsernames.filter(
    (username) =>
      !currentWhitelistedUsernames.includes(username) && username.trim() !== ""
  );

  // Delete whitelistedUsers that are not present in the new list
  await prisma.whitelistedUser.deleteMany({
    where: {
      userId: sessionUser.id,
      username: {
        in: usernamesToDelete,
      },
    },
  });

  // Create new whitelistedUsers that are not in the current list, no create many ;(
  for (const username of usernamesToCreate) {
    await prisma.whitelistedUser.create({
      data: {
        username,
        userId: sessionUser.id,
      },
    });
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

  if (STRIPE_SECRET_KEY && emailEnabled && sessionUser.email !== data.email)
    await updateCustomerEmail(
      STRIPE_SECRET_KEY,
      sessionUser.email,
      data.email as string
    );

  const response: Omit<AccountSettings, "password"> = {
    ...userInfo,
    whitelistedUsers: newWhitelistedUsernames,
    profilePic: `/api/v1/avatar/${userInfo.id}?${Date.now()}`,
  };

  return { response, status: 200 };
}
