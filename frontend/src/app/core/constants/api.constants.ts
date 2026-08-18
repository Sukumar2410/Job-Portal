const BASE_URL = 'http://127.0.0.1:8000/api';

export const API = {
  // Auth
  AUTH: {
    REGISTER: `${BASE_URL}/auth/register/`,
    LOGIN: `${BASE_URL}/auth/login/`,
    LOGOUT: `${BASE_URL}/auth/logout/`,
    REFRESH: `${BASE_URL}/auth/token/refresh/`,
    ME: `${BASE_URL}/auth/me/`,
    CHANGE_PASSWORD: `${BASE_URL}/auth/change-password/`,
    CANDIDATE_PROFILE: `${BASE_URL}/auth/candidate-profile/`,
    HR_PROFILE: `${BASE_URL}/auth/hr-profile/`,
    UPLOAD_RESUME: `${BASE_URL}/auth/upload-resume/`,
    DELETE_RESUME: `${BASE_URL}/auth/delete-resume/`,
    VERIFY_EMAIL: `${BASE_URL}/auth/verify-email/`,
    RESEND_VERIFICATION: `${BASE_URL}/auth/resend-verification/`,
    FORGOT_PASSWORD: `${BASE_URL}/auth/forgot-password/`,
    RESET_PASSWORD: `${BASE_URL}/auth/reset-password/`,

    // Admin user management (NEW)
    ADMIN_USERS: `${BASE_URL}/auth/admin/users/`,
    ADMIN_USER_DETAIL: (id: number) => `${BASE_URL}/auth/admin/users/${id}/`,
    ADMIN_USER_ACTIVATE: (id: number) => `${BASE_URL}/auth/admin/users/${id}/activate/`,
    ADMIN_USER_DEACTIVATE: (id: number) => `${BASE_URL}/auth/admin/users/${id}/deactivate/`,
    ADMIN_USER_VERIFY: (id: number) => `${BASE_URL}/auth/admin/users/${id}/verify/`,
  },

  // Companies
  COMPANIES: {
    LIST: `${BASE_URL}/companies/`,
    MY_COMPANY: `${BASE_URL}/companies/my-company/`,
    DETAIL: (slug: string) => `${BASE_URL}/companies/${slug}/`,
    VERIFY: (slug: string) => `${BASE_URL}/companies/${slug}/verify/`,
    UNVERIFY: (slug: string) => `${BASE_URL}/companies/${slug}/unverify/`,
    ADMIN_DETAILS: (slug: string) => `/api/companies/${slug}/admin-details/`,
    ALL: `${BASE_URL}/companies/all/`,
  },

  // Jobs
  JOBS: {
    LIST: `${BASE_URL}/jobs/`,
    DETAIL: (slug: string) => `${BASE_URL}/jobs/${slug}/`,
    SAVE: (slug: string) => `${BASE_URL}/jobs/${slug}/save/`,
    UNSAVE: (slug: string) => `${BASE_URL}/jobs/${slug}/unsave/`,
    SAVED: `${BASE_URL}/jobs/saved/`,
    ACTIVATE: (slug: string) => `${BASE_URL}/jobs/${slug}/activate/`,
    PAUSE: (slug: string) => `${BASE_URL}/jobs/${slug}/pause/`,
    CLOSE: (slug: string) => `${BASE_URL}/jobs/${slug}/close/`,
  },

  // Applications
  APPLICATIONS: {
    LIST: `${BASE_URL}/applications/`,
    DETAIL: (id: number) => `${BASE_URL}/applications/${id}/`,
    MY_APPLICATIONS: `${BASE_URL}/applications/my-applications/`,
    WITHDRAW: (id: number) => `${BASE_URL}/applications/${id}/withdraw/`,
    UPDATE_STATUS: (id: number) => `${BASE_URL}/applications/${id}/update-status/`,
    ADD_NOTE: (id: number) => `${BASE_URL}/applications/${id}/add-note/`,
    DOWNLOAD_RESUME: (id: number) => `${BASE_URL}/applications/${id}/download-resume/`,
    RESUMES_FOR_JOB: (jobId: number) => `${BASE_URL}/applications/resumes-for-job/${jobId}/`,
    INTERVIEWS: `${BASE_URL}/applications/interviews/`,
  },

  // Analytics
  ANALYTICS: {
    CANDIDATE_DASHBOARD: `${BASE_URL}/analytics/candidate-dashboard/`,
    HR_DASHBOARD: `${BASE_URL}/analytics/hr-dashboard/`,
    ADMIN_DASHBOARD: `${BASE_URL}/analytics/super-admin-dashboard/`,
  },

  // AI Matching
  AI: {
    MATCH_SCORE: (jobId: number) => `${BASE_URL}/ai/match-score/${jobId}/`,
    RECOMMENDED_JOBS: `${BASE_URL}/ai/recommended-jobs/`,
    TOP_CANDIDATES: (jobId: number) => `${BASE_URL}/ai/top-candidates/${jobId}/`,
    MOCK_INTERVIEW_QUESTIONS: (sessionSlug: string) => `${BASE_URL}/ai/mock-interview/${sessionSlug}/questions/`,
    MOCK_INTERVIEW_EVALUATE: (sessionSlug: string) => `${BASE_URL}/ai/mock-interview/${sessionSlug}/evaluate/`,
  },

  // AI Career Coach
  AI_COACH: {
    CHAT: `${BASE_URL}/ai-coach/chat/`,
    RESUME_REVIEW: `${BASE_URL}/ai-coach/resume-review/`,
    CONVERSATIONS: `${BASE_URL}/ai-coach/conversations/`,

    CONVERSATION_DETAIL: (id: number) =>
      `${BASE_URL}/ai-coach/conversations/${id}/`,

    UPDATE_TITLE: (id: number) =>
      `${BASE_URL}/ai-coach/conversations/${id}/title/`,

    DELETE_CONVERSATION: (id: number) =>
      `${BASE_URL}/ai-coach/conversations/${id}/delete/`,
  },

  // Payments
  PAYMENTS: {
    PLANS: `${BASE_URL}/payments/plans/`,
    PLAN_DETAIL: (id: number) => `${BASE_URL}/payments/plans/${id}/`,
    SUBSCRIPTIONS: `${BASE_URL}/payments/subscriptions/`,
    PAYMENTS: `${BASE_URL}/payments/payments/`,
    PAYMENT_REFUND: (id: number) => `${BASE_URL}/payments/payments/${id}/refund/`,
    CREATE_ORDER: `${BASE_URL}/payments/create-order/`,
    VERIFY_PAYMENT: `${BASE_URL}/payments/verify-payment/`,
    MY_SUBSCRIPTION: `${BASE_URL}/payments/my-subscription/`,
    REVENUE: `${BASE_URL}/payments/revenue/`,
    COUPONS: `${BASE_URL}/payments/coupons/`,
    COUPON_DETAIL: (id: number) => `${BASE_URL}/payments/coupons/${id}/`,
    COUPON_VALIDATE: `${BASE_URL}/payments/coupons/validate/`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: `${BASE_URL}/notifications/`,
    UNREAD_COUNT: `${BASE_URL}/notifications/unread-count/`,
    MARK_READ: (id: number) => `${BASE_URL}/notifications/${id}/mark-read/`,
    MARK_ALL_READ: `${BASE_URL}/notifications/mark-all-read/`,
    DELETE: (id: number) => `${BASE_URL}/notifications/${id}/delete/`,
    BROADCAST: `${BASE_URL}/notifications/broadcast/`,
  },

  // Audit Logs
  AUDIT: {
    LIST: `${BASE_URL}/audit-logs/`,
    STATS: `${BASE_URL}/audit-logs/stats/`,
    ACTIONS: `${BASE_URL}/audit-logs/actions/`,
  },

 // Social
  SOCIAL: {

    POSTS: `${BASE_URL}/social/posts/`,

    POST_DETAIL: (id: number) =>
      `${BASE_URL}/social/posts/${id}/`,

    LIKE: (id: number) =>
      `${BASE_URL}/social/posts/${id}/like/`,

    COMMENTS: (postId: number) =>
      `${BASE_URL}/social/posts/${postId}/comments/`,

  },

  // Messaging
  MESSAGING: {

    CONVERSATIONS:
      `${BASE_URL}/messaging/conversations/`,

    CONVERSATION_DETAIL: (id: number) =>
      `${BASE_URL}/messaging/conversations/${id}/`,

    USERS: `${BASE_URL}/messaging/conversations/users/`,

    MESSAGES: (id: number) =>
      `${BASE_URL}/messaging/conversations/${id}/messages/`,

    MARK_AS_READ: (id: number) =>
      `${BASE_URL}/messaging/conversations/${id}/read/`,
  },

  // Search
  SEARCH: `${BASE_URL}/search/`,
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
};