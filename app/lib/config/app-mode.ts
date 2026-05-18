export const APP_MODES = ["cloud", "self_hosted", "desktop"] as const;

export type AppMode = (typeof APP_MODES)[number];

export const DEFAULT_APP_MODE: AppMode = "cloud";

export function parseAppMode(value: string | undefined | null): AppMode {
  const normalized = value?.trim().toLowerCase().replace("-", "_");

  if (normalized === "selfhosted") return "self_hosted";
  if (APP_MODES.includes(normalized as AppMode)) return normalized as AppMode;

  return DEFAULT_APP_MODE;
}

export function parseEnvBoolean(
  value: string | undefined | null,
  fallback: boolean
): boolean {
  if (value === undefined || value === null || value.trim() === "") {
    return fallback;
  }

  switch (value.trim().toLowerCase()) {
    case "1":
    case "true":
    case "yes":
    case "on":
      return true;
    case "0":
    case "false":
    case "no":
    case "off":
      return false;
    default:
      return fallback;
  }
}

export const currentAppMode = parseAppMode(process.env.APP_MODE);

export const isCloud = currentAppMode === "cloud";
export const isSelfHosted = currentAppMode === "self_hosted";
export const isDesktop = currentAppMode === "desktop";

export const isSetupRequired = parseEnvBoolean(
  process.env.APP_SETUP_REQUIRED,
  true
);

export const isLicenseRequired = parseEnvBoolean(
  process.env.APP_LICENSE_REQUIRED,
  false
);

export const areUpdatesEnabled = parseEnvBoolean(
  process.env.APP_UPDATES_ENABLED,
  false
);

export const appRuntimeConfig = Object.freeze({
  mode: currentAppMode,
  isCloud,
  isSelfHosted,
  isDesktop,
  setupRequired: isSetupRequired,
  licenseRequired: isLicenseRequired,
  updatesEnabled: areUpdatesEnabled,
});

export function getAppRuntimeConfig() {
  return appRuntimeConfig;
}
