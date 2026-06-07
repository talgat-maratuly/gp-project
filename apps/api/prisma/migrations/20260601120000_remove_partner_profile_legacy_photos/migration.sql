-- Remove legacy partner profile photo JSON (specialist photos live on SpecialistRequest)
ALTER TABLE "PartnerProfile" DROP COLUMN IF EXISTS "vehiclePhotos";
ALTER TABLE "PartnerProfile" DROP COLUMN IF EXISTS "equipmentPhotos";
