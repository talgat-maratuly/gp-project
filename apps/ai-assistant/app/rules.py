from __future__ import annotations

from math import ceil
from typing import Any

from .schemas import AiIssue, AiResponse


def _num(value: Any, default: float = 0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _text(value: Any) -> str:
    return str(value or "").strip()


def validate_order(order: dict[str, Any], city_catalog: list[dict[str, Any]] | None = None) -> AiResponse:
    issues: list[AiIssue] = []
    service_id = _text(order.get("serviceId"))
    city = _text(order.get("city"))
    address = _text(order.get("address"))

    if not service_id:
        issues.append(AiIssue(severity="error", code="missing_service", message="Не указана услуга.", recommendation="Выберите serviceId перед созданием заявки."))
    if not city:
        issues.append(AiIssue(severity="error", code="missing_city", message="Не указан город.", recommendation="Запросите город клиента или franchiseId."))
    if not address and order.get("kind") != "market":
        issues.append(AiIssue(severity="warning", code="missing_address", message="Адрес пустой.", recommendation="Попросите клиента указать адрес или объект."))

    if service_id == "septic-pumping" and not order.get("septicVolume"):
        issues.append(AiIssue(severity="error", code="missing_septic_volume", message="Для септика не указан объём.", recommendation="Запросите объём 3-4, 5-7 или 10 м³."))
    if service_id in {"lawn-trim", "grass-mowing", "lawn-roll", "lawn-seeding", "lawn-roll-prep"} and not order.get("lawnAreaSqm"):
        issues.append(AiIssue(severity="warning", code="missing_lawn_area", message="Для газона не указана площадь.", recommendation="Запросите площадь в м²."))

    if city_catalog and service_id:
        active = any(str(row.get("id") or row.get("templateId")) == service_id and row.get("active", True) is not False for row in city_catalog)
        if not active:
            issues.append(AiIssue(severity="warning", code="service_not_active_in_city", message="Услуга не найдена активной в каталоге города.", recommendation="Проверьте GP Admin → услуги города."))

    return AiResponse(
        domain="orders.validate",
        ok=not any(i.severity == "error" for i in issues),
        summary="Заявка проверена" if issues else "Критичных ошибок в заявке не найдено",
        issues=issues,
    )


def match_partners(order: dict[str, Any], partners: list[dict[str, Any]]) -> AiResponse:
    service_id = _text(order.get("serviceId"))
    city = _text(order.get("city")).lower()
    scored = []
    issues: list[AiIssue] = []

    for partner in partners:
        services = partner.get("subserviceIds") or partner.get("services") or partner.get("serviceIds") or []
        partner_city = _text(partner.get("city")).lower()
        status = _text(partner.get("status") or partner.get("partnerStatus"))
        score = 0.2
        if service_id and service_id in services:
            score += 0.35
        if city and city == partner_city:
            score += 0.25
        if status in {"APPROVED", "approved"}:
            score += 0.15
        if partner.get("isOnline") or partner.get("workStatus") == "ONLINE":
            score += 0.05
        scored.append({**partner, "matchScore": round(min(score, 1), 2)})

    scored.sort(key=lambda p: p["matchScore"], reverse=True)
    if not scored or scored[0]["matchScore"] < 0.5:
        issues.append(AiIssue(severity="warning", code="no_strong_partner", message="Нет сильного совпадения партнёра.", recommendation="Проверьте город, активные подуслуги и модерацию партнёров."))

    return AiResponse(domain="orders.match_partners", summary="Партнёры отсортированы по score", issues=issues, data={"partners": scored[:10]})


def recommend_market(city: str | None, required_items: list[dict[str, Any]], products: list[dict[str, Any]]) -> AiResponse:
    recommendations = []
    issues: list[AiIssue] = []
    city_l = _text(city).lower()

    for item in required_items:
        name = _text(item.get("name"))
        qty = _num(item.get("qty"), 1)
        words = [w for w in name.lower().split() if len(w) > 2]
        matches = [
            p for p in products
            if (not city_l or _text(p.get("city")).lower() in {"", city_l})
            and any(w in _text(p.get("name")).lower() for w in words)
        ]
        matches.sort(key=lambda p: (_num(p.get("stock") or p.get("quantity"), 0), -_num(p.get("price"), 0)), reverse=True)
        best = matches[0] if matches else None
        stock = _num(best.get("stock") or best.get("quantity"), 0) if best else 0
        recommendations.append({
            "required": item,
            "product": best,
            "status": "available" if best and stock >= qty else "partial" if best and stock > 0 else "missing",
            "requestToShop": not best or stock < qty,
        })
        if not best or stock < qty:
            issues.append(AiIssue(severity="warning", code="product_missing", message=f"{name}: нет нужного остатка в городе.", recommendation="Показать аналог или отправить заявку магазину.", metadata={"item": item}))

    return AiResponse(domain="market.recommend", summary="Подбор товаров по городу выполнен", issues=issues, data={"items": recommendations})


def check_irrigation(project: dict[str, Any], products: list[dict[str, Any]]) -> AiResponse:
    length = _num(project.get("length"), 12)
    width = _num(project.get("width"), 8)
    sotki = _num(project.get("sotki") or project.get("lotAreaSotka"), 0)
    area = sotki * 100 if sotki > 0 else length * width
    pressure = _num(project.get("pressure"), 2)
    flow = _num(project.get("waterFlow"), 2)
    objects = project.get("objects") or []

    no_water = sum(_num(o.get("areaSqm"), 8) for o in objects if o.get("type") in {"house", "path", "no_water"})
    lawn_area = max(1, area - no_water)
    sprinkler_radius = 4 if pressure >= 2.1 else 3
    sprinkler_count = max(2, ceil(lawn_area / (3.14 * sprinkler_radius * sprinkler_radius * 0.55)))
    zones = max(1, ceil(lawn_area / 120), ceil((sprinkler_count * 0.18) / max(flow, 0.1)))

    issues: list[AiIssue] = []
    if not any(o.get("type") == "water_point" for o in objects):
        issues.append(AiIssue(severity="warning", code="water_point_missing", message="Не указана точка подключения воды.", recommendation="Добавьте точку воды на чертеже."))
    if pressure < 2.1:
        issues.append(AiIssue(severity="error", code="low_pressure", message="Давление ниже рекомендуемого для Hunter MP Rotator.", recommendation="Добавить насос или изменить тип форсунок.", requiresSpecialistReview=True))
    if flow < zones * 0.5:
        issues.append(AiIssue(severity="warning", code="low_flow", message="Расход воды может быть недостаточным.", recommendation=f"Разделить минимум на {zones} зон.", requiresSpecialistReview=True))
    if no_water > area * 0.4:
        issues.append(AiIssue(severity="warning", code="many_obstacles", message="Много препятствий или зон без полива.", recommendation="Специалист должен проверить сухие зоны."))
    if not issues:
        issues.append(AiIssue(severity="ok", code="mvp_ok", message="MVP-проверка не нашла критичных проблем.", recommendation="Перед монтажом подтвердить у специалиста."))

    required = [
        {"name": "Hunter MP Rotator", "qty": sprinkler_count},
        {"name": "Клапан Hunter PGV", "qty": zones},
        {"name": "Контроллер Hunter X2", "qty": 1},
        {"name": "Фильтр", "qty": 1},
        {"name": "Труба ПНД 25 мм", "qty": round((length + width) * 2 + sprinkler_count * sprinkler_radius)},
    ]
    market = recommend_market(_text(project.get("city")), required, products)

    return AiResponse(
        domain="irrigation.check",
        ok=not any(i.severity == "error" for i in issues),
        summary="Расчёт автополива проверен",
        issues=issues,
        data={
            "areaSqm": round(area),
            "lawnAreaSqm": round(lawn_area),
            "zones": zones,
            "sprinklers": sprinkler_count,
            "requiredItems": required,
            "market": market.data.get("items", []),
        },
    )


def analyze_plant(photo_url: str, city: str | None, description: str | None, knowledge_base: list[dict[str, Any]]) -> AiResponse:
    city_l = _text(city).lower()
    desc = _text(description).lower()
    dry_cities = {"уральск", "атырау", "актау", "кызылорда", "қызылорда"}
    cold_cities = {"астана", "петропавловск", "кокшетау", "қостанай", "костанай"}

    diagnosis = "Стресс растения, требуется проверка листьев и почвы"
    pest = None
    deficiency = None
    confidence = 0.48
    issues: list[AiIssue] = []

    if any(word in desc for word in ["пятн", "налет", "гриб", "мучнист"]):
        diagnosis = "Возможное грибковое заболевание листьев"
        confidence = 0.66
        issues.append(AiIssue(severity="warning", code="possible_fungus", message="Есть признаки грибкового поражения.", recommendation="Изолировать поражённые листья, не поливать по листу, показать фото специалисту.", requiresSpecialistReview=True, score=confidence))
    if any(word in desc for word in ["тля", "клещ", "жук", "черв", "насеком"]):
        pest = "Возможный вредитель на листьях или побегах"
        confidence = max(confidence, 0.62)
        issues.append(AiIssue(severity="warning", code="possible_pest", message="Возможны вредители.", recommendation="Осмотреть нижнюю сторону листа и молодые побеги, приложить крупный план.", requiresSpecialistReview=True, score=confidence))
    if any(word in desc for word in ["желт", "сух", "вян", "скруч"]):
        deficiency = "Возможный дефицит влаги или питания"
        confidence = max(confidence, 0.58)
        issues.append(AiIssue(severity="info", code="water_or_nutrition", message="Похоже на водный стресс или нехватку питания.", recommendation="Проверить влажность почвы на глубине 5-7 см и режим полива."))

    if city_l in dry_cities:
        issues.append(AiIssue(severity="info", code="dry_climate", message="Для города характерны сухой ветер и жаркие периоды.", recommendation="Проверить мульчу, капельный полив и вечерний полив без попадания на листья."))
    if city_l in cold_cities:
        issues.append(AiIssue(severity="info", code="cold_climate", message="Для города важны зимостойкость и весенние ожоги.", recommendation="Проверить укрытие, ожоги хвойных и перепады температуры."))

    similar = []
    for row in knowledge_base[:50]:
        row_city = _text(row.get("city")).lower()
        row_diag = _text(row.get("diagnosis")).lower()
        score = 0.2
        if row_city and row_city == city_l:
            score += 0.25
        if row_diag and any(word in desc for word in row_diag.split()[:4]):
            score += 0.25
        if score >= 0.4:
            similar.append({**row, "score": round(score, 2)})
    similar.sort(key=lambda r: r["score"], reverse=True)

    if not issues:
        issues.append(AiIssue(severity="info", code="photo_only_review", message="Фото принято, но признаков недостаточно для уверенного диагноза.", recommendation="Специалисту нужен крупный план листьев, стебля и почвы.", requiresSpecialistReview=True, score=confidence))

    recommendations = [
        AiIssue(severity="info", code="photo_next_steps", message="Сделайте 2-3 дополнительных фото крупным планом.", recommendation="Лист сверху, лист снизу, стебель и почва."),
        AiIssue(severity="info", code="safe_care", message="До подтверждения не применяйте сильные препараты.", recommendation="Сначала убрать повреждённые листья и стабилизировать полив."),
    ]

    return AiResponse(
        domain="plant_doctor.analyze",
        ok=True,
        summary="Предварительный AI-диагноз по фото растения готов",
        issues=issues,
        recommendations=recommendations,
        data={
            "photoUrl": photo_url,
            "city": city,
            "diagnosis": diagnosis,
            "pest": pest,
            "deficiency": deficiency,
            "confidence": confidence,
            "needsSpecialistReview": any(i.requiresSpecialistReview for i in issues) or confidence < 0.7,
            "similarCases": similar[:5],
        },
    )


def admin_audit(orders: list[dict[str, Any]], partners: list[dict[str, Any]], stores: list[dict[str, Any]], products: list[dict[str, Any]]) -> AiResponse:
    issues: list[AiIssue] = []
    stuck_orders = [o for o in orders if o.get("status") in {"NEW", "new", "submitted"} and not (o.get("assignedPartnerId") or o.get("partnerId"))]
    if stuck_orders:
        issues.append(AiIssue(severity="warning", code="orders_without_partner", message=f"{len(stuck_orders)} заявок без партнёра.", recommendation="Проверить назначение и активные подуслуги партнёров."))
    pending_partners = [p for p in partners if p.get("partnerStatus") in {"PENDING_REVIEW", "PENDING"}]
    if pending_partners:
        issues.append(AiIssue(severity="info", code="partners_pending", message=f"{len(pending_partners)} партнёров на модерации.", recommendation="Открыть GP Admin → модерация."))
    no_price = [p for p in products if _num(p.get("price"), 0) <= 0]
    if no_price:
        issues.append(AiIssue(severity="warning", code="products_without_price", message=f"{len(no_price)} товаров без цены.", recommendation="Попросить магазины заполнить цену."))
    blocked_stores = [s for s in stores if s.get("status") in {"REJECTED", "SUSPENDED"}]
    if blocked_stores:
        issues.append(AiIssue(severity="info", code="stores_need_attention", message=f"{len(blocked_stores)} магазинов требуют внимания.", recommendation="Проверить причины отказа/блокировки."))
    return AiResponse(domain="admin.audit", summary="Аудит GP Admin выполнен", issues=issues)


def build_report(domain: str, payload: dict[str, Any]) -> AiResponse:
    orders = payload.get("orders") or []
    partners = payload.get("partners") or []
    stores = payload.get("stores") or []
    products = payload.get("products") or []
    completed = [o for o in orders if str(o.get("status")).lower() in {"completed", "done"}]
    open_orders = len(orders) - len(completed)
    return AiResponse(
        domain=f"reports.{domain}",
        summary=f"Отчёт {domain}: {len(orders)} заявок, {len(partners)} партнёров, {len(stores)} магазинов",
        data={
            "ordersTotal": len(orders),
            "ordersOpen": open_orders,
            "ordersCompleted": len(completed),
            "partnersTotal": len(partners),
            "storesTotal": len(stores),
            "productsTotal": len(products),
        },
        issues=admin_audit(orders, partners, stores, products).issues,
    )
