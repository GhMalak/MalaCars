from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_ORIGIN
from app.routers import vehicles, drivers, contracts, financial, maintenances, dashboard

app = FastAPI(title="MalaCars API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vehicles.router)
app.include_router(drivers.router)
app.include_router(contracts.router)
app.include_router(financial.router)
app.include_router(maintenances.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "MalaCars API"}


@app.get("/health")
def health():
    return {"status": "healthy"}
