import { invoke } from "@tauri-apps/api/core";
import { queryClient } from "@/lib/queryClient";

export const sgCheckQuery = () => ({
  queryKey: QueryKeys.sgCheck,
  queryFn: () => invoke("check_sg_installed"),
});

export const invalidateSgCheck = () =>
  queryClient.invalidateQueries({ queryKey: QueryKeys.sgCheck });

export const QueryKeys = {
  sgCheck: ["check-sg-installed"],
} as const;
