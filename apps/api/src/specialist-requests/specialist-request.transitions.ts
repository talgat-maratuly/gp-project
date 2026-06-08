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
    throw new BadRequestException('Одобренную заявку нельзя изменить');
  }
  if (!ALLOWED[from]?.includes(to)) {
    throw new BadRequestException(`Недопустимый переход: ${from} → ${to}`);
  }
}

export function assertCanResubmit(status: RequestStatus): void {
  if (status !== RequestStatus.REJECTED) {
    throw new BadRequestException('Повторная отправка доступна только из статуса REJECTED');
  }
}

export function assertCanSubmit(status: RequestStatus | null, hasPending: boolean): void {
  if (hasPending) {
    throw new BadRequestException('Одновременно может быть только одна заявка в статусе PENDING');
  }
  if (status === RequestStatus.APPROVED) {
    throw new BadRequestException('Одобренную заявку нельзя изменить');
  }
}
