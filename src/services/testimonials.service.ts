import { supabaseAdmin } from "@/lib/supabase/admin";

export interface Testimonial {
  id: string;
  customer_name: string;
  review_text: string;
  rating: number;
  location?: string | null;
  is_verified_buyer: boolean;
  source_type: string;
  source_url?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerExperiencesSectionSettings {
  eyebrow: string;
  heading: string;
  description?: string;
}

export const DEFAULT_SECTION_SETTINGS: CustomerExperiencesSectionSettings = {
  eyebrow: "CUSTOMER EXPERIENCES",
  heading: "Loved By Modern Muses",
  description: "",
};

export async function getPublicTestimonials(): Promise<Testimonial[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("testimonials")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.warn("Supabase fetch testimonials warning:", error?.message);
      return [];
    }

    return data as Testimonial[];
  } catch (err: any) {
    console.error("getPublicTestimonials exception:", err?.message || err);
    return [];
  }
}

export async function getTestimonialSectionSettings(): Promise<CustomerExperiencesSectionSettings> {
  try {
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "customer_experiences_section")
      .maybeSingle();

    if (!error && data?.value) {
      const val = data.value as any;
      return {
        eyebrow: typeof val.eyebrow === "string" && val.eyebrow.trim() ? val.eyebrow.trim() : DEFAULT_SECTION_SETTINGS.eyebrow,
        heading: typeof val.heading === "string" && val.heading.trim() ? val.heading.trim() : DEFAULT_SECTION_SETTINGS.heading,
        description: typeof val.description === "string" ? val.description : DEFAULT_SECTION_SETTINGS.description,
      };
    }
  } catch (err: any) {
    console.warn("getTestimonialSectionSettings error:", err?.message || err);
  }
  return DEFAULT_SECTION_SETTINGS;
}
