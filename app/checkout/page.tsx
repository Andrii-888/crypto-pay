// app/checkout/page.tsx

import CheckoutClient from "@/components/checkout/CheckoutClient";

type CheckoutPageProps = {
  searchParams: Promise<{
    amount?: string | string[];
  }>;
};

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  // searchParams — это Promise, нужно распаковать
  const resolved = await searchParams;

  const rawValue = resolved.amount;
  const raw = Array.isArray(rawValue) ? rawValue[0] : rawValue ?? "0";

  const parsed = Number(raw);
  const amount = !Number.isFinite(parsed) || parsed < 0 ? 0 : parsed;

  return <CheckoutClient initialAmount={amount} />;
}
