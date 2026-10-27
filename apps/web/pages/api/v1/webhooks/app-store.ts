import type { NextApiRequest, NextApiResponse } from "next";
import { timingSafeEqual } from "crypto";
import { prisma } from "@linkwarden/prisma";
import getAppleSubscriptionState, {
  decodeJws,
  isAppStoreConfigured,
} from "@/lib/api/billing/appStore";
import { writeAppleSubscription } from "@/lib/api/billing/syncStoreSubscription";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isAuthorized = (req: NextApiRequest) => {
  const secret = process.env.APP_STORE_WEBHOOK_TOKEN;
  const token = req.query.token;

  if (!secret || typeof token !== "string") return false;

  const a = new TextEncoder().encode(token);
  const b = new TextEncoder().encode(secret);
  return a.length === b.length && timingSafeEqual(a, b);
};

type NotificationPayload = {
  notificationType?: string;
  data?: {
    signedTransactionInfo?: string;
  };
};

// App Store Server Notifications V2. The signed payload is only decoded (not
// signature-verified) to extract a transaction id — every field that grants an
// entitlement is re-fetched from the App Store Server API, so a forged request
// can at most trigger a lookup.
export default async function appStoreWebhook(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ response: "Method not allowed." });
  }

  if (process.env.NEXT_PUBLIC_DEMO === "true")
    return res.status(400).json({
      response:
        "This action is disabled because this is a read-only demo of Linkwarden.",
    });

  if (!isAppStoreConfigured() || !process.env.APP_STORE_WEBHOOK_TOKEN) {
    return res.status(400).json({
      response:
        "This action is disabled because App Store billing is not configured.",
    });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ response: "Invalid token." });
  }

  const payload = decodeJws<NotificationPayload>(req.body?.signedPayload);

  if (!payload?.notificationType) {
    return res.status(400).json({ response: "Invalid payload." });
  }

  const transactionInfo = decodeJws<{ originalTransactionId?: string }>(
    payload.data?.signedTransactionInfo
  );

  if (
    payload.notificationType === "TEST" ||
    !transactionInfo?.originalTransactionId
  ) {
    return res.status(200).json({ response: "Event ignored." });
  }

  try {
    const state = await getAppleSubscriptionState(
      transactionInfo.originalTransactionId
    );

    if (!state) {
      return res.status(200).json({ response: "Transaction not found." });
    }

    // Prefer the subscription row that already tracks this transaction (possession
    // established at purchase/restore time — also the only way deactivations reach
    // the right row); fall back to the appAccountToken stamped on the Apple-fetched
    // transaction for rows that haven't captured the transaction id yet.
    let userId: number | null = null;

    if (state.originalTransactionId) {
      const subscription = await prisma.subscription.findUnique({
        where: { storeOriginalTransactionId: state.originalTransactionId },
        select: { userId: true },
      });
      if (subscription) userId = subscription.userId;
    }

    if (
      !userId &&
      state.appAccountToken &&
      UUID_REGEX.test(state.appAccountToken)
    ) {
      const user = await prisma.user.findUnique({
        where: { uuid: state.appAccountToken },
        select: { id: true },
      });
      if (user) userId = user.id;
    }

    if (!userId) {
      console.warn(
        `App Store notification for unmapped transaction ${state.originalTransactionId}.`
      );
      return res.status(200).json({ response: "User not found." });
    }

    await writeAppleSubscription(userId, state);
  } catch (error) {
    console.error("Error handling App Store notification:", error);
    // Non-2xx makes Apple retry (1/12/24/48/72h) — desired for transient failures
    return res.status(500).send("Server Error");
  }

  return res.status(200).json({ response: "Done!" });
}
