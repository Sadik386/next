export const PUBLIC_LINKS = {
  main: "https://accoraze.com",
  www: "https://www.accoraze.com",
  app: "https://app.accoraze.com",
  docs: "https://docs.accoraze.com",
  support: "https://support.accoraze.com",
  status: "https://status.accoraze.com",
  legal: {
    terms: "https://accoraze.com/terms",
    privacy: "https://accoraze.com/privacy",
    dataPolicy: "https://accoraze.com/data-policy",
    refundPolicy: "https://accoraze.com/refund-policy",
    security: "https://accoraze.com/security",
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