"""Data models (request/response schemas) for the To-Do List API."""

from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

Priority = Literal["low", "medium", "high"]


class TaskCreate(BaseModel):
    """Data sent when creating a task."""

    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    priority: Priority = "medium"
    due_date: Optional[date] = None

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Title must not be empty")
        return value


class TaskUpdate(BaseModel):
    """Data sent when editing a task or toggling its completed status.

    Every field is optional so the frontend can send only what changed
    (for example, just {"completed": true} when the checkbox is clicked).
    """

    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: Optional[bool] = None
    priority: Optional[Priority] = None
    due_date: Optional[date] = None

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Title must not be empty")
        return value


class TaskResponse(BaseModel):
    """A task as returned by the API."""

    id: int
    title: str
    description: Optional[str]
    completed: bool
    priority: Priority = "medium"
    due_date: Optional[date] = None
    created_at: datetime


class StatsResponse(BaseModel):
    """Counts shown in the dashboard area of the UI."""

    total: int
    completed: int
    pending: int
    completion_percentage: int = 0
