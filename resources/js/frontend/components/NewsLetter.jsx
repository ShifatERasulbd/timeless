import { useState } from "react";

/**
 * NewsletterSignup
 * Matches the "TIMELESS" watermark newsletter block:
 * - Tiled faint "TIMELESS" wordmark background
 * - Centered serif heading
 * - Email input + solid orange submit button
 *
 * Usage:
 *   <NewsletterSignup onSubmit={(email) => console.log(email)} />
 */
export default function NewsletterSignup({ onSubmit }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("submitting");
    try {
      if (onSubmit) {
        await onSubmit(email);
      }
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
    }
  };

  // Repeat the watermark word enough times to tile across any width
  const watermarkRow = Array.from({ length: 8 }, () => "TIMELESS").join("   ");
  const watermarkRows = Array.from({ length: 5 });

  return (
    <section className="relative overflow-hidden bg-white py-16 px-6">
      {/* Watermark background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex flex-col justify-between py-4 select-none"
      >
        {watermarkRows.map((_, i) => (
          <div
            key={i}
            className="whitespace-nowrap text-[72px] md:text-[88px] font-serif font-normal tracking-wide text-neutral-200/70"
            style={{
              transform: i % 2 === 1 ? "translateX(-40px)" : undefined,
            }}
          >
            {watermarkRow}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-xl text-center">
        <h2 className="font-serif text-2xl md:text-[28px] tracking-wide text-neutral-900 mb-8">
          SIGN UP FOR OUR NEWSLETTER
        </h2>

        <form onSubmit={handleSubmit} className="mx-auto max-w-md">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your e-mail address"
            aria-label="Email address"
            className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          />

          <button
            type="submit"
            disabled={status === "submitting"}
            className="mt-3 w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-semibold tracking-widest py-3.5 transition-colors"
          >
            {status === "submitting" ? "SIGNING UP..." : "SIGN UP"}
          </button>

          {status === "success" && (
            <p className="mt-3 text-sm text-green-600">
              Thanks for subscribing!
            </p>
          )}
          {status === "error" && (
            <p className="mt-3 text-sm text-red-600">
              Something went wrong. Please try again.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
