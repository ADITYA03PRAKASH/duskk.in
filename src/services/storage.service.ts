import { supabaseAdmin } from "@/lib/supabase/admin";

export async function uploadFileToStorage(
  bucket: "product-images" | "banners" | "review-images",
  path: string,
  fileBuffer: Buffer,
  contentType: string
) {
  // Ensure bucket exists
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const bucketExists = (buckets || []).some((b) => b.name === bucket);
  if (!bucketExists) {
    await supabaseAdmin.storage.createBucket(bucket, { public: true });
  }

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);

  return {
    path: data.path,
    publicUrl: publicUrlData.publicUrl,
  };
}
