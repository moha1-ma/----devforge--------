# Stripe sandbox and API reference

## Safe testing model

Stripe sandboxes isolate test API activity from live payments. Sandbox API keys create simulated objects and do not move real money; test and live objects are separate. Store keys in managed secrets, never in source code. [1]

## Recommended payment flows

Stripe recommends Checkout Sessions for most integrations because it reduces custom checkout code and can provide tax, discounts, shipping, subscriptions, and payment UI choices. Payment Intents remain appropriate when the application needs direct control over the payment lifecycle, including creation, confirmation, and additional authentication states. [2] [3]

## Payment Intent test notes

A PaymentIntent represents one payment attempt or customer session. Use an idempotency key when creating it to avoid duplicate intents, reuse an existing intent when a checkout resumes, and only return the client secret to the intended client over TLS. Do not put sensitive values in metadata or descriptions. [2]

## Webhook test notes

Webhook endpoints receive Stripe event payloads over HTTPS and should verify signatures using the raw body plus the Stripe-Signature header. A handler should return a successful 2xx response promptly and move longer work out of the response path. Stripe CLI can forward test events to a local endpoint and trigger events such as `payment_intent.succeeded`. [4]

## Capability matrix for the DevForge demo

| Capability | Demonstration objective | Execution status |
|---|---|---|
| Customers | Create or retrieve a sandbox customer | Requires sandbox key |
| Payment Intents | Create and inspect a simulated payment lifecycle | Requires sandbox key |
| Checkout Sessions | Create a hosted or embedded sandbox checkout flow | Requires sandbox key |
| Refunds | Demonstrate a simulated refund after a completed test payment | Requires sandbox key and test object |
| Webhooks | Verify a signed event and report the event type | Requires webhook signing secret |
| Billing | Model products, prices, subscriptions, and invoices | Requires sandbox key |

## References

[1]: https://docs.stripe.com/testing-use-cases
[2]: https://docs.stripe.com/payments/payment-intents
[3]: https://docs.stripe.com/payments/checkout-sessions
[4]: https://docs.stripe.com/webhooks
