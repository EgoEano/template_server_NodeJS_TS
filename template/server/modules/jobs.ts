import { mainJobHandlers } from "./main/jobs.js";

export const jobRegistry: Record<string, (payload: any) => Promise<any>> = {
    ...mainJobHandlers,
};