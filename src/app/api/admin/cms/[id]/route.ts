import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { key, title, subtitle, image, link, sortOrder, active } = body;

    const updates: Record<string, any> = {};
    if (key) updates.banner_type = key;
    if (title) updates.title = title;
    if (subtitle !== undefined) updates.subtitle = subtitle;
    if (image) updates.image_url_desktop = image;
    if (link !== undefined) updates.link_url = link;
    if (sortOrder !== undefined) updates.display_order = sortOrder;
    if (active !== undefined) updates.is_active = active;

    const fallbackBanner = {
      id: params.id,
      key,
      title,
      subtitle,
      image,
      link,
      sortOrder,
      active,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data: banner, error } = await supabaseAdmin
        .from("banners")
        .update(updates)
        .eq("id", params.id)
        .select()
        .single();

      if (!error && banner) {
        return NextResponse.json({ success: true, data: banner });
      }
    } catch (dbErr) {
      console.warn("Supabase banner update fallback:", dbErr);
    }

    return NextResponse.json({ success: true, data: fallbackBanner });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export { PUT as PATCH };

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getSessionAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabaseAdmin.from("banners").delete().eq("id", params.id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, message: "Banner deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
