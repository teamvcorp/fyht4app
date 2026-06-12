import Stripe from "stripe";
import { ObjectId } from "mongodb";
import { usersCollection } from "@/lib/db";
import type { SubscriptionStatus } from "@/lib/types";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
    stripe = new Stripe(key);
  }
  return stripe;
}

/** Map a Stripe subscription status to our internal status. */
export function mapSubscriptionStatus(status: string): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    default:
      return "none";
  }
}

export async function setSubscriptionByCustomer(
  stripeCustomerId: string,
  status: SubscriptionStatus
): Promise<void> {
  const users = await usersCollection();
  await users.updateOne(
    { stripeCustomerId },
    { $set: { subscriptionStatus: status } }
  );
}

export async function setSubscriptionByUserId(
  userId: string,
  status: SubscriptionStatus,
  stripeCustomerId?: string
): Promise<void> {
  const users = await usersCollection();
  const update: Record<string, unknown> = { subscriptionStatus: status };
  if (stripeCustomerId) update.stripeCustomerId = stripeCustomerId;
  await users.updateOne({ _id: new ObjectId(userId) }, { $set: update });
}
