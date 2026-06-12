import type Stripe from "stripe";
import { ObjectId } from "mongodb";
import {
  getStripe,
  mapSubscriptionStatus,
  setSubscriptionByCustomer,
  setSubscriptionByUserId,
} from "@/lib/stripe";
import { usersCollection } from "@/lib/db";
import { beltKey } from "@/lib/taekwondo";

async function markBeltTestPaid(
  userId: string,
  tier: number,
  beltIndex: number
): Promise<void> {
  const users = await usersCollection();
  const k = beltKey(tier, beltIndex);
  await users.updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        [`taekwondo.beltTests.${k}.paidAt`]: new Date().toISOString(),
        [`taekwondo.beltTests.${k}.status`]: "paid",
      },
    }
  );
}

// Stripe requires the raw request body to verify the signature.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Webhook not configured", { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid";
    return new Response(`Webhook signature error: ${message}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const md = session.metadata ?? {};

      // One-time $20 belt-test fee.
      if (md.type === "belt_test" && md.userId) {
        await markBeltTestPaid(md.userId, Number(md.tier), Number(md.beltIndex));
        break;
      }

      // One-time $25 book purchase.
      if (md.type === "book" && md.userId) {
        const users = await usersCollection();
        await users.updateOne(
          { _id: new ObjectId(md.userId) },
          { $addToSet: { booksOwned: Number(md.tier) } }
        );
        break;
      }

      // Membership subscription.
      const userId = md.userId;
      const customerId =
        typeof session.customer === "string" ? session.customer : undefined;
      if (userId) {
        await setSubscriptionByUserId(userId, "active", customerId);
      } else if (customerId) {
        await setSubscriptionByCustomer(customerId, "active");
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;
      await setSubscriptionByCustomer(
        customerId,
        mapSubscriptionStatus(subscription.status)
      );
      break;
    }
    default:
      break;
  }

  return new Response("ok", { status: 200 });
}
