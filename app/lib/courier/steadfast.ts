import { CourierProvider, OrderData, ShipmentResult, TrackingResult, Address, RateResult } from "./types";

export class SteadfastProvider implements CourierProvider {
  name = "steadfast";

  async createShipment(order: OrderData): Promise<ShipmentResult> {
    return {
      success: true,
      trackingId: `SF-${Math.random().toString(36).substring(7).toUpperCase()}`,
      status: "pending",
    };
  }

  async trackShipment(trackingId: string): Promise<TrackingResult> {
    return {
      trackingId,
      status: "delivered",
      updatedAt: new Date(),
    };
  }

  async cancelShipment(trackingId: string): Promise<boolean> {
    return true;
  }

  async calculateRate(from: Address, to: Address, weight: number): Promise<RateResult> {
    return { amount: 70 };
  }
}
