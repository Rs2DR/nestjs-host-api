import Stripe from 'stripe';

export interface StripeModuleOptions {
  apiKey: string;
  webhookSecret: string;
  apiVersion?: Stripe.LatestApiVersion;
}
