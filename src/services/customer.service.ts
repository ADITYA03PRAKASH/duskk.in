import { supabaseAdmin } from "@/lib/supabase/admin";
import { CustomerCheckoutInput, ShippingAddressInput } from "@/types";

export async function findOrCreateCustomer(
  customerData: CustomerCheckoutInput,
  authUserId?: string | null
) {
  const email = customerData.email.trim().toLowerCase();
  const rawName = customerData.name.trim();
  const nameParts = rawName.split(" ");
  const firstName = nameParts[0] || rawName;
  const lastName = nameParts.slice(1).join(" ") || null;
  const phone = customerData.phone?.trim() || null;

  // 1. Look for existing Customer by email
  const { data: existingCustomers, error: findError } = await supabaseAdmin
    .from("customers")
    .select("*")
    .eq("email", email)
    .limit(1);

  if (findError) {
    console.error("Error finding customer:", findError);
  }

  if (existingCustomers && existingCustomers.length > 0) {
    const existing = existingCustomers[0];
    const updates: Record<string, any> = {};
    if (firstName && (!existing.first_name || existing.first_name === "")) updates.first_name = firstName;
    if (lastName && !existing.last_name) updates.last_name = lastName;
    if (phone && !existing.phone) updates.phone = phone;
    if (authUserId && !existing.auth_user_id) {
      updates.auth_user_id = authUserId;
      updates.customer_type = "registered";
    }

    if (Object.keys(updates).length > 0) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("customers")
        .update(updates)
        .eq("id", existing.id)
        .select()
        .single();

      if (!updateError && updated) return updated;
    }
    return existing;
  }

  // 2. Insert new Customer record
  const { data: newCustomer, error: insertError } = await supabaseAdmin
    .from("customers")
    .insert({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      auth_user_id: authUserId || null,
      customer_type: authUserId ? "registered" : "guest",
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create customer record: ${insertError.message}`);
  }

  return newCustomer;
}

export async function saveCustomerAddress(
  customerId: string,
  addressData: ShippingAddressInput
) {
  const addressLine1 = addressData.addressLine1.trim();
  const postalCode = addressData.pincode.trim();

  // Check if active matching address exists
  const { data: existing } = await supabaseAdmin
    .from("customer_addresses")
    .select("*")
    .eq("customer_id", customerId)
    .eq("address_line1", addressLine1)
    .eq("postal_code", postalCode)
    .eq("is_active", true)
    .limit(1);

  if (existing && existing.length > 0) {
    return existing[0];
  }

  const { data: newAddress, error } = await supabaseAdmin
    .from("customer_addresses")
    .insert({
      customer_id: customerId,
      full_name: addressData.addressLine1, // fallback
      phone: "",
      address_line1: addressLine1,
      address_line2: addressData.addressLine2?.trim() || null,
      city: addressData.city.trim(),
      state: addressData.state.trim(),
      postal_code: postalCode,
      landmark: addressData.landmark?.trim() || null,
      country: "India",
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.warn("Failed to save address:", error.message);
    return null;
  }

  return newAddress;
}

export async function linkCustomerToUser(email: string, authUserId: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabaseAdmin
    .from("customers")
    .update({
      auth_user_id: authUserId,
      customer_type: "registered",
    })
    .eq("email", normalizedEmail)
    .select();

  if (error) {
    console.error("Failed linking customer to user:", error);
    return null;
  }
  return data;
}
