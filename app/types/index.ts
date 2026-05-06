import { RoleName } from "@/constants/roles";

export type { RoleName };

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: RoleName;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success?: boolean;
}
