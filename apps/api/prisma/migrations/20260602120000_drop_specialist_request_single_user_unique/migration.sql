-- Earlier migration used DROP CONSTRAINT but these were UNIQUE INDEXes (see 20260529160000).
-- Without this, only one SpecialistRequest per user is allowed (P2002 on second submit).
DROP INDEX IF EXISTS "SpecialistRequest_userId_key";
DROP INDEX IF EXISTS "SpecialistRequest_partnerProfileId_key";
