export const BUSINESS_MEMBER_STATUS = {
  ACTIVE: "active",
} as const;

export const LEGACY_BUSINESS_MEMBER_STATUS = {
  ACTIVE: "ACTIVE",
} as const;

export const ACTIVE_BUSINESS_MEMBER_STATUSES = [
  BUSINESS_MEMBER_STATUS.ACTIVE,
  LEGACY_BUSINESS_MEMBER_STATUS.ACTIVE,
];

export function activeBusinessMemberStatusWhere() {
  return { in: ACTIVE_BUSINESS_MEMBER_STATUSES };
}
