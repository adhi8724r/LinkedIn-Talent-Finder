from pydantic import BaseModel, EmailStr, ConfigDict

class SignUpRequest(BaseModel):
    name: str
    email: EmailStr
    number: str
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ResumeOut(BaseModel):
    ...
    model_config = ConfigDict(from_attributes=True)
        
class JobDescriptionInput(BaseModel):
    description: str  
    top_k: int  