"""
Railway production entry point.
Reads PORT from environment directly — no shell expansion required.
"""
import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"[Startup] Binding to 0.0.0.0:{port}")
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        workers=1,
    )
