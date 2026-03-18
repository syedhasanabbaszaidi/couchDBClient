from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import httpx
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class CouchDBConnection(BaseModel):
    url: str
    username: Optional[str] = None
    password: Optional[str] = None

class DocumentSave(BaseModel):
    document: Dict[str, Any]

class NewDocument(BaseModel):
    document: Optional[Dict[str, Any]] = None

# Helper function to create auth headers
def get_auth_header(username: Optional[str], password: Optional[str]):
    if username and password:
        credentials = f"{username}:{password}"
        encoded = base64.b64encode(credentials.encode()).decode()
        return {"Authorization": f"Basic {encoded}"}
    return {}

# Routes
@api_router.get("/")
async def root():
    return {"message": "CouchDB Client API"}

@api_router.post("/couchdb/test-connection")
async def test_connection(connection: CouchDBConnection):
    """Test CouchDB connection"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = get_auth_header(connection.username, connection.password)
            response = await client.get(connection.url, headers=headers)
            response.raise_for_status()
            return {"success": True, "data": response.json()}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/couchdb/databases")
async def list_databases(
    url: str,
    username: Optional[str] = None,
    password: Optional[str] = None
):
    """List all databases"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = get_auth_header(username, password)
            response = await client.get(f"{url}/_all_dbs", headers=headers)
            response.raise_for_status()
            return {"success": True, "databases": response.json()}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/couchdb/documents")
async def list_documents(
    url: str,
    database: str,
    username: Optional[str] = None,
    password: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
):
    """List documents in a database"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = get_auth_header(username, password)
            params = {"include_docs": "false", "limit": limit, "skip": skip}
            response = await client.get(
                f"{url}/{database}/_all_docs",
                headers=headers,
                params=params
            )
            response.raise_for_status()
            return {"success": True, "data": response.json()}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/couchdb/document")
async def get_document(
    url: str,
    database: str,
    doc_id: str,
    username: Optional[str] = None,
    password: Optional[str] = None
):
    """Get a specific document"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = get_auth_header(username, password)
            response = await client.get(
                f"{url}/{database}/{doc_id}",
                headers=headers
            )
            response.raise_for_status()
            return {"success": True, "document": response.json()}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/couchdb/document")
async def save_document(
    url: str,
    database: str,
    doc_id: str,
    data: DocumentSave,
    username: Optional[str] = None,
    password: Optional[str] = None
):
    """Save/update a document"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = get_auth_header(username, password)
            headers["Content-Type"] = "application/json"
            response = await client.put(
                f"{url}/{database}/{doc_id}",
                headers=headers,
                json=data.document
            )
            response.raise_for_status()
            return {"success": True, "data": response.json()}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/couchdb/document")
async def create_document(
    url: str,
    database: str,
    data: NewDocument,
    username: Optional[str] = None,
    password: Optional[str] = None
):
    """Create a new document"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = get_auth_header(username, password)
            headers["Content-Type"] = "application/json"
            doc = data.document if data.document else {}
            response = await client.post(
                f"{url}/{database}",
                headers=headers,
                json=doc
            )
            response.raise_for_status()
            return {"success": True, "data": response.json()}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/couchdb/document")
async def delete_document(
    url: str,
    database: str,
    doc_id: str,
    rev: str,
    username: Optional[str] = None,
    password: Optional[str] = None
):
    """Delete a document"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = get_auth_header(username, password)
            response = await client.delete(
                f"{url}/{database}/{doc_id}?rev={rev}",
                headers=headers
            )
            response.raise_for_status()
            return {"success": True, "data": response.json()}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
