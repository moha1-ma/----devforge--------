import { maskStripeId, requireStripeSandboxKey, stripeFormBody } from "./stripe-sandbox-utils.mjs";

const secretKey = requireStripeSandboxKey(process.env.STRIPE_SECRET_KEY);
const apiUrl = "https://api.stripe.com/v1";

async function stripeRequest(path, body) {
  const response = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": `devforge-demo-${path.replaceAll("/", "-")}-v1`,
    },
    body: stripeFormBody(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || `Stripe request failed with ${response.status}`);
  return payload;
}

async function run() {
  console.log("Starting DevForge Stripe sandbox demo. Live-mode keys are rejected by design.");

  const customer = await stripeRequest("/customers", {
    name: "DevForge Sandbox Customer",
    email: "sandbox.customer@example.test",
    "metadata[workspace]": "devforge",
    "metadata[purpose]": "api-demo",
  });

  const paymentIntent = await stripeRequest("/payment_intents", {
    amount: 1099,
    currency: "usd",
    customer: customer.id,
    "automatic_payment_methods[enabled]": true,
    "metadata[workspace]": "devforge",
    "metadata[scenario]": "payment-intent-create-only",
    description: "DevForge Stripe sandbox API demonstration",
  });

  console.log(JSON.stringify({
    mode: paymentIntent.livemode ? "live" : "sandbox",
    customer: maskStripeId(customer.id),
    paymentIntent: maskStripeId(paymentIntent.id),
    status: paymentIntent.status,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    nextStep: "Inspect the PaymentIntent in Stripe Dashboard. This demo intentionally does not confirm a payment method.",
  }, null, 2));
}

run().catch(error => {
  console.error(`Sandbox demo stopped: ${error.message}`);
  process.exitCode = 1;
});
