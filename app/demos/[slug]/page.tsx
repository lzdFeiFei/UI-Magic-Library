import { notFound } from "next/navigation";
import { getDemo } from "@/lib/demo-registry";
import { demos } from "@/lib/demo-registry";
import ClientDemoShell from "./ClientDemoShell";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;
export const dynamic = "force-static";

export function generateStaticParams() {
  return demos.map((demo) => ({ slug: demo.slug }));
}

export default async function DemoPage({ params }: PageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const demo = getDemo(decodedSlug);

  if (!demo) {
    notFound();
  }

  return <ClientDemoShell demo={demo} />;
}
