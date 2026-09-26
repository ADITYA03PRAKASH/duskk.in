export interface RazorpayCheckoutOptions {
  key?: string;
  orderId: string;
  amount: number; // in paise or INR depending on context, standard is paise in Razorpay options
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  notes?: Record<string, string>;
  themeColor?: string;
  onSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => Promise<void> | void;
  onDismiss?: () => void;
  onFailure?: (error: any) => void;
}

/**
 * Loads the Razorpay Standard Checkout script asynchronously if not already loaded.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Launches the official Razorpay Standard Web Checkout popup modal.
 */
export async function openRazorpayModal(options: RazorpayCheckoutOptions): Promise<void> {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !(window as any).Razorpay) {
    throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
  }

  const razorpayKey = options.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!razorpayKey) {
    throw new Error("Razorpay Key ID is not configured. Please provide a valid Key ID.");
  }

  // Amount for Razorpay checkout options must be in paise (subunits)
  // If amount passed is already in paise (i.e. integer amount * 100), ensure it's an integer
  const amountInPaise = Math.round(options.amount);

  const rzpOptions: any = {
    key: razorpayKey,
    amount: amountInPaise,
    currency: options.currency || "INR",
    name: options.name || "DUSKK",
    description: options.description || "Secure Payment",
    image: options.image || "/icon.png",
    order_id: options.orderId,
    prefill: {
      name: options.customer?.name || "",
      email: options.customer?.email || "",
      contact: options.customer?.phone || "",
    },
    notes: options.notes || {},
    theme: {
      color: options.themeColor || "#0F0F0F",
    },
    handler: function (response: any) {
      if (options.onSuccess) {
        options.onSuccess({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        });
      }
    },
    modal: {
      ondismiss: function () {
        if (options.onDismiss) {
          options.onDismiss();
        }
      },
      escape: true,
      backdropclose: false,
    },
  };

  const razorpayInstance = new (window as any).Razorpay(rzpOptions);

  razorpayInstance.on("payment.failed", function (response: any) {
    if (options.onFailure) {
      options.onFailure(response.error);
    }
  });

  razorpayInstance.open();
}
