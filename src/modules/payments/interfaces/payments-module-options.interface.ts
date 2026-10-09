import Stripe from 'stripe';

export interface PaymentsModuleOptions {
  apiKey: string;
  webhookSecret: string;
  apiVersion?: Stripe.LatestApiVersion;
}
