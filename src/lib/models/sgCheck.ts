import { invoke } from "@tauri-apps/api/core";

export const sgCheckQuery = () => ({
  queryKey: QueryKeys.sgCheck,
  queryFn: () => invoke("check_sg_installed"),
});

export const QueryKeys = {
  sgCheck: ["check-sg-installed"],
} as const;
