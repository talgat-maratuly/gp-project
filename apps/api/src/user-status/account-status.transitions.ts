import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AccountStatus } from '@prisma/client';

const OPERATOR_ALLOWED: Record<AccountStatus, AccountStatus[]> = {
  [AccountStatus.ACTIVE]: [AccountStatus.SUSPENDED, AccountStatus.BANNED],
  [AccountStatus.SUSPENDED]: [AccountStatus.ACTIVE, AccountStatus.BANNED],
  [AccountStatus.BANNED]: [],
};

const ADMIN_RESTORE_FROM_BANNED: AccountStatus[] = [
  AccountStatus.ACTIVE,
  AccountStatus.SUSPENDED,
];

export function assertOperatorTransition(
  from: AccountStatus,
  to: AccountStatus,
  opts?: { isAdmin?: boolean },
): void {
  if (from === to) return;
  if (from === AccountStatus.BANNED) {
    if (opts?.isAdmin && ADMIN_RESTORE_FROM_BANNED.includes(to)) return;
    throw new ForbiddenException('BANNED аккаунтты тек ADMIN қалпына келтіре алады');
  }
  if (!OPERATOR_ALLOWED[from]?.includes(to)) {
    throw new BadRequestException(`Рұқсат етілмеген өтім: ${from} → ${to}`);
  }
}

export const ACCOUNT_STATUS_UI = {
  [AccountStatus.ACTIVE]: null,
  [AccountStatus.SUSPENDED]:
    'Your account has been temporarily suspended.\nPlease contact support for more information.',
  [AccountStatus.BANNED]: 'Your account has been banned.',
} as const;
