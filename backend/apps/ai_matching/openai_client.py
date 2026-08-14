import json
import random
from django.conf import settings

try:
    import openai
except ImportError:  # pragma: no cover
    openai = None

DEFAULT_MODEL = getattr(settings, 'OPENAI_MODEL', 'gpt-3.5-turbo')
DEFAULT_QUESTION_COUNT = 5

AI_PROMPT_SETS = {
    'mock-interview-sprint': [
        {'prompt': 'Explain how you would prepare for a technical interview on a new platform.'},
        {'prompt': 'What strategies do you use to handle unexpected questions during an interview?'},
        {'prompt': 'How do you demonstrate problem-solving under pressure?'},
        {'prompt': 'How would you explain a technical concept to a non-technical audience?'},
        {'prompt': 'Share an example of a time you made a mistake and how you recovered.'},
        {'prompt': 'Describe how you stay current with new technologies and frameworks.'},
        {'prompt': 'How do you balance quality and speed when delivering a project?'},
    ],
    'aptitude-challenge': [
        {'prompt': 'Describe a situation where you improved a process or workflow.'},
        {'prompt': 'How do you prioritize tasks when deadlines overlap?'},
        {'prompt': 'What approach do you take to learn a new technical skill quickly?'},
        {'prompt': 'How do you identify the most important problem to solve first?'},
        {'prompt': 'Explain a time you used data to make a better decision.'},
        {'prompt': 'How do you handle ambiguous requirements or unclear goals?'},
        {'prompt': 'What is your process for breaking a big challenge into smaller steps?'},
    ],
    'behavioral-readiness-test': [
        {'prompt': 'Tell me about a time you received difficult feedback and what you did next.'},
        {'prompt': 'How do you keep yourself motivated during long projects?'},
        {'prompt': 'Describe how you respond when a team member disagrees with your idea.'},
        {'prompt': 'Share an example of when you went above and beyond for a team goal.'},
        {'prompt': 'How do you handle a situation where you missed an important deadline?'},
        {'prompt': 'Describe a time you helped someone on your team improve their performance.'},
        {'prompt': 'How do you stay calm and focused during a stressful situation?'},
    ],
}


def _sample_questions(session_slug: str, count: int = DEFAULT_QUESTION_COUNT) -> list[dict]:
    pool = AI_PROMPT_SETS.get(session_slug, [])
    if not pool:
        return []
    if len(pool) <= count:
        return pool.copy()
    return random.sample(pool, count)


def _normalize_skill_set(skills: str) -> set[str]:
    return {s.strip().lower() for s in skills.replace(';', ',').split(',') if s.strip()}


def _profile_context(profile) -> str:
    if not profile:
        return 'No candidate profile details available.'

    parts = []
    headline = getattr(profile, 'headline', '')
    skills = getattr(profile, 'skills', '')
    experience = getattr(profile, 'experience_years', 0)
    location = getattr(profile, 'current_location', '')
    resume_name = getattr(getattr(profile, 'resume', None), 'name', '')

    if headline:
        parts.append(f'Headline: {headline}')
    if skills:
        parts.append(f'Skills: {skills}')
    if experience:
        parts.append(f'Experience: {experience} years')
    if location:
        parts.append(f'Location: {location}')
    if resume_name:
        parts.append('Resume attached')

    return ' | '.join(parts) if parts else 'No candidate profile details available.'


def _skill_based_questions(session_slug: str, skills: str, headline: str, count: int = DEFAULT_QUESTION_COUNT) -> list[dict]:
    skill_set = _normalize_skill_set(skills)
    questions = []

    if session_slug == 'mock-interview-sprint':
        if 'python' in skill_set or 'django' in skill_set:
            questions.append({'prompt': 'How have you used Python and Django together to build a maintainable web application?'})
        if 'angular' in skill_set or 'typescript' in skill_set:
            questions.append({'prompt': 'Describe a complex front-end feature you implemented with Angular and why you chose that approach.'})
        if 'aws' in skill_set or 'docker' in skill_set:
            questions.append({'prompt': 'How do you design a scalable deployment strategy using the cloud tools in your resume?'} )
        if not questions:
            questions.append({'prompt': 'Tell me about a recent technical project that best represents your core strengths.'})
        questions.extend([q for q in AI_PROMPT_SETS.get(session_slug, []) if q not in questions])
    elif session_slug == 'aptitude-challenge':
        if 'data' in skills.lower() or 'sql' in skills.lower():
            questions.append({'prompt': 'How do you approach analyzing a dataset to uncover the most important insights?'})
        if 'product' in headline.lower() or 'project' in headline.lower():
            questions.append({'prompt': 'Describe how you decide which work items deliver the highest value first.'})
        questions.extend([q for q in AI_PROMPT_SETS.get(session_slug, []) if q not in questions])
    else:
        if 'team' in skills.lower() or 'collabor' in skills.lower():
            questions.append({'prompt': 'Describe a time you helped a team member overcome a difficult challenge.'})
        questions.extend([q for q in AI_PROMPT_SETS.get(session_slug, []) if q not in questions])

    if len(questions) >= count:
        return questions[:count]
    return questions + _sample_questions(session_slug, count - len(questions))


