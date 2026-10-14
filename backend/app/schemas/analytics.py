from typing import List
from pydantic import BaseModel


class DistrictStat(BaseModel):
    district_id: int
    district_name: str
    total_applications: int
    completed_applications: int
    emergency_count: int
    lat: float
    lng: float


class CategoryStat(BaseModel):
    category_id: int
    category_title: str
    count: int
    percentage: float


class BenefitCategoryStat(BaseModel):
    category: str
    count: int


class DynamicsPoint(BaseModel):
    date: str
    total: int
    completed: int
    emergency: int


class SummaryStats(BaseModel):
    total_applications: int
    completed_applications: int
    in_progress_applications: int
    emergency_applications: int
    total_volunteers: int
    active_volunteers: int
    total_volunteer_hours: int
    districts_covered: int


class AnalyticsDashboardResponse(BaseModel):
    summary: SummaryStats
    district_stats: List[DistrictStat]
    category_stats: List[CategoryStat]
    benefit_stats: List[BenefitCategoryStat]
    dynamics: List[DynamicsPoint]
