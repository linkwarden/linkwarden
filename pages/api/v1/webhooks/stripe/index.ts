// TODO - Stripe webhooks for user cancellation...

// import { NextApiRequest, NextApiResponse } from "next";
// import Stripe from "stripe";
// import { buffer } from "micro";
// import { prisma } from "@/lib/api/db";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
//   apiVersion: "2022-11-15",
// });

// const endpointSecret =
//   "whsec_7c144bcd924041257e3d83eac1e2fba9c8a938b240fd8adb1c902f079e0cdee0";

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   if (req.method === "POST") {
//     const buf = await buffer(req);
//     const sig = req.headers["stripe-signature"];

//     let event: Stripe.Event;

//     try {
//       if (!sig) throw new Error("Stripe Signature is not defined.");
//       event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
//     } catch (err) {
//       console.log(err);
//       return res.status(400).send({ response: "Error..." });
//     }

//     // Handle the event
//     switch (event.type) {
//       case "customer.subscription.deleted":
//         const customerSubscriptionDeleted = event.data.object as any;

//         // Revoke all the token under the customers email...

//         const customer = (await stripe.customers.retrieve(
//           customerSubscriptionDeleted.customer
//         )) as any;

//         if (customer?.email) {
//           // Revoke tokens inside the database
//         }

//         break;
//       // ... handle other event types
//       default:
//         console.log(`Unhandled event type ${event.type}`);
//     }

//     return res.status(200).send({ response: "Done!" });
//   }
// }
