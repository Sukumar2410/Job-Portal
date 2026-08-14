import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { API } from '../constants/api.constants';

import {
  SocialPost,
  SocialPostsResponse,
  CreatePostPayload,
  SocialCommentsResponse,
  CreateCommentPayload,
  LikeResponse
} from '../models/social.model';


@Injectable({
  providedIn: 'root'
})
export class SocialService {

  private api = inject(ApiService);


  // ==========================================================
  // POSTS
  // ==========================================================

  getPosts(page?: number): Observable<SocialPostsResponse> {

    const params = page
      ? { page }
      : undefined;

    return this.api.get<SocialPostsResponse>(
      API.SOCIAL.POSTS,
      params
    );
  }


  getPost(id: number): Observable<SocialPost> {

    return this.api.get<SocialPost>(
      API.SOCIAL.POST_DETAIL(id)
    );
  }


  createPost(
    payload: CreatePostPayload
  ): Observable<SocialPost> {

    return this.api.post<SocialPost>(
      API.SOCIAL.POSTS,
      payload
    );
  }


  deletePost(id: number): Observable<void> {

    return this.api.delete<void>(
      API.SOCIAL.POST_DETAIL(id)
    );
  }

  updatePost(
    id: number,
    payload: {
      content?: string;
      visibility?: string;
    }
  ): Observable<SocialPost> {

    return this.api.patch<SocialPost>(
      API.SOCIAL.POST_DETAIL(id),
      payload
    );
  }
  
  // ==========================================================
  // LIKES
  // ==========================================================

  likePost(id: number): Observable<LikeResponse> {

    return this.api.post<LikeResponse>(
      API.SOCIAL.LIKE(id),
      {}
    );
  }


  unlikePost(id: number): Observable<LikeResponse> {

    return this.api.delete<LikeResponse>(
      API.SOCIAL.LIKE(id)
    );
  }


  // ==========================================================
  // COMMENTS
  // ==========================================================

  getComments(
    postId: number
  ): Observable<SocialCommentsResponse> {

    return this.api.get<SocialCommentsResponse>(
      API.SOCIAL.COMMENTS(postId)
    );
  }


  createComment(
    postId: number,
    payload: CreateCommentPayload
  ): Observable<any> {

    return this.api.post(
      API.SOCIAL.COMMENTS(postId),
      payload
    );
  }

}