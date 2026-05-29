import { BadRequestException } from '@nestjs/common';
import {
  MAIN_SERVICE_TO_CATEGORY,
  MainServiceId,
  subservicesForMain,
} from './specialist-onboarding.catalog';
import { SubmitOnboardingApplicationDto } from './dto/submit-onboarding-application.dto';

export function validateOnboardingPayload(dto: SubmitOnboardingApplicationDto) {
  const main = dto.mainServiceId as MainServiceId;
  const allowed = new Set(subservicesForMain(main).map((s) => s.id));
  const invalid = dto.subserviceIds.filter((id) => !allowed.has(id));
  if (invalid.length) {
    throw new BadRequestException({
      message: 'Select at least one sub-service',
      invalidSubservices: invalid,
      allowed: [...allowed],
    });
  }

  if (!dto.termsAccepted || !dto.personalDataAccepted) {
    throw new BadRequestException('Agreements must be accepted');
  }

  const needsVehicle = main === 'SEPTIC';
  const needsTools = ['LAWN', 'AUTOWATERING', 'FILTERS', 'OTHER'].includes(main);

  if (needsVehicle) {
    if (!dto.vehicle) {
      throw new BadRequestException('Vehicle information is required for this service');
    }
    const v = dto.vehicle;
    if (!v.vehicleBrand?.trim()) throw new BadRequestException('Enter vehicle brand');
    if (!v.licensePlate?.trim()) throw new BadRequestException('Enter license plate');
    if (!v.vehiclePhotoUrl) throw new BadRequestException('Upload vehicle photo');
  }

  if (needsTools) {
    if (!dto.equipmentPhotoUrls?.length) {
      throw new BadRequestException('Upload photos of your work tools.');
    }
    if (dto.equipmentPhotoUrls.length > 3) {
      throw new BadRequestException('Maximum 3 work tool photos');
    }
  }

  if (!dto.profilePhotoUrl) throw new BadRequestException('Upload profile photo');
  if (!dto.idCardFrontUrl) throw new BadRequestException('Upload front side of ID card');
  if (!dto.idCardBackUrl) throw new BadRequestException('Upload back side of ID card');

  return {
    primaryCategory: MAIN_SERVICE_TO_CATEGORY[main],
    mainServiceId: main,
  };
}
