from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

class SignUpRequest(BaseModel):
    name: str
    email: EmailStr
    number: str
    password: str
    organization: Optional[str] = "Independent"
    role: Optional[str] = "recruiter"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ResumeOut(BaseModel):
    ...
    model_config = ConfigDict(from_attributes=True)
        
class JobDescriptionInput(BaseModel):
    description: str  
    top_k: int  