export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_review: "In Review",
  contacted: "Contacted",
  approved: "Approved",
  rejected: "Rejected",
  resolved: "Resolved",
};

export const TYPE_LABELS: Record<string, string> = {
  upgrade: "Upgrade",
  contact_sales: "Contact Sales",
  sales: "Sales",
  support: "Support",
  custom_plan: "Custom Plan",
  billing: "Billing",
  consultation: "Consultation",
};

export const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  business: "Business",
  custom: "Custom",
};

export const NOTE_VISIBILITY_LABELS: Record<string, string> = {
  internal: "Internal Note",
  public: "Public Message",
};

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status.toLowerCase()] || status;
}

export function getTypeLabel(type: string): string {
  return TYPE_LABELS[type.toLowerCase()] || type;
}

export function getPlanLabel(plan: string): string {
  return PLAN_LABELS[plan.toLowerCase()] || plan;
}

export function getVisibilityLabel(visibility: string): string {
  return NOTE_VISIBILITY_LABELS[visibility.toLowerCase()] || visibility;
}