def _openai_available() -> bool:
    return openai is not None and bool(getattr(settings, 'OPENAI_API_KEY', ''))


def _initialize_openai() -> None:
    if openai is None:
        raise RuntimeError('OpenAI package is not installed. Install openai>=1.0.0.')
    api_key = getattr(settings, 'OPENAI_API_KEY', '')
    if not api_key:
        raise RuntimeError('OPENAI_API_KEY is not configured.')
    openai.api_key = api_key


def _parse_json_response(content: str):
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        # fallback: attempt to locate a JSON substring
        start = content.find('[')
        end = content.rfind(']')
        if start != -1 and end != -1:
            try:
                return json.loads(content[start:end + 1])
            except json.JSONDecodeError:
                pass
    return None


def fetch_mock_interview_questions(session_slug: str, profile) -> list[dict]:
    if not _openai_available():
        if profile:
            return _skill_based_questions(session_slug, getattr(profile, 'skills', ''), getattr(profile, 'headline', ''))
        return _sample_questions(session_slug)

    _initialize_openai()
    skill_hint = getattr(profile, 'skills', '') if profile else ''
    experience = getattr(profile, 'experience_years', 0) if profile else 0
    headline = getattr(profile, 'headline', '') if profile else ''
    location = getattr(profile, 'current_location', '') if profile else ''
    resume_info = 'Resume attached' if getattr(getattr(profile, 'resume', None), 'name', '') else 'No resume attached'
    profile_context = _profile_context(profile)

    instructions = [
        {
            'role': 'system',
            'content': 'You are an AI interview coach. Generate a set of concise and relevant interview questions for a candidate based on the assessment type and their profile details.',
        },
        {
            'role': 'user',
            'content': (
                f'Generate {DEFAULT_QUESTION_COUNT} interview questions for the assessment "{session_slug}". '
                f'The candidate profile is: {profile_context}. '
                f'Skills: {skill_hint or "not provided"}. '
                f'Experience level: {experience} years. '
                f'Location: {location or "not provided"}. '
                f'{resume_info}. '
                'Return only valid JSON in the format [{"prompt": "..."}, ...].'
            ),
        },
    ]

    response = openai.ChatCompletion.create(
        model=getattr(settings, 'OPENAI_MODEL', DEFAULT_MODEL),
        messages=instructions,
        temperature=0.8,
        max_tokens=250,
    )

    content = response.choices[0].message.content
    parsed = _parse_json_response(content)
    if isinstance(parsed, list) and all('prompt' in item for item in parsed):
        parsed = parsed[:DEFAULT_QUESTION_COUNT]
        if len(parsed) < DEFAULT_QUESTION_COUNT:
            fallback = [q for q in _sample_questions(session_slug) if q not in parsed]
            parsed.extend(fallback[:DEFAULT_QUESTION_COUNT - len(parsed)])
        return parsed

    if profile:
        return _skill_based_questions(session_slug, skill_hint, headline)
    return _sample_questions(session_slug)


def score_mock_interview_responses(session_slug: str, responses: list[dict], profile) -> dict:
    if not _openai_available():
        score = min(100, 40 + len(responses) * 18)
        feedback = 'Good work! Keep using structured responses and clear examples.'
        if responses and len(responses) < len(AI_PROMPT_SETS.get(session_slug, responses)):
            score = max(20, score - 15)
            feedback = 'Complete all questions to get the best evaluation.'
        return {
            'score': score,
            'feedback': feedback,
            'highlights': ['Try to include more concrete examples and process details.'] if not responses else [],
        }

    _initialize_openai()
    answer_payload = json.dumps(responses, ensure_ascii=False)
    instructions = [
        {
            'role': 'system',
            'content': 'You are an AI interview coach. Evaluate candidate answers and return a JSON object with score, feedback, and highlights.',
        },
        {
            'role': 'user',
            'content': (
                f'Assess the following interview answers for session "{session_slug}". '
                f'Responses: {answer_payload}. '
                'Return only JSON like {"score": 0-100, "feedback": "...", "highlights": ["..."]}.'
            ),
        },
    ]

    response = openai.ChatCompletion.create(
        model=getattr(settings, 'OPENAI_MODEL', DEFAULT_MODEL),
        messages=instructions,
        temperature=0.5,
        max_tokens=250,
    )

    content = response.choices[0].message.content
    parsed = _parse_json_response(content)
    if isinstance(parsed, dict) and 'score' in parsed and 'feedback' in parsed:
        return {
            'score': min(100, int(parsed.get('score', 0))),
            'feedback': str(parsed.get('feedback', '')), 
            'highlights': parsed.get('highlights', []) if isinstance(parsed.get('highlights', []), list) else [],
        }

    return {
        'score': 60,
        'feedback': 'Good attempt! Practice staying structured and adding more concrete examples.',
        'highlights': ['Try to include more concrete examples and process details.'],
    }
