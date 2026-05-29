import { WorkStatus } from '@prisma/client';

export function workStatusToLegacyOnline(workStatus: WorkStatus): boolean {
  return workStatus === WorkStatus.ONLINE;
}

export function legacyOnlineToWorkStatus(isOnline: boolean): WorkStatus {
  return isOnline ? WorkStatus.ONLINE : WorkStatus.OFFLINE;
}
