import { PartialType } from '@nestjs/swagger';
import { PartnerApplyDto } from './partner-apply.dto';

export class PartnerResubmitDto extends PartialType(PartnerApplyDto) {}
