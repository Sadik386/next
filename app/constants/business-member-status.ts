export const BUSINESS_MEMBER_STATUS = {
  ACTIVE: "active",
  PENDING: "pending",
} as const;

export const LEGACY_BUSINESS_MEMBER_STATUS = {
  ACTIVE: "ACTIVE",
} as const;

export const ACTIVE_BUSINESS_MEMBER_STATUSES = [
  BUSINESS_MEMBER_STATUS.ACTIVE,
  LEGACY_BUSINESS_MEMBER_STATUS.ACTIVE,
];

export const ALL_BUSINESS_MEMBER_STATUSES = [
  ...ACTIVE_BUSINESS_MEMBER_STATUSES,
  BUSINESS_MEMBER_STATUS.PENDING,
];

export function activeBusinessMemberStatusWhere() {
  return { in: ACTIVE_BUSINESS_MEMBER_STATUSES };
}

export function pendingBusinessMemberStatusWhere() {
  return { in: [BUSINESS_MEMBER_STATUS.PENDING] };
}
