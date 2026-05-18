import {
  currentAppMode,
  isLicenseRequired,
  type AppMode,
} from "@/lib/config/app-mode";

export type LicenseState = "not_required" | "pending";

export interface LicenseStatus {
  mode: AppMode;
  required: boolean;
  enforced: false;
  state: LicenseState;
  message: string;
}

export function getLicenseStatus(): LicenseStatus {
  if (!isLicenseRequired) {
    return {
      mode: currentAppMode,
      required: false,
      enforced: false,
      state: "not_required",
      message: "License validation is not required for this runtime mode.",
    };
  }

  return {
    mode: currentAppMode,
    required: true,
    enforced: false,
    state: "pending",
    message: "License validation is configured but not implemented yet.",
  };
}

export function isLicenseGateActive() {
  // TODO: Enable enforcement after cloud subscription, self-host keys,
  // and desktop activation checks are implemented.
  return false;
}
