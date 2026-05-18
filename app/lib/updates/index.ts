import {
  currentAppMode,
  areUpdatesEnabled,
  type AppMode,
} from "@/lib/config/app-mode";

export type UpdateStrategy =
  | "managed_cloud"
  | "manual_self_hosted"
  | "desktop_auto_updater";

export interface UpdateStatus {
  mode: AppMode;
  enabled: boolean;
  strategy: UpdateStrategy;
  message: string;
}

function getUpdateStrategy(mode: AppMode): UpdateStrategy {
  switch (mode) {
    case "desktop":
      return "desktop_auto_updater";
    case "self_hosted":
      return "manual_self_hosted";
    case "cloud":
    default:
      return "managed_cloud";
  }
}

export function getUpdateStatus(): UpdateStatus {
  const strategy = getUpdateStrategy(currentAppMode);

  return {
    mode: currentAppMode,
    enabled: areUpdatesEnabled,
    strategy,
    message: areUpdatesEnabled
      ? "Update checks are enabled for this runtime mode."
      : "Update checks are disabled until an updater is implemented.",
  };
}
