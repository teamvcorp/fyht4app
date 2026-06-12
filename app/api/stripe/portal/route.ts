import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  const user = await getCurrentUser();
  if (!user?._id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Payments aren't configured yet." },
      { status: 500 }
    );
  }
  if (!user.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account yet." },
      { status: 400 }
    );
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${base}/account`,
  });
  return NextResponse.json({ url: session.url });
}
