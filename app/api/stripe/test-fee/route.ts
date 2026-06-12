import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { getStripe } from "@/lib/stripe";
import { BELT_TEST_FEE_CENTS } from "@/lib/taekwondo";

export async function POST(req: Request) {
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

  const { tier, beltIndex } = await req.json();
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: BELT_TEST_FEE_CENTS,
          product_data: {
            name: `Belt test — Tier ${tier}, belt ${Number(beltIndex) + 1}`,
          },
        },
      },
    ],
    success_url: `${base}/train/${tier}?paid=1`,
    cancel_url: `${base}/train/${tier}`,
    metadata: {
      type: "belt_test",
      userId: user._id.toString(),
      tier: String(tier),
      beltIndex: String(beltIndex),
    },
  });

  return NextResponse.json({ url: session.url });
}
