import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { getStripe } from "@/lib/stripe";
import { getPrinciple } from "@/lib/coach/principles";

const BOOK_FEE_CENTS = 2500;

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

  const { tier } = await req.json();
  const principle = await getPrinciple(Number(tier));
  const bookTitle = principle?.book?.title || `Tier ${tier} book`;
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
          unit_amount: BOOK_FEE_CENTS,
          product_data: { name: `FYHT4 Book — ${bookTitle}` },
        },
      },
    ],
    success_url: `${base}/journey?book=${tier}`,
    cancel_url: `${base}/journey`,
    metadata: {
      type: "book",
      userId: user._id.toString(),
      tier: String(tier),
    },
  });

  return NextResponse.json({ url: session.url });
}
