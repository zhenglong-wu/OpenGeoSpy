"""Pydantic request/response schemas for the API."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

# --- Requests ---


class LocateRequest(BaseModel):
    """Query parameters for locate endpoint (file comes via form data)."""

    location_hint: str | None = Field(
        None, description="Optional location context (tie-breaker; does not override strong image evidence)"
    )


# --- Responses ---


class EvidenceItem(BaseModel):
    source: str
    content: str
    confidence: float
    latitude: float | None = None
    longitude: float | None = None
    country: str | None = None
    region: str | None = None
    city: str | None = None
    url: str | None = None


class PipelineStep(BaseModel):
    name: str
    status: str
    duration_ms: float = 0.0
    evidence_count: int = 0
    error: str | None = None


class LocateResponse(BaseModel):
    """Response from the locate endpoint."""

    name: str = "Unknown"
    country: str | None = None
    region: str | None = None
    city: str | None = None
    lat: float | None = Field(None, alias="latitude")
    lon: float | None = Field(None, alias="longitude")
    confidence: float = 0.0
    reasoning: str = ""
    verified: bool = False
    verification_warning: str | None = None

    evidence_trail: list[EvidenceItem] = []
    evidence_summary: dict[str, Any] = {}
    pipeline_progress: dict[str, Any] = {}
    total_evidence_count: int = 0
    elapsed_ms: float = 0.0
    execution_policy: dict[str, Any] = {}
    quality: str = "balanced"
    fast_path_reason: str | None = None

    model_config = {"populate_by_name": True}


class GroundingInfo(BaseModel):
    """Per-level grounding verdict from the HierarchicalResolver."""

    level: str
    value: str | None = None
    verdict: str = "uncertain"
    confidence: float = 0.0
    supporting_count: int = 0
    contradicting_count: int = 0
    source_count: int = 0
    explanation: str = ""


class CandidateResult(BaseModel):
    """A ranked location candidate."""

    rank: int
    name: str
    country: str | None = None
    region: str | None = None
    city: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    confidence: float = 0.0
    reasoning: str = ""
    evidence_trail: list[EvidenceItem] = []
    visual_match_score: float | None = None
    source_diversity: int = 0
    resolved_level: str | None = None
    groundings: list[GroundingInfo] = []


class LocateResponseV2(BaseModel):
    """V2 response with multi-candidate ranking and search graph."""

    # Primary prediction (same as v1 for backward compat)
    name: str = "Unknown"
    country: str | None = None
    region: str | None = None
    city: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    confidence: float = 0.0
    reasoning: str = ""
    verified: bool = False
    verification_warning: str | None = None

    # V2 additions
    candidates: list[CandidateResult] = []
    search_graph: dict[str, Any] | None = None
    session_id: str | None = None

    # Common
    evidence_trail: list[EvidenceItem] = []
    evidence_summary: dict[str, Any] = {}
    pipeline_progress: dict[str, Any] = {}
    total_evidence_count: int = 0
    elapsed_ms: float = 0.0
    execution_policy: dict[str, Any] = {}
    quality: str = "balanced"
    fast_path_reason: str | None = None


class ChatRequest(BaseModel):
    """Request for chat follow-up."""

    message: str = Field(..., min_length=1, max_length=2000)


class ChatMessageSchema(BaseModel):
    """A single chat message."""

    role: str  # "user" or "assistant"
    content: str
    timestamp: str | None = None
    metadata: dict[str, Any] | None = None


class SessionResponse(BaseModel):
    """Response with session state."""

    session_id: str
    candidates: list[CandidateResult] = []
    evidence_count: int = 0
    search_graph: dict[str, Any] | None = None
    messages: list[ChatMessageSchema] = []


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.3.0"
    services: dict[str, bool] = {}


class SSEEvent(BaseModel):
    """Server-Sent Event payload."""

    event: str
    step: str | None = None
    duration_ms: float | None = None
    evidence_count: int | None = None
    error: str | None = None
    data: dict[str, Any] | None = None

    # Tracing-specific fields (v0.3.0)
    model: str | None = None
    tokens: int | None = None
    cost_usd: float | None = None
    source: str | None = None
    content_preview: str | None = None
    confidence: float | None = None
    level: str | None = None
    verdict: str | None = None
