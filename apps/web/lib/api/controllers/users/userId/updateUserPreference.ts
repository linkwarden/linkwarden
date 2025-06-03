import { prisma } from "@linkwarden/prisma";
import {
  UpdateUserPreferenceSchemaType,
  UpdateUserPreferenceSchema,
} from "@linkwarden/lib/schemaValidation";

export default async function updateUserPreference(
  userId: number,
  body: UpdateUserPreferenceSchemaType
) {
  const dataValidation = UpdateUserPreferenceSchema.safeParse(body);

  if (!dataValidation.success) {
    return {
      response: `Error: ${
        dataValidation.error.issues[0].message
      } [${dataValidation.error.issues[0].path.join(", ")}]`,
      status: 400,
    };
  }

  const data = dataValidation.data;

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      theme: data.theme,
      readableFontFamily: data.readableFontFamily,
      readableFontSize: data.readableFontSize,
      readableLineHeight: data.readableLineHeight,
      readableLineWidth: data.readableLineWidth,
    },
    include: {
      whitelistedUsers: true,
      subscriptions: true,
      parentSubscription: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!updatedUser)
    return { response: "User not found or profile is private.", status: 404 };

  const whitelistedUsernames = updatedUser.whitelistedUsers?.map(
    (usernames) => usernames.username
  );

  const { password, subscriptions, parentSubscription, ...lessSensitiveInfo } =
    updatedUser;

  const response = {
    ...lessSensitiveInfo,
    whitelistedUsers: whitelistedUsernames,
    subscription: {
      active: subscriptions?.active,
      quantity: subscriptions?.quantity,
    },
    parentSubscription: {
      active: parentSubscription?.active,
      user: {
        email: parentSubscription?.user.email,
      },
    },
  };

  return { response, status: 200 };
}
