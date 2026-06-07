from fastapi import FastAPI

from .rules import admin_audit, analyze_plant, build_report, check_irrigation, match_partners, recommend_market, validate_order
from .schemas import (
    AdminAuditRequest,
    IrrigationCheckRequest,
    MarketRecommendRequest,
    OrderValidationRequest,
    PartnerMatchRequest,
    PlantDoctorRequest,
    ReportRequest,
)

app = FastAPI(
    title="GP Python AI Assistant",
    version="0.1.0",
    description="AI assistant for GP Service, GP Market, GP Partner, GP Admin and Backend. GP Work is excluded.",
)


@app.get("/health")
def health():
    return {"ok": True, "service": "gp-ai-assistant", "gpWorkExcluded": True}


@app.post("/ai/orders/validate")
def ai_orders_validate(payload: OrderValidationRequest):
    return validate_order(payload.order, payload.cityCatalog)


@app.post("/ai/orders/match-partners")
def ai_orders_match_partners(payload: PartnerMatchRequest):
    return match_partners(payload.order, payload.partners)


@app.post("/ai/market/recommend")
def ai_market_recommend(payload: MarketRecommendRequest):
    return recommend_market(payload.city, payload.requiredItems, payload.products)


@app.post("/ai/irrigation/check")
def ai_irrigation_check(payload: IrrigationCheckRequest):
    return check_irrigation(payload.project, payload.products)


@app.post("/ai/plant-doctor/analyze")
def ai_plant_doctor_analyze(payload: PlantDoctorRequest):
    return analyze_plant(payload.photoUrl, payload.city, payload.description, payload.knowledgeBase)


@app.post("/ai/admin/audit")
def ai_admin_audit(payload: AdminAuditRequest):
    return admin_audit(payload.orders, payload.partners, payload.stores, payload.products)


@app.post("/ai/reports/service")
def ai_report_service(payload: ReportRequest):
    return build_report("service", payload.model_dump())


@app.post("/ai/reports/partner")
def ai_report_partner(payload: ReportRequest):
    return build_report("partner", payload.model_dump())


@app.post("/ai/reports/admin")
def ai_report_admin(payload: ReportRequest):
    return build_report("admin", payload.model_dump())
