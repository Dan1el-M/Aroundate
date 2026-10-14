import { notFound } from "next/navigation";
import { policies } from "../../lib/policies";
import { Policy } from "../../components/policy";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!policies[slug]) notFound();
  return <Policy slug={slug} />;
}
