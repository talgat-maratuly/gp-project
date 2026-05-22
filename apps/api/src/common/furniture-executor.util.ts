import { FurnitureServiceType } from '@prisma/client';

export const FURNITURE_EXECUTOR_ACCESS_IDS: FurnitureServiceType[] = [
  FurnitureServiceType.furniture_manufacturing,
  FurnitureServiceType.furniture_assembly,
  FurnitureServiceType.furniture_repair,
];

export function isFurnitureExecutorAccessId(id: string): boolean {
  return (FURNITURE_EXECUTOR_ACCESS_IDS as string[]).includes(id);
}

export function deriveServiceAccessFromSubservices(subserviceIds: string[]): FurnitureServiceType[] {
  const set = new Set<FurnitureServiceType>();
  for (const id of subserviceIds) {
    if (isFurnitureExecutorAccessId(id)) {
      set.add(id as FurnitureServiceType);
    }
  }
  return [...set];
}
