import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DUSKK Privacy Policy | Your Privacy Matters",
  description:
    "Learn how DUSKK collects, uses, and safeguards your personal information, order details, and privacy when browsing or shopping on duskk.in.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 bg-[#FAF8F5] py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center space-y-3">
            <span className="text-xs uppercase font-mono tracking-[0.3em] text-duskk-gold font-semibold block">
              PRIVACY & DATA PROTECTION
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-duskk-900 font-light tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-duskk-500 font-mono">
              Last Updated: September 2026 &bull; DUSKK (duskk.in)
            </p>
          </div>

          {/* Content Body */}
          <div className="bg-white p-8 sm:p-14 border border-duskk-200 rounded-2xl shadow-sm space-y-10 text-xs sm:text-sm text-duskk-700 leading-relaxed">
            {/* 1. Introduction */}
            <section className="space-y-3">
              <h2 className="font-serif text-xl sm:text-2xl text-duskk-900 font-medium">
                1. Introduction
              </h2>
              <p>
                Welcome to <strong>DUSKK</strong> (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;), accessible at{" "}
                <strong>https://www.duskk.in</strong>. DUSKK is an Indian online shopping and gifting brand dedicated to helping you find thoughtful gifts and lifestyle products for the people and moments that matter most.
              </p>
              <p>
                We value your trust and are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you visit our website, interact with our customer support, or purchase products through our store.
              </p>
            </section>

            {/* 2. Information We Collect */}
            <section className="space-y-4">
              <h2 className="font-serif text-xl sm:text-2xl text-duskk-900 font-medium">
                2. Information We Collect
              </h2>
              <p>
                We collect only the information necessary to provide you with a smooth, secure, and personalized gifting and shopping experience.
              </p>

              <div className="space-y-3 pl-4 border-l-2 border-duskk-200">
                <div>
                  <h3 className="font-semibold text-duskk-900">A. Guest Checkout Information</h3>
                  <p className="text-duskk-600 mt-1">
                    DUSKK fully supports guest checkout. You are not required to create a password-protected account to place an order. When placing an order as a guest, we collect:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-duskk-600">
                    <li>Full Name</li>
                    <li>Email Address (for order confirmation, tracking updates, and invoices)</li>
                    <li>Phone Number (for courier dispatch and delivery coordination)</li>
                    <li>Shipping & Delivery Address (including city, state, and postal PIN code)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-duskk-900">B. Customer Account Information (Optional)</h3>
                  <p className="text-duskk-600 mt-1">
                    If you choose to create an account or sign in, we store your name, email address, encrypted authentication credentials, and historical order records associated with your email.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-duskk-900">C. Order and Transaction Details</h3>
                  <p className="text-duskk-600 mt-1">
                    We maintain records of items purchased, order totals, discount coupons applied, order status history, and shipment tracking numbers.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-duskk-900">D. Payment Information</h3>
                  <p className="text-duskk-600 mt-1">
                    Online payments on DUSKK are handled securely by authorized third-party payment service providers (such as Razorpay). <strong>DUSKK does not store, collect, or have access to your complete credit/debit card numbers, CVV, Net Banking passwords, or UPI PINs.</strong> All payment processing is conducted directly on the payment provider&apos;s encrypted, PCI-DSS compliant interface.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-duskk-900">E. Device and Website Usage Data</h3>
                  <p className="text-duskk-600 mt-1">
                    When you browse our website, our servers automatically record basic technical data such as your IP address, browser type, operating system, referring URL, pages visited, and timestamps to ensure website stability, prevent fraud, and optimize performance.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Cookies and Tracking */}
            <section className="space-y-3">
              <h2 className="font-serif text-xl sm:text-2xl text-duskk-900 font-medium">
                3. Cookies and Similar Technologies
              </h2>
              <p>
                DUSKK uses essential cookies and local storage to maintain your active shopping cart items, remember currency preferences, and preserve session security. You can adjust your browser settings to refuse cookies; however, certain shopping functionalities (such as adding products to the cart) may not function properly without essential cookies.
              </p>
            </section>

            {/* 4. How We Use Information */}
            <section className="space-y-3">
              <h2 className="font-serif text-xl sm:text-2xl text-duskk-900 font-medium">
                4. How We Use Your Information
              </h2>
              <p>We use the information we collect strictly for legitimate business purposes:</p>
              <ul className="list-disc list-inside space-y-1.5 text-duskk-600">
                <li>Processing, packing, and dispatching your orders.</li>
                <li>Communicating transactional updates (order confirmations, dispatch notices, and tracking numbers).</li>
                <li>Providing customer support regarding orders, product inquiries, delivery assistance, or returns.</li>
                <li>Detecting and preventing fraudulent transactions or security violations.</li>
                <li>Improving website layout, navigation, and product offerings.</li>
                <li>Sending optional promotional newsletters if you voluntarily subscribe (you may unsubscribe anytime).</li>
              </ul>
            </section>

            {/* 5. How We Share Information */}
            <section className="space-y-3">
              <h2 className="font-serif text-xl sm:text-2xl text-duskk-900 font-medium">
                5. Sharing of Information
              </h2>
              <p>
                <strong>We do not sell, rent, or trade your personal data to third parties.</strong> We share information only with trusted service providers who assist us in operating our store:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-duskk-600">
                <li><strong>Delivery Partners:</strong> Courier and logistics companies receive your recipient name, delivery address, and contact number solely to complete package delivery.</li>
                <li><strong>Payment Gateways:</strong> Secure payment processors receive transaction identifiers to authorize and verify payments.</li>
                <li><strong>Transactional Email Services:</strong> Automated email delivery systems (such as Brevo) are used to transmit order confirmations and tracking notifications.</li>
                <li><strong>Legal & Compliance:</strong> We may disclose information if required by applicable Indian law, court order, or governmental regulation to protect against fraud or enforce our legal rights.</li>
              </ul>
            </section>

            {/* 6. Data Security */}
            <section className="space-y-3">
              <h2 className="font-serif text-xl sm:text-2xl text-duskk-900 font-medium">
                6. Data Security
              </h2>
              <p>
                We employ industry-standard technical and organizational security measures, including 256-bit SSL/TLS encryption for all data in transit, encrypted storage, and restricted administrative access controls. While no digital platform can guarantee 100% security, we continually review and enhance our security safeguards.
              </p>
            </section>

            {/* 7. Data Retention */}
            <section className="space-y-3">
              <h2 className="font-serif text-xl sm:text-2xl text-duskk-900 font-medium">
                7. Data Retention
              </h2>
              <p>
                We retain order and transaction records for the period necessary to fulfill delivery, manage potential returns or warranty inquiries, and comply with applicable tax, accounting, and legal requirements under Indian law.
              </p>
            </section>

            {/* 8. Your Rights & Choices */}
            <section className="space-y-3">
              <h2 className="font-serif text-xl sm:text-2xl text-duskk-900 font-medium">
                8. Your Rights and Choices
              </h2>
              <p>
                You have the right to request access to the personal data we hold about you, request corrections to inaccurate details, or request deletion of your optional customer account. To exercise any of these choices, please contact our support team.
              </p>
            </section>

            {/* 9. Children's Privacy */}
            <section className="space-y-3">
              <h2 className="font-serif text-xl sm:text-2xl text-duskk-900 font-medium">
                9. Children&apos;s Privacy
              </h2>
              <p>
                DUSKK does not knowingly solicit or collect personal information from individuals under the age of 18 without parental or guardian consent. If you believe a minor has provided us with personal data, please contact us immediately.
              </p>
            </section>

            {/* 10. Updates to This Policy */}
            <section className="space-y-3">
              <h2 className="font-serif text-xl sm:text-2xl text-duskk-900 font-medium">
                10. Updates to This Policy
              </h2>
              <p>
                We may periodically update this Privacy Policy to reflect changes in our operational practices, technological enhancements, or legal obligations. The revised policy will be posted on this page with an updated revision date.
              </p>
            </section>

            {/* 11. Contact Information */}
            <section className="space-y-3 pt-6 border-t border-duskk-100">
              <h2 className="font-serif text-xl sm:text-2xl text-duskk-900 font-medium">
                11. Contact Us
              </h2>
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy or your personal information, please reach out to us:
              </p>
              <div className="bg-[#FAF8F5] p-5 rounded-xl border border-duskk-200 text-xs sm:text-sm space-y-1.5 text-duskk-800">
                <p><strong>Brand:</strong> DUSKK</p>
                <p><strong>Website:</strong> <a href="https://www.duskk.in" className="text-duskk-gold underline">https://www.duskk.in</a></p>
                <p><strong>Email:</strong> <a href="mailto:duskk.india@gmail.com" className="text-duskk-900 underline font-mono">duskk.india@gmail.com</a></p>
                <p><strong>Helpline:</strong> <a href="tel:+917503462516" className="text-duskk-900 font-mono underline">+91 75034 62516</a></p>
                <p><strong>Business Address:</strong> Plot No. 152-153, Sidhatri Enclave, Bhagwati Garden, Uttam Nagar, New Delhi – 110059, India</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
