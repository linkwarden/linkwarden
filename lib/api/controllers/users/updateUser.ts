import { prisma } from "@/lib/api/db";
import { AccountSettings } from "@/types/global";
import bcrypt from "bcrypt";
import removeFile from "@/lib/api/storage/removeFile";
import createFile from "@/lib/api/storage/createFile";
import updateCustomerEmail from "../../updateCustomerEmail";

export default async function updateUser(
  user: AccountSettings,
  sessionUser: {
    id: number;
    username: string;
    email: string;
    isSubscriber: boolean;
  }
) {
  if (!user.username || !user.email)
    return {
      response: "Username/Email invalid.",
      status: 400,
    };

  const checkUsername = RegExp("^[a-z0-9_-]{3,31}$");

  if (!checkUsername.test(user.username))
    return {
      response:
        "Username has to be between 3-30 characters, no spaces and special characters are allowed.",
      status: 400,
    };

  const userIsTaken = await prisma.user.findFirst({
    where: {
      id: { not: sessionUser.id },
      OR: [
        {
          username: user.username.toLowerCase(),
        },
        {
          email: user.email.toLowerCase(),
        },
      ],
    },
  });

  if (userIsTaken)
    return {
      response: "Username/Email is taken.",
      status: 400,
    };

  // Avatar Settings

  const profilePic = user.profilePic;

  if (profilePic.startsWith("data:image/jpeg;base64")) {
    if (user.profilePic.length < 1572864) {
      try {
        const base64Data = profilePic.replace(/^data:image\/jpeg;base64,/, "");

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
  const newHashedPassword = bcrypt.hashSync(user.newPassword || "", saltRounds);

  const updatedUser = await prisma.user.update({
    where: {
      id: sessionUser.id,
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

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const PRICE_ID = process.env.PRICE_ID;

  if (STRIPE_SECRET_KEY && PRICE_ID)
    await updateCustomerEmail(
      STRIPE_SECRET_KEY,
      PRICE_ID,
      sessionUser.email,
      user.email
    );

  const { password, ...userInfo } = updatedUser;

  const response: Omit<AccountSettings, "password"> = {
    ...userInfo,
    profilePic: `/api/avatar/${userInfo.id}?${Date.now()}`,
  };

  return { response, status: 200 };
}
