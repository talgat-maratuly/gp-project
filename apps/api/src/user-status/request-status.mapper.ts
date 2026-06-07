import { PartnerStatus, RequestStatus } from '@prisma/client';

/** PartnerStatus (workflow) → RequestStatus (moderation) */
export function requestStatusFromPartnerStatus(status: PartnerStatus): RequestStatus | null {
  switch (status) {
    case PartnerStatus.DRAFT:
      return null;
    case PartnerStatus.PENDING_REVIEW:
    case PartnerStatus.NEEDS_REVISION:
      return RequestStatus.PENDING;
    case PartnerStatus.APPROVED:
    case PartnerStatus.SUSPENDED:
      return RequestStatus.APPROVED;
    case PartnerStatus.REJECTED:
      return RequestStatus.REJECTED;
    default:
      return null;
  }
}

export function partnerStatusForRequestApproval(): PartnerStatus {
  return PartnerStatus.APPROVED;
}

export function partnerStatusForRequestRejection(): PartnerStatus {
  return PartnerStatus.REJECTED;
}

export function partnerStatusForRequestPending(): PartnerStatus {
  return PartnerStatus.PENDING_REVIEW;
}
