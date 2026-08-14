export interface SocialPost {
  id: number;

  author_id: number;
  author_name: string;
  author_email: string;

  content: string;
  image_url: string | null;
  video_url: string | null;

  visibility: string;

  likes_count: number;
  comments_count: number;

  is_liked: boolean;

  created_at: string;
  updated_at: string;
}


export interface SocialPostsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SocialPost[];
}


export interface CreatePostPayload {
  content: string;
  image_url?: string | null;
  visibility?: string;
}


export interface SocialComment {
  id: number;

  author_id: number;
  author_name: string;
  author_email: string;

  content: string;

  created_at: string;
  updated_at?: string;
}


export type SocialCommentsResponse = SocialComment[];


export interface CreateCommentPayload {
  content: string;
}


export interface LikeResponse {
  message: string;
  liked: boolean;
  likes_count: number;
}