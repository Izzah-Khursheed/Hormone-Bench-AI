from typing import List, Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from pydantic import BaseModel
from backend.app.config import settings
from backend.app.services.document_service import DocumentService
from backend.app.services.chat_service import ChatService
from backend.app.tools.url_reader import URLReaderTool
from backend.app.utils.exceptions import DocumentProcessingError

from backend.app.api.literature import router as literature_router
from backend.app.api.papers import router as papers_router
from backend.app.api.search import router as search_router
from backend.app.api.citations import router as citations_router
from backend.app.api.reports import router as reports_router
from backend.app.api.dataset_analysis import router as dataset_analysis_router
from backend.app.api.evidence import router as evidence_router
from backend.app.api.tutor import router as tutor_router
from backend.app.api.education import router as education_router
from backend.app.api.knowledge_graph import router as kg_router
from backend.app.api.statistics import router as statistics_router

router = APIRouter()
document_service = DocumentService()
chat_service = ChatService()
url_reader = URLReaderTool()
router.include_router(data_validation_router)

router.include_router(literature_router)
router.include_router(papers_router)
router.include_router(search_router)
router.include_router(citations_router)
router.include_router(reports_router)
router.include_router(dataset_analysis_router)
router.include_router(evidence_router)
router.include_router(tutor_router)
router.include_router(education_router)
router.include_router(kg_router)
router.include_router(statistics_router)


class HealthCheckResponse(BaseModel):
    status: str
    environment: str
    model: str


class DocumentUploadResponse(BaseModel):
    filename: str
    status: str
    pages: int
    chunks: int


class ChatRequest(BaseModel):
    message: str
    thread_id: Optional[str] = "default"


class ChatResponse(BaseModel):
    answer: str
    route_used: str
    docs_retrieved: Optional[List[Dict[str, Any]]] = []
    citations: Optional[List[Dict[str, Any]]] = []


class URLResearchRequest(BaseModel):
    url: str


class URLResearchResponse(BaseModel):
    url: str
    title: str
    content_preview: str


@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    return HealthCheckResponse(
        status="healthy",
        environment=settings.APP_ENV,
        model=settings.LLM_MODEL
    )


@router.post("/documents/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(file: UploadFile = File(...)):
    allowed_extensions = {".pdf", ".docx", ".txt"}
    file_ext = "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{file_ext}'. Allowed: {allowed_extensions}"
        )

    try:
        result = await document_service.save_and_ingest_file(file)
        return DocumentUploadResponse(
            filename=result["filename"],
            status=result["status"],
            pages=result["pages"],
            chunks=result["chunks"]
        )
    except DocumentProcessingError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty.")

    try:
        result = await chat_service.process_chat_message(
            message=request.message,
            thread_id=request.thread_id or "default"
        )
        return ChatResponse(
            answer=result["answer"],
            route_used=result["route_used"],
            docs_retrieved=result["docs_retrieved"],
            citations=result["citations"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing query: {str(e)}"
        )


@router.post("/research/url", response_model=URLResearchResponse)
async def research_url_endpoint(request: URLResearchRequest):
    if not request.url.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="URL cannot be empty.")

    res = url_reader.read_url(request.url)
    return URLResearchResponse(
        url=res["url"],
        title=res["title"],
        content_preview=res["content"][:300] + "..." if len(res["content"]) > 300 else res["content"]
    )