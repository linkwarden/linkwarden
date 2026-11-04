import { prisma } from "@linkwarden/prisma";
import checkPassword from "@/lib/api/checkPassword";
import { removeFolder, removeFile } from "@linkwarden/filesystem";
import { DeleteUserBody } from "@linkwarden/types/global";
import updateSeats from "@/lib/api/billing/updateSeats";
import { meiliClient } from "@linkwarden/lib/meilisearchClient";
import stripeSDK from "@/lib/api/billing/stripeSDK";
import { isStoreBillingConfigured } from "@/lib/api/billing/syncStoreSubscription";
import {
  cancelGoogleSubscription,
  isGooglePlayConfigured,
} from "@/lib/api/billing/googlePlay";
import transporter from "@linkwarden/lib/transporter";

export default async function deleteUserById(
  userId: number,
  body: DeleteUserBody,
  isServerAdmin: boolean,
  queryId: number,
  bypassPassword: boolean = false
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
      // Non-subscribers (only granted when billing is enabled) may delete their
      // own account without re-entering their password.
      if (!bypassPassword) {
        if (user.password) {
          const passwordCheck = await checkPassword(
            user.id,
            user.password,
            body.password
          );

          if (passwordCheck.status === "too_many_attempts")
            return {
              response: passwordCheck.response,
              status: 429,
            };

          if (passwordCheck.status === "incorrect") {
            return {
              response: "Invalid credentials.",
              status: 401,
            };
          }
        } else {
          return {
            response:
              "User has no password. Please create one from the password settings page.",
            status: 401,
          };
        }
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

        if (
          removeUser.emailVerified &&
          user.subscriptions.provider === "STRIPE" &&
          user.subscriptions.stripeSubscriptionId
        )
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
        const links = await prisma.link.findMany({
          where: { collection: { ownerId: queryId } },
          select: { id: true },
        });

        const linkIds = links.map((link) => link.id);

        await meiliClient?.index("links").deleteDocuments(linkIds);

        const collections = await prisma.collection.findMany({
          where: { ownerId: queryId },
        });

        await Promise.all(
          collections.map(async (collection) => {
            await removeFolder({ filePath: `archives/${collection.id}` });
            await removeFolder({
              filePath: `archives/preview/${collection.id}`,
            });
          })
        );

        await removeFile({ filePath: `uploads/avatar/${queryId}.jpg` });

        const billingEnabled =
          Boolean(process.env.STRIPE_SECRET_KEY) || isStoreBillingConfigured();

        // Send an email about cancellation reason if provided
        if (
          billingEnabled &&
          (body.cancellation_details?.comment ||
            body.cancellation_details?.feedback ||
            user.acceptPromotionalEmails)
        ) {
          try {
            await transporter.sendMail({
              from: process.env.EMAIL_FROM,
              to: "hello@linkwarden.app",
              subject: "Linkwarden User Cancellation",
              text: `User: ${user.email}\nFeedback: ${
                body.cancellation_details?.feedback || "N/A"
              }\nComment: ${
                body.cancellation_details?.comment || "N/A"
              }\nPromotional Emails: ${String(user.acceptPromotionalEmails)}`,
            });
          } catch (err) {
            console.log(err);
          }
        }

        if (
          process.env.STRIPE_SECRET_KEY &&
          user.subscriptions?.provider === "STRIPE"
        ) {
          const stripe = stripeSDK();

          try {
            if (user.subscriptions?.id && queryId !== userId) {
              const subscription = await prisma.subscription.findFirst({
                where: { userId: queryId },
                select: { stripeSubscriptionId: true },
              });

              if (subscription?.stripeSubscriptionId) {
                await stripe.subscriptions.cancel(
                  subscription.stripeSubscriptionId,
                  {
                    cancellation_details: {
                      comment: body.cancellation_details?.comment,
                      feedback: body.cancellation_details?.feedback,
                    },
                  }
                );
              }
            } else if (
              user.subscriptions?.id &&
              user.subscriptions.stripeSubscriptionId &&
              queryId === userId
            ) {
              await stripe.subscriptions.cancel(
                user.subscriptions.stripeSubscriptionId,
                {
                  cancellation_details: {
                    comment: body.cancellation_details?.comment,
                    feedback: body.cancellation_details?.feedback,
                  },
                }
              );
            } else if (
              user.parentSubscription?.id &&
              user.parentSubscription.stripeSubscriptionId &&
              user &&
              user.emailVerified
            ) {
              await updateSeats(
                user.parentSubscription.stripeSubscriptionId,
                user.parentSubscription.quantity - 1
              );
            }
          } catch (err) {
            console.log(err);
          }
        }

        // A Play Store subscription can be cancelled server-side (auto-renew is
        // turned off; it stays paid-up until the period ends). App Store
        // subscriptions have no cancellation API — the UI tells those users to
        // cancel through Apple instead.
        if (isGooglePlayConfigured()) {
          try {
            const subscription =
              queryId === userId
                ? user.subscriptions
                : await prisma.subscription.findFirst({
                    where: { userId: queryId },
                    select: { provider: true, googlePurchaseToken: true },
                  });

            if (
              subscription?.provider === "GOOGLE" &&
              subscription.googlePurchaseToken
            ) {
              await cancelGoogleSubscription(subscription.googlePurchaseToken);
            }
          } catch (err) {
            console.log(err);
          }
        }

        // Finally, delete the user
        await prisma.user.delete({
          where: { id: queryId },
        });
      },
      { timeout: 20000 }
    )
    .catch((err) => console.log(err));

  return {
    response: "User account and all related data deleted successfully.",
    status: 200,
  };
}
