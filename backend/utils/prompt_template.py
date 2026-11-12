from langchain_core.prompts import PromptTemplate

# 📝 Prompt template for structured extraction + scoring
resume_parse_prompt = PromptTemplate(
    input_variables=["job_description", "resume_text"],
    template="""
Given the following job description and candidate resume, extract:

- name
- years_of_experience
- email
- mobile_number
- and rate how strongly this candidate matches the job on a scale from 1 to 10 (10 means perfect fit, 1 means very weak fit).

Return your response strictly as JSON like:
{{
    "name": "John Doe",
    "years_of_experience": 5,
    "email": "john.doe@example.com",
    "mobile_number": "+1234567890",
    "strong_match_score": 8
}}

Job Description:
{job_description}

Candidate Resume:
{resume_text}
"""
)

# Save to JSON file
resume_parse_prompt.save("latest-prompt.json")
