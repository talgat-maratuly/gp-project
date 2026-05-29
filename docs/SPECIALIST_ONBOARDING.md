# GP Service — Specialist Onboarding & Moderation

## Негізгі ережелер

- **Бір өтінім = бір негізгі қызмет** (`primaryCategory` / `mainServiceId`)
- Sub-services тек сол қызметке жатады
- Жаңа негізгі қызмет немесе жаңа sub-service → **жаңа өтінім**
- `PENDING` → тапсырыс алу мүмкін емес
- Кем дегенде **бір `APPROVED`** өтінім бар specialist тапсырыс ала алады
- `PENDING` өтінімді өңдеуге болмайды; `REJECTED` → `resubmitRequestId` арқылы қайта жіберу

## API (NestJS + Prisma)

| Method | Path | Сипаттама |
|--------|------|-----------|
| GET | `/api/specialist/onboarding/catalog` | Қызметтер, sub-services, rejection reasons |
| GET | `/api/specialist/applications` | Менің өтінімдерім |
| GET | `/api/specialist/applications/:id` | Бір өтінім |
| POST | `/api/specialist/applications` | Жіберу / қайта жіберу |
| GET | `/api/specialist/my-requests` | Legacy list (applications[]) |
| GET | `/api/moderator/specialist-requests` | Модерация тізімі |
| PATCH | `/api/moderator/specialist-requests/:id/approve` | Бекіту (offerings осы request бойынша) |
| PATCH | `/api/moderator/specialist-requests/:id/reject` | Қабылдамау |

### POST body (қысқаша)

`mainServiceId`, `subserviceIds[]`, `regionId`, `city`, `fullName`, `phone`, `profilePhotoUrl`, `idCardFrontUrl`, `idCardBackUrl`, `vehicle?` (SEPTIC), `equipmentPhotoUrls?` (Lawn/…), `termsAccepted`, `personalDataAccepted`, `resubmitRequestId?`

Файлдар: URL массивтері (upload endpoint кейін қосылады).

## Flutter архитектурасы (10 қадам)

```
lib/features/specialist_onboarding/
  domain/
    onboarding_step.dart          // enum: service, subservices, region, ...
    onboarding_state.dart
    main_service_id.dart
  data/
    onboarding_api.dart           // Retrofit/Dio
    onboarding_repository.dart
    catalog_dto.dart
  application/
    onboarding_cubit.dart         // Bloc/Cubit
  presentation/
    screens/                      // 10 экран
    widgets/
      dynamic_multi_select.dart
      file_upload_tile.dart
      review_section.dart
    onboarding_router.dart        // go_router + conditional branches
```

### Conditional screens

```dart
bool showVehicle(MainServiceId id) =>
  id == MainServiceId.septic; // Garbage Truck — admin catalog кейін

bool showWorkTools(MainServiceId id) =>
  id.requiresWorkTools; // Lawn, Auto Irrigation, Filters, Other
```

### Navigation flow

1. Service Selection  
2. Sub-Service MultiSelect (catalog.subservicesByMain)  
3. Region / City (geo API)  
4. Personal Information  
5. Photos & ID  
6. Vehicle **OR** Work Tools (branch)  
7. Work Experience  
8. Agreements  
9. Review Checklist  
10. Submitted (read-only, status PENDING)

### State

- `OnboardingDraft` — локальді draft (Hive/shared_preferences)
- Submit → `POST /specialist/applications`
- Applications list экраны — әр қызмет жеке карточка (status badge)

## Shared catalog

`@gp/shared-core/specialist-onboarding` — `MAIN_SERVICES`, `SUBSERVICES_BY_MAIN`, `REJECTION_REASON_CODES`

## Moderation

Approve: тек `PartnerServiceOffering.specialistRequestId = requestId` → ACTIVE.

Reject: сол request offerings PENDING; басқа APPROVED өтінім болса profile REJECTED болмайды.

## Келесі қадамдар

- [ ] Upload API (S3/local) + signed URLs  
- [ ] Admin UI: file preview, rejection code dropdown  
- [ ] Order matching: city + approved subserviceIds only  
- [ ] `npm run prisma:migrate:deploy` production
