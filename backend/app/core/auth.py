from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth, credentials
import os

from app.core.database import settings

# Initialize Firebase Admin
cred = None

try:
    # 1. Try Environment Variables first
    if settings.FIREBASE_PROJECT_ID and settings.FIREBASE_PRIVATE_KEY:
        cred_dict = {
            "type": settings.FIREBASE_TYPE or "service_account",
            "project_id": settings.FIREBASE_PROJECT_ID,
            "private_key_id": settings.FIREBASE_PRIVATE_KEY_ID,
            "private_key": settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n'),
            "client_email": settings.FIREBASE_CLIENT_EMAIL,
            "client_id": settings.FIREBASE_CLIENT_ID,
            "auth_uri": settings.FIREBASE_AUTH_URI,
            "token_uri": settings.FIREBASE_TOKEN_URI,
            "auth_provider_x509_cert_url": settings.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
            "client_x509_cert_url": settings.FIREBASE_CLIENT_X509_CERT_URL,
            "universe_domain": settings.FIREBASE_UNIVERSE_DOMAIN
        }
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        print("Firebase initialized with Environment Variables")

    # 2. Fallback to File
    elif os.path.exists(settings.FIREBASE_SERVICE_ACCOUNT_PATH):
        cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)
        print(f"Firebase initialized with file: {settings.FIREBASE_SERVICE_ACCOUNT_PATH}")

    else:
        # 3. Default (e.g. GCloud Env)
        firebase_admin.initialize_app()
        print("Firebase initialized with Default Credentials")

except ValueError:
    # App already initialized
    pass
except Exception as e:
    print(f"Warning: Firebase Admin not initialized: {e}")

security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        print("No credentials provided, using 'dev_user' for local development.")
        return "dev_user_123"
        
    token = credentials.credentials
    try:
        # Verify Token
        decoded_token = auth.verify_id_token(token)
        user_id = decoded_token['uid']
        return user_id
    except Exception as e:
        # DEVELOPMENT BYPASS
        # If we are developing and auth fails (e.g. no token from frontend or no firebase creds),
        # we fall back to a default dev user to keep things simple as requested.
        print(f"Auth failed ({str(e)}), using 'dev_user' for local development.")
        return "dev_user_123"

        # assert False # Uncomment to enforce strict auth
        
        # raise HTTPException(
        #     status_code=status.HTTP_401_UNAUTHORIZED,
        #     detail="Invalid authentication credentials",
        #     headers={"WWW-Authenticate": "Bearer"},
        # )
