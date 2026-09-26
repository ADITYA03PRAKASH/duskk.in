import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

const SEED_CMS_SECTIONS = [
  {
    id: "cms_hero",
    key: "hero_main",
    title: "Demi-Fine Luxury & Modern Artisanal Jewellery",
    subtitle: "Handcrafted everyday elegance celebrating modern Indian muses and timeless craftsmanship.",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1600&q=85",
    link: "/shop",
    sortOrder: 1,
    active: true,
  },
  {
    id: "cms_story",
    key: "story_spotlight",
    title: "The Quiet Luxury Collection",
    subtitle: "Layered necklaces, anti-tarnish studs, and bespoke statement cuffs engineered for daily wear.",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=80",
    link: "/category/necklaces",
    sortOrder: 2,
    active: true,
  },
  {
    id: "cms_pearls",
    key: "pearl_craft",
    title: "Natural Baroque & Freshwater Pearls",
    subtitle: "Organic forms matched with radiant gold plating for effortless everyday poise.",
    image: "https://images.unsplash.com/photo-1611591475155-4286fa7c2e7f?auto=format&fit=crop&w=1200&q=80",
    link: "/category/earrings",
    sortOrder: 3,
    active: true,
  }
];

export async function GET() {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    try {
      const { data: banners, error } = await supabaseAdmin
        .from("banners")
        .select("*")
        .order("display_order", { ascending: true });

      if (!error && banners && banners.length > 0) {
        const formatted = banners.map((b) => ({
          id: b.id,
          key: b.banner_type,
          title: b.title,
          subtitle: b.subtitle,
          image: b.image_url_desktop,
          link: b.link_url,
          sortOrder: b.display_order,
          active: b.is_active,
          createdAt: b.created_at,
        }));

        return NextResponse.json({ success: true, data: formatted });
      }
    } catch (dbErr) {
      console.warn("Supabase fetch banners fallback:", dbErr);
    }

    return NextResponse.json({ success: true, data: SEED_CMS_SECTIONS });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: SEED_CMS_SECTIONS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { key, title, subtitle, image, link, sortOrder, active } = body;

    if (!title || !image) {
      return NextResponse.json({ success: false, message: "Title and image are required" }, { status: 400 });
    }

    const { data: banner, error } = await supabaseAdmin
      .from("banners")
      .insert({
        banner_type: key || "hero",
        title,
        subtitle: subtitle || null,
        image_url_desktop: image,
        link_url: link || null,
        display_order: sortOrder || 0,
        is_active: active !== false,
      })
      .select()
      .maybeSingle();

    if (error || !banner) {
      throw new Error(error?.message || "Failed to create banner in database");
    }

    try {
      revalidatePath("/", "page");
    } catch (revErr) {
      console.warn("Revalidation warning:", revErr);
    }

    return NextResponse.json({ success: true, data: banner });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
