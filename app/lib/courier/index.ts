import { PathaoProvider } from "./pathao";
import { RedxProvider } from "./redx";
import { SteadfastProvider } from "./steadfast";
import { CourierProvider } from "./types";

export function getCourierProvider(name: string): CourierProvider {
  switch (name.toLowerCase()) {
    case "pathao":
      return new PathaoProvider();
    case "steadfast":
      return new SteadfastProvider();
    case "redx":
      return new RedxProvider();
    default:
      throw new Error(`Unsupported courier provider: ${name}`);
  }
}
