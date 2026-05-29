import { BadRequestException } from '@nestjs/common';
import { RequestStatus } from '@prisma/client';

export const SpecialistRequestStatus = RequestStatus;
export type SpecialistRequestStatusType = RequestStatus;

const ALLOWED: Record<RequestStatus, RequestStatus[]> = {
  [RequestStatus.PENDING]: [RequestStatus.APPROVED, RequestStatus.REJECTED],
  [RequestStatus.REJECTED]: [RequestStatus.PENDING],
  [RequestStatus.APPROVED]: [],
};

export function assertRequestStatusTransition(
  from: RequestStatus,
  to: RequestStatus,
): void {
  if (from === to) return;
  if (from === RequestStatus.APPROVED) {
    throw new BadRequestException('Бекітілген өтінім өзгертілмейді');
  }
  if (!ALLOWED[from]?.includes(to)) {
    throw new BadRequestException(`Рұқсат етілмеген өтім: ${from} → ${to}`);
  }
}

export function assertCanResubmit(status: RequestStatus): void {
  if (status !== RequestStatus.REJECTED) {
    throw new BadRequestException('Қайта жіберу тек REJECTED статусынан');
  }
}

export function assertCanSubmit(status: RequestStatus | null, hasPending: boolean): void {
  if (hasPending) {
    throw new BadRequestException('Бір уақытта тек бір PENDING өтінім болуы мүмкін');
  }
  if (status === RequestStatus.APPROVED) {
    throw new BadRequestException('Бекітілген өтінімді өзгертуге болмайды');
  }
}
