import CheckoutClient from "@/components/checkout/CheckoutClient";

type CheckoutPageProps = {
  searchParams: Promise<{ amount?: string | string[] }>;
};

export default async function CheckoutPage(props: CheckoutPageProps) {
  const sp = await props.searchParams;

  const raw = sp?.amount;
  const rawStr = Array.isArray(raw) ? raw[0] : raw;
  const parsed = rawStr ? Number(rawStr) : 0;

  const amount = !Number.isFinite(parsed) || parsed < 0 ? 0 : parsed;

  return <CheckoutClient initialAmount={amount} />;
}
