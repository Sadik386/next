export const PUBLIC_LINKS = {
  main: "https://acuitycommerce.com",
  www: "https://www.acuitycommerce.com",
  app: "https://app.acuitycommerce.com",
  docs: "https://docs.acuitycommerce.com",
  support: "https://support.acuitycommerce.com",
  status: "https://status.acuitycommerce.com",
  legal: {
    terms: "https://acuitycommerce.com/terms",
    privacy: "https://acuitycommerce.com/privacy",
    dataPolicy: "https://acuitycommerce.com/data-policy",
    refundPolicy: "https://acuitycommerce.com/refund-policy",
    security: "https://acuitycommerce.com/security",
  },
} as const;

export const getCurrentYear = () => new Date().getFullYear();

export const LEGAL_LABELS = {
  terms: "Terms",
  privacy: "Privacy",
  dataPolicy: "Data Policy",
  refundPolicy: "Refund Policy",
  security: "Security",
  docs: "Docs",
} as const;