import { supabase } from "@/lib/supabase";
import PreviewClient from "./PreviewClient";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: site, error } = await supabase
    .from("sites")
    .select("slug, business_name, config, photos, status")
    .eq("slug", slug)
    .single();

  if (error || !site) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50 font-sans text-sm">Site not found</p>
          <p className="text-white/25 font-sans text-xs mt-2">slug: {slug}</p>
        </div>
      </div>
    );
  }

  return <PreviewClient config={site.config} status={site.status} slug={slug} />;
}
