import json
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from sqlalchemy.orm import Session

from database import ConversationModel, MessageModel, get_db, init_db
from schemas import ConversationCreate, ConversationOut, MessageCreate, MessageOut

load_dotenv()

# ─── App setup ───────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="CustomerAI API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


# ─── Conversations ────────────────────────────────────────────────────────────

@app.get("/conversations", response_model=list[ConversationOut])
def list_conversations(db: Session = Depends(get_db)):
    return (
        db.query(ConversationModel)
        .order_by(ConversationModel.updated_at.desc())
        .all()
    )


@app.post("/conversations", response_model=ConversationOut, status_code=201)
def create_conversation(body: ConversationCreate, db: Session = Depends(get_db)):
    conv = ConversationModel(
        id=str(uuid.uuid4()),
        title=body.title,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@app.delete("/conversations/{conversation_id}", status_code=204)
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conv = (
        db.query(ConversationModel)
        .filter(ConversationModel.id == conversation_id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.query(MessageModel).filter(
        MessageModel.conversation_id == conversation_id
    ).delete()
    db.delete(conv)
    db.commit()


# ─── Messages ────────────────────────────────────────────────────────────────

@app.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[MessageOut],
)
def list_messages(conversation_id: str, db: Session = Depends(get_db)):
    conv = (
        db.query(ConversationModel)
        .filter(ConversationModel.id == conversation_id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return (
        db.query(MessageModel)
        .filter(MessageModel.conversation_id == conversation_id)
        .order_by(MessageModel.created_at.asc())
        .all()
    )


@app.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: str,
    body: MessageCreate,
    db: Session = Depends(get_db),
):
    conv = (
        db.query(ConversationModel)
        .filter(ConversationModel.id == conversation_id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Persist user message
    user_msg = MessageModel(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="user",
        content=body.content,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # Build message history for OpenAI
    history = (
        db.query(MessageModel)
        .filter(MessageModel.conversation_id == conversation_id)
        .order_by(MessageModel.created_at.asc())
        .all()
    )
    openai_messages = [{"role": m.role, "content": m.content} for m in history]

    # Touch the conversation timestamp
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()

    async def stream_response() -> AsyncGenerator[str, None]:
        collected: list[str] = []

        try:
            stream = await openai_client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=openai_messages,
                stream=True,
            )
            async for chunk in stream:
                token = chunk.choices[0].delta.content or ""
                if token:
                    collected.append(token)
                    yield f"data: {json.dumps({'token': token})}\n\n"

        except Exception as exc:
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"
            return

        # Save the full assistant message
        full_content = "".join(collected)
        ai_msg = MessageModel(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            role="assistant",
            content=full_content,
            created_at=datetime.now(timezone.utc),
        )
        db.add(ai_msg)
        db.commit()
        db.refresh(ai_msg)

        # Emit the persisted message so the frontend replaces the streaming bubble
        msg_out = MessageOut.model_validate(ai_msg)
        yield f"data: {json.dumps({'message': msg_out.model_dump(mode='json')})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        stream_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
