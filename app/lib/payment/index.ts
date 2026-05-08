import { BkashProvider } from "./bkash";
import { NagadProvider } from "./nagad";
import { StripeProvider } from "./stripe";
import { PaymentProvider } from "./types";

export function getPaymentProvider(name: string): PaymentProvider {
  switch (name.toLowerCase()) {
    case "bkash":
      return new BkashProvider();
    case "nagad":
      return new NagadProvider();
    case "stripe":
      return new StripeProvider();
    default:
      throw new Error(`Unsupported payment provider: ${name}`);
  }
}
