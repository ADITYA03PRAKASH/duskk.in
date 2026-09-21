import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { Scale, FileText, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Terms of Service | DUSKK",
  description: "Read the Terms and Conditions governing your use of the DUSKK website and purchase of products.",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#FAF8F5] py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs uppercase font-mono tracking-[0.25em] text-duskk-gold block mb-2">
              TERMS & CONDITIONS
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-duskk-900 font-normal">
              Terms of Service
            </h1>
            <p className="text-xs sm:text-sm text-duskk-600 mt-2">
              Last Updated: September 2026 &bull; Applicable across duskk.in and related services
            </p>
          </div>

          {/* Detailed Terms Container */}
          <div className="bg-white p-8 sm:p-12 border border-duskk-200 rounded-lg shadow-sm space-y-8 text-xs sm:text-sm text-duskk-700 leading-relaxed">
            
            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                1. Overview & Acceptance of Terms
              </h2>
              <p>
                Welcome to <strong>DUSKK</strong> (accessible at <Link href="/" className="text-duskk-gold underline">https://www.duskk.in</Link>), operated by DUSKK (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). We operate an online shopping and gifting e-commerce platform offering thoughtfully curated lifestyle gifts and merchandise to consumers across India.
              </p>
              <p>
                By accessing, browsing, or purchasing products from this website, you acknowledge that you have read, understood, and agree to be legally bound by these Terms of Service, along with our <Link href="/privacy-policy" className="text-duskk-gold underline">Privacy Policy</Link>, <Link href="/shipping-policy" className="text-duskk-gold underline">Shipping Policy</Link>, and <Link href="/return-policy" className="text-duskk-gold underline">Return Policy</Link>. If you do not agree with any part of these terms, please do not use our website.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                2. Eligibility & Website Usage
              </h2>
              <p>
                To place an order on DUSKK, you must be at least 18 years of age and legally competent to enter into binding contracts under the Indian Contract Act, 1872. If you are under 18, you may use our platform only under the direct supervision and consent of a parent or legal guardian.
              </p>
              <p>
                You agree not to use our website or services for any unlawful purpose, violate intellectual property laws, attempt unauthorized access to our systems, or transmit malicious software.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                3. Products, Imagery & Pricing
              </h2>
              <p>
                &bull; <strong>Product Descriptions:</strong> We strive to display product colors, dimensions, specifications, and imagery as accurately as possible. However, actual colors may slightly differ depending on your screen display settings.
              </p>
              <p>
                &bull; <strong>Pricing & Taxes:</strong> All prices displayed on our website are stated in Indian Rupees (INR) and are inclusive of Goods and Services Tax (GST). Delivery charges, if applicable for orders below the free shipping threshold, are clearly itemized at checkout before payment.
              </p>
              <p>
                &bull; <strong>Availability & Changes:</strong> All products are subject to stock availability. We reserve the right to modify prices, discontinue products, or limit order quantities without prior notice.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                4. Ordering & Guest Checkout
              </h2>
              <p>
                &bull; <strong>Guest Checkout:</strong> DUSKK supports streamlined guest checkout. You are not required to create a user account or password to make a purchase. You are responsible for ensuring that all contact details (name, delivery address, pincode, phone number, and email) entered during checkout are complete and accurate.
              </p>
              <p>
                &bull; <strong>Order Acceptance:</strong> Receipt of an electronic order confirmation does not constitute our final acceptance of an order. We reserve the right to refuse or cancel any order for reasons including, but not limited to, suspected fraudulent transactions, pricing inaccuracies, or product unavailability. In such instances, any charged amount will be fully refunded to your original payment method.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                5. Payments & Transaction Security
              </h2>
              <p>
                All online payments on DUSKK are authenticated and processed in real-time through authorized, RBI-regulated third-party payment gateways (such as Razorpay). We accept major credit/debit cards, UPI, net banking, and supported digital wallets.
              </p>
              <p>
                DUSKK does not collect or store raw credit/debit card numbers, CVV codes, or banking credentials. We are not liable for payment delays or transaction failures arising from banking network interruptions or customer bank rejections.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                6. Shipping, Title & Risk of Loss
              </h2>
              <p>
                Deliveries are handled by trusted third-party logistics and courier aggregators across India. The risk of loss and title for items purchased from DUSKK pass to you upon delivery of the items to the designated recipient address.
              </p>
              <p>
                Estimated delivery timelines are guidelines and not guaranteed contract terms. Please review our <Link href="/shipping-policy" className="text-duskk-gold underline font-medium">Shipping Policy</Link> for full details on dispatch schedules and tracking procedures.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                7. Cancellations, Returns & Refunds
              </h2>
              <p>
                Purchases made on DUSKK are subject to our comprehensive <Link href="/return-policy" className="text-duskk-gold underline font-medium">Return Policy</Link>. Return requests must be initiated within <strong>[RETURN WINDOW]</strong> (e.g. 7 days) of confirmed delivery. Personalized or hygiene-sensitive items may be non-returnable unless received in a damaged or defective condition.
              </p>
              <p>
                Approved refunds are credited back to the original source payment method within <strong>[REFUND PROCESSING TIME]</strong> (5 to 7 business days).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                8. Intellectual Property Rights
              </h2>
              <p>
                All content published on this website, including but not limited to brand logos, visual marks, product designs, photographs, graphics, text copy, code, and compilations, is the exclusive proprietary property of DUSKK and is protected under Indian and international copyright, trademark, and intellectual property laws.
              </p>
              <p>
                No material from this site may be copied, reproduced, modified, distributed, or republished without prior express written permission from DUSKK.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                9. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by applicable Indian law, DUSKK, its founders, directors, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use our website, services, or products.
              </p>
              <p>
                In no event shall our total aggregate liability to you for all claims arising out of an order exceed the actual amount paid by you for the specific product in dispute.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                10. Governing Law & Dispute Jurisdiction
              </h2>
              <p>
                These Terms of Service and any separate agreements whereby we provide you services shall be governed by and construed in accordance with the laws of the Republic of India.
              </p>
              <p>
                Any disputes, controversies, or claims arising out of or in connection with these Terms or your use of the website shall be subject to the exclusive jurisdiction of the competent courts situated in New Delhi, India.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                11. Changes to Terms of Service
              </h2>
              <p>
                We reserve the right to update, amend, or replace any part of these Terms of Service by posting revisions directly to this page. Your continued use of or access to the website following the posting of any updates constitutes acceptance of those changes.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-duskk-900">
                12. Contact & Grievance Redressal
              </h2>
              <p>
                For questions regarding these Terms of Service or to address any inquiries, notices, or grievances, please contact our designated team:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-duskk-800">
                <li><strong>Brand:</strong> DUSKK</li>
                <li><strong>Website:</strong> <a href="https://www.duskk.in" className="text-duskk-gold underline">https://www.duskk.in</a></li>
                <li><strong>Email:</strong> <a href="mailto:duskk.india@gmail.com" className="underline font-mono text-duskk-900">duskk.india@gmail.com</a></li>
                <li><strong>Helpline:</strong> <a href="tel:+917503462516" className="underline font-mono text-duskk-900">+91 75034 62516</a></li>
                <li><strong>Business Address:</strong> Plot No. 152-153, Sidhatri Enclave, Bhagwati Garden, Uttam Nagar, New Delhi – 110059, India</li>
              </ul>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
