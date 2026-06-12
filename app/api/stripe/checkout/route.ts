import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { getStripe } from "@/lib/stripe";
import { usersCollection } from "@/lib/db";

export async function POST() {
  const user = await getCurrentUser();
  if (!user?._id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const priceId = process.env.STRIPE_MEMBERSHIP_PRICE_ID;
  if (!priceId) {
    return NextResponse.json(
      { error: "Membership is not configured yet." },
      { status: 500 }
    );
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const stripe = getStripe();

  // Ensure the user has a Stripe customer.
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user._id.toString() },
    });
    customerId = customer.id;
    const users = await usersCollection();
    await users.updateOne(
      { _id: user._id },
      { $set: { stripeCustomerId: customerId } }
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/?upgraded=1`,
    cancel_url: `${base}/membership?canceled=1`,
    metadata: { userId: user._id.toString() },
  });

  return NextResponse.json({ url: session.url });
}
