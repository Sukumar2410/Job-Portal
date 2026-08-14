"""
AI Matching Service - Rule-based scoring engine.

Scoring formula (out of 100):
- Skills overlap:      50 points
- Experience match:    20 points
- Location match:      15 points
- Salary alignment:    15 points

Future upgrade: Replace with NLP embeddings / ML model.
"""

from decimal import Decimal


def normalize_skills(skills_str):
    """Convert comma-separated skills to a lowercase set"""
    if not skills_str:
        return set()
    return {s.strip().lower() for s in skills_str.split(',') if s.strip()}


def score_skills(candidate_skills, job_skills):
    """Score based on skill overlap. Returns 0-50."""
    if not job_skills:
        return 25  # Neutral score if job has no listed skills
    if not candidate_skills:
        return 0

    overlap = candidate_skills & job_skills
    match_ratio = len(overlap) / len(job_skills)
    return round(match_ratio * 50, 2)


def score_experience(candidate_years, job_experience_level):
    """Score based on experience alignment. Returns 0-20."""
    level_ranges = {
        'ENTRY': (0, 2),
        'MID': (2, 5),
        'SENIOR': (5, 10),
        'LEAD': (10, 30),
    }
    min_years, max_years = level_ranges.get(job_experience_level, (0, 30))

    if min_years <= candidate_years <= max_years:
        return 20
    # Partial score if close
    if candidate_years < min_years:
        gap = min_years - candidate_years
        return max(0, 20 - (gap * 5))
    # Over-qualified
    gap = candidate_years - max_years
    return max(5, 20 - (gap * 2))


def score_location(candidate_location, job_location, work_mode):
    """Score based on location match. Returns 0-15."""
    if work_mode == 'REMOTE':
        return 15  # Location doesn't matter for remote
    if not candidate_location or not job_location:
        return 7  # Neutral

    candidate_loc = candidate_location.lower().strip()
    job_loc = job_location.lower().strip()

    if candidate_loc == job_loc:
        return 15
    # Partial match: e.g., "Bangalore" in "Bangalore, India"
    if candidate_loc in job_loc or job_loc in candidate_loc:
        return 12
    # City match on first token
    if candidate_loc.split(',')[0].strip() == job_loc.split(',')[0].strip():
        return 10
    return 3


def score_salary(candidate_expected, job_min, job_max):
    """Score based on salary alignment. Returns 0-15."""
    if not candidate_expected or (not job_min and not job_max):
        return 10  # Neutral

    candidate_expected = Decimal(candidate_expected)
    if job_min and job_max:
        if job_min <= candidate_expected <= job_max:
            return 15
        # Slightly outside
        if candidate_expected < job_min:
            diff = (job_min - candidate_expected) / job_min
            return max(0, 15 - int(diff * 30))
        # Above max
        diff = (candidate_expected - job_max) / job_max
        return max(0, 15 - int(diff * 30))
    return 8


def calculate_match_score(candidate, job):
    """
    Compute match score between a candidate and a job.
    Returns dict with total and breakdown.
    """
    profile = getattr(candidate, 'candidate_profile', None)
    if not profile:
        return {
            'total_score': 0,
            'breakdown': {'skills': 0, 'experience': 0, 'location': 0, 'salary': 0},
            'matched_skills': [],
            'missing_skills': [],
        }

    candidate_skills = normalize_skills(profile.skills)
    job_skills = normalize_skills(job.skills_required)

    skills_pts = score_skills(candidate_skills, job_skills)
    exp_pts = score_experience(profile.experience_years, job.experience_level)
    loc_pts = score_location(profile.current_location, job.location, job.work_mode)
    salary_pts = score_salary(profile.expected_salary, job.min_salary, job.max_salary)

    total = round(skills_pts + exp_pts + loc_pts + salary_pts, 2)

    matched = list(candidate_skills & job_skills)
    missing = list(job_skills - candidate_skills)

    return {
        'total_score': total,
        'breakdown': {
            'skills': skills_pts,
            'experience': exp_pts,
            'location': loc_pts,
            'salary': salary_pts,
        },
        'matched_skills': matched,
        'missing_skills': missing,
    }