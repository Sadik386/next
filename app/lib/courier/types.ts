export interface OrderData {
  orderId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  city: string;
  area?: string;
  amountToCollect: number;
  weight: number;
  items: string;
}

export interface Address {
  city: string;
  area: string;
  address: string;
}

export interface ShipmentResult {
  success: boolean;
  trackingId: string;
  status: string;
  message?: string;
}

export interface TrackingResult {
  trackingId: string;
  status: string; // dispatched, in_transit, delivered, returned
  updatedAt: Date;
}

export interface RateResult {
  amount: number;
  deliveryTime?: string;
}

export interface CourierProvider {
  name: string;
  createShipment(order: OrderData): Promise<ShipmentResult>;
  trackShipment(trackingId: string): Promise<TrackingResult>;
  cancelShipment(trackingId: string): Promise<boolean>;
  calculateRate(from: Address, to: Address, weight: number): Promise<RateResult>;
}
