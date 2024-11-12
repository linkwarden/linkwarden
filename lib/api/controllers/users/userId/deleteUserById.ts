import { prisma } from "@/lib/api/db";
import bcrypt from "bcrypt";
import removeFolder from "@/lib/api/storage/removeFolder";
import Stripe from "stripe";
import { DeleteUserBody } from "@/types/global";
import removeFile from "@/lib/api/storage/removeFile";
import updateSeats from "@/lib/api/stripe/updateSeats";

export default async function deleteUserById(
  userId: number,
  body: DeleteUserBody,
  isServerAdmin: boolean,
  queryId: number
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        include: {
          user: true,
        },
      },
      parentSubscription: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!user) {
    return {
      response: "Invalid credentials.",
      status: 404,
    };
  }

  if (!isServerAdmin) {
    if (queryId === userId) {
      if (user.password) {
        const isPasswordValid = bcrypt.compareSync(
          body.password,
          user.password
        );

        if (!isPasswordValid && !isServerAdmin) {
          return {
            response: "Invalid credentials.",
            status: 401,
          };
        }
      } else {
        return {
          response:
            "User has no password. Please reset your password from the forgot password page.",
          status: 401,
        };
      }
    } else {
      if (user.parentSubscriptionId) {
        return {
          response: "Permission denied.",
          status: 401,
        };
      } else {
        if (!user.subscriptions) {
          return {
            response: "User has no subscription.",
            status: 401,
          };
        }

        const findChild = await prisma.user.findFirst({
          where: { id: queryId, parentSubscriptionId: user.subscriptions?.id },
        });

        if (!findChild)
          return {
            response: "Permission denied.",
            status: 401,
          };

        const removeUser = await prisma.user.update({
          where: { id: findChild.id },
          data: {
            parentSubscription: {
              disconnect: true,
            },
          },
        });

        if (removeUser.emailVerified)
          await updateSeats(
            user.subscriptions.stripeSubscriptionId,
            user.subscriptions.quantity - 1
          );

        return {
          response: "Account removed from subscription.",
          status: 200,
        };
      }
    }
  }

  // Delete the user and all related data within a transaction
  await prisma
    .$transaction(
      async (prisma) => {
        // Delete Access Tokens
        await prisma.accessToken.deleteMany({
          where: { userId: queryId },
        });

        // Delete whitelisted users
        await prisma.whitelistedUser.deleteMany({
          where: { userId: queryId },
        });

        // Delete links
        await prisma.link.deleteMany({
          where: { collection: { ownerId: queryId } },
        });

        // Delete tags
        await prisma.tag.deleteMany({
          where: { ownerId: queryId },
        });

        // Find collections that the user owns
        const collections = await prisma.collection.findMany({
          where: { ownerId: queryId },
        });

        for (const collection of collections) {
          // Delete related users and collections relations
          await prisma.usersAndCollections.deleteMany({
            where: { collectionId: collection.id },
          });

          // Delete archive folders
          await removeFolder({ filePath: `archives/${collection.id}` });

          await removeFolder({
            filePath: `archives/preview/${collection.id}`,
          });
        }

        // Delete collections after cleaning up related data
        await prisma.collection.deleteMany({
          where: { ownerId: queryId },
        });

        // Delete subscription
        if (process.env.STRIPE_SECRET_KEY)
          await prisma.subscription
            .delete({
              where: { userId: queryId },
            })
            .catch((err) => console.log(err));

        await prisma.usersAndCollections.deleteMany({
          where: {
            OR: [{ userId: queryId }, { collection: { ownerId: queryId } }],
          },
        });

        // Delete user's avatar
        await removeFile({ filePath: `uploads/avatar/${queryId}.jpg` });

        // Finally, delete the user
        await prisma.user.delete({
          where: { id: queryId },
        });
      },
      { timeout: 20000 }
    )
    .catch((err) => console.log(err));

  if (process.env.STRIPE_SECRET_KEY) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2022-11-15",
    });

    try {
      if (user.subscriptions?.id) {
        const deleted = await stripe.subscriptions.cancel(
          user.subscriptions.stripeSubscriptionId,
          {
            cancellation_details: {
              comment: body.cancellation_details?.comment,
              feedback: body.cancellation_details?.feedback,
            },
          }
        );

        return {
          response: deleted,
          status: 200,
        };
      } else if (user.parentSubscription?.id && user && user.emailVerified) {
        await updateSeats(
          user.parentSubscription.stripeSubscriptionId,
          user.parentSubscription.quantity - 1
        );

        return {
          response: "User account and all related data deleted successfully.",
          status: 200,
        };
      }
    } catch (err) {
      console.log(err);
    }
  }

  return {
    response: "User account and all related data deleted successfully.",
    status: 200,
  };
}
