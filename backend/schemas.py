from pydantic import BaseModel
from datetime import datetime
from typing import Literal


class ConversationCreate(BaseModel):
    title: str = "New conversation"


class ConversationOut(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    content: str


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
