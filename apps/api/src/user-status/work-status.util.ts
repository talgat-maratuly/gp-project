import { WorkStatus } from '@prisma/client';

export function workStatusToLegacyOnline(workStatus: WorkStatus): boolean {
  return workStatus === WorkStatus.ONLINE;
}

export function legacyOnlineToWorkStatus(isOnline: boolean): WorkStatus {
  return isOnline ? WorkStatus.ONLINE : WorkStatus.OFFLINE;
}

/** API/фронт: isOnline әрқашан workStatus-тен шығады (legacy mismatch жою). */
export function normalizePartnerProfileForApi<
  T extends { workStatus: WorkStatus; isOnline?: boolean },
>(profile: T): T {
  return {
    ...profile,
    isOnline: workStatusToLegacyOnline(profile.workStatus),
  };
}
