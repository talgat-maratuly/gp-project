from typing import Any, Literal

from pydantic import BaseModel, Field


Severity = Literal["ok", "info", "warning", "error"]


class AiIssue(BaseModel):
    severity: Severity = "info"
    code: str
    message: str
    recommendation: str | None = None
    requiresSpecialistReview: bool = False
    score: float = Field(default=0.5, ge=0, le=1)
    metadata: dict[str, Any] = Field(default_factory=dict)


class AiResponse(BaseModel):
    ok: bool = True
    domain: str
    summary: str
    issues: list[AiIssue] = Field(default_factory=list)
    recommendations: list[AiIssue] = Field(default_factory=list)
    data: dict[str, Any] = Field(default_factory=dict)


class OrderValidationRequest(BaseModel):
    order: dict[str, Any]
    client: dict[str, Any] | None = None
    cityCatalog: list[dict[str, Any]] = Field(default_factory=list)


class PartnerMatchRequest(BaseModel):
    order: dict[str, Any]
    partners: list[dict[str, Any]] = Field(default_factory=list)


class MarketRecommendRequest(BaseModel):
    city: str | None = None
    serviceId: str | None = None
    requiredItems: list[dict[str, Any]] = Field(default_factory=list)
    products: list[dict[str, Any]] = Field(default_factory=list)


class IrrigationCheckRequest(BaseModel):
    project: dict[str, Any]
    products: list[dict[str, Any]] = Field(default_factory=list)


class PlantDoctorRequest(BaseModel):
    photoUrl: str
    city: str | None = None
    description: str | None = None
    knowledgeBase: list[dict[str, Any]] = Field(default_factory=list)


class AdminAuditRequest(BaseModel):
    orders: list[dict[str, Any]] = Field(default_factory=list)
    partners: list[dict[str, Any]] = Field(default_factory=list)
    stores: list[dict[str, Any]] = Field(default_factory=list)
    products: list[dict[str, Any]] = Field(default_factory=list)


class ReportRequest(BaseModel):
    fromDate: str | None = None
    toDate: str | None = None
    orders: list[dict[str, Any]] = Field(default_factory=list)
    partners: list[dict[str, Any]] = Field(default_factory=list)
    stores: list[dict[str, Any]] = Field(default_factory=list)
    products: list[dict[str, Any]] = Field(default_factory=list)
