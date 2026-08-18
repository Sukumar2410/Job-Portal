import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { TopNavComponent } from '../shared/top-nav/top-nav.component';

import { SocialService } from '../core/services/social.service';
import { AuthService } from '../core/services/auth.service';

import {
  SocialPost,
  SocialComment
} from '../core/models/social.model';


@Component({
  selector: 'app-social-feed',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TopNavComponent
  ],

  template: `

    <app-top-nav></app-top-nav>


    <main class="social-page">


      <!-- ==========================================
           PAGE HEADER
      =========================================== -->

      <section class="page-header">

        <div>

          <h1>
            Community
          </h1>

          <p>
            Connect, share and discover opportunities
            with professionals.
          </p>

        </div>


        <a
          routerLink="/candidate-dashboard"
          class="back-button"
        >
          ← Back to Dashboard
        </a>

      </section>



      <!-- ==========================================
          CREATE POST
      =========================================== -->

      <section class="create-post-card">

        <div class="create-post-header">

          <div class="avatar">
            👤
          </div>

          <div>

            <h2>
              Create a post
            </h2>

            <p>
              Share something with the community
            </p>

          </div>

        </div>


        <textarea
          [(ngModel)]="newPostContent"
          rows="4"
          maxlength="5000"
          placeholder="What's on your mind?"
          class="post-input"
        ></textarea>



        <!-- ==========================================
            MEDIA PREVIEW
        =========================================== -->

        <div
          *ngIf="imagePreviewUrl() || videoPreviewUrl()"
          class="media-preview-section"
        >


          <!-- IMAGE -->

          <div
            *ngIf="imagePreviewUrl()"
            class="media-preview image-preview"
          >

            <img
              [src]="imagePreviewUrl()!"
              alt="Selected image"
            />

            <button
              type="button"
              class="remove-media-button"
              (click)="clearSelectedImage(imageInput)"
              aria-label="Remove image"
            >
              ×
            </button>

          </div>



          <!-- VIDEO -->

          <div
            *ngIf="videoPreviewUrl()"
            class="media-preview video-preview"
          >

            <video
              [src]="videoPreviewUrl()!"
              controls
              preload="metadata"
            >
              Your browser does not support video playback.
            </video>

            <button
              type="button"
              class="remove-media-button"
              (click)="clearSelectedVideo(videoInput)"
              aria-label="Remove video"
            >
              ×
            </button>

          </div>

        </div>



        <!-- ==========================================
            MEDIA ACTIONS
        =========================================== -->

        <div class="media-actions">

          <label
            for="post-image-input"
            class="media-button"
          >
            📷
            <span>
              Photo
            </span>
          </label>


          <input
            #imageInput
            id="post-image-input"
            type="file"
            accept="image/*"
            hidden
            (change)="onImageSelected($event)"
          />



          <label
            for="post-video-input"
            class="media-button"
          >
            🎥
            <span>
              Video
            </span>
          </label>


          <input
            #videoInput
            id="post-video-input"
            type="file"
            accept="video/*"
            hidden
            (change)="onVideoSelected($event)"
          />



          <span
            *ngIf="selectedImage()"
            class="selected-file"
          >
            📷 {{ selectedImage()?.name }}
          </span>


          <span
            *ngIf="selectedVideo()"
            class="selected-file"
          >
            🎥 {{ selectedVideo()?.name }}
          </span>

        </div>



        <!-- ==========================================
            POST ACTIONS
        =========================================== -->

        <div class="create-post-actions">

          <span class="visibility-label">
            🌍 Public
          </span>


          <button
            type="button"
            class="post-button"
            (click)="createPost(imageInput, videoInput)"
            [disabled]="
              posting() ||
              !newPostContent.trim()
            "
          >

            {{
              posting()
                ? 'Publishing...'
                : 'Post'
            }}

          </button>

        </div>

      </section>


      <!-- ==========================================
           LOADING
      =========================================== -->

      <section
        *ngIf="loading()"
        class="state-card"
      >

        <div class="loading-spinner"></div>

        <h3>
          Loading community posts...
        </h3>

        <p>
          Please wait while we fetch the latest posts.
        </p>

      </section>



      <!-- ==========================================
           ERROR
      =========================================== -->

      <section
        *ngIf="!loading() && error()"
        class="state-card error-state"
      >

        <div class="state-icon">
          ⚠️
        </div>

        <h3>
          Unable to load posts
        </h3>

        <p>
          {{ error() }}
        </p>

        <button
          type="button"
          class="retry-button"
          (click)="loadPosts()"
        >
          Try Again
        </button>

      </section>



      <!-- ==========================================
           EMPTY STATE
      =========================================== -->

      <section
        *ngIf="
          !loading() &&
          !error() &&
          posts().length === 0
        "
        class="state-card"
      >

        <div class="state-icon">
          📝
        </div>

        <h3>
          No posts yet
        </h3>

        <p>
          Be the first person to share something
          with the community.
        </p>

      </section>



      <!-- ==========================================
           FEED
      =========================================== -->

      <section
        *ngIf="
          !loading() &&
          !error() &&
          posts().length > 0
        "
        class="feed"
      >


        <article
          *ngFor="let post of posts()"
          class="post-card"
        >


          <!-- ==========================================
               POST HEADER
          =========================================== -->

          <div class="post-header">


            <div class="author-section">

              <div class="author-avatar">

                {{ getInitial(post.author_name) }}

              </div>


              <div>

                <h3>
                  {{ post.author_name }}
                </h3>

                <p>
                  {{ post.author_email }}
                </p>

                <span>
                  {{ formatDate(post.created_at) }}
                </span>

              </div>

            </div>


            <!-- ==========================================
                 POST MENU
            =========================================== -->

            <div
              *ngIf="isPostOwner(post)"
              class="post-menu-container"
            >

              <button
                type="button"
                class="post-menu-button"
                (click)="togglePostMenu(post.id)"
                aria-label="Post options"
              >
                ⋮
              </button>


              <div
                *ngIf="openPostMenuId() === post.id"
                class="post-menu"
              >

                <button
                  type="button"
                  class="post-menu-item edit-item"
                  (click)="startEdit(post)"
                >
                  ✏️ Edit Post
                </button>


                <button
                  type="button"
                  class="post-menu-item delete-item"
                  (click)="confirmDelete(post)"
                >
                  🗑️ Delete Post
                </button>

              </div>

            </div>

          </div>



          <!-- ==========================================
               EDIT POST
          =========================================== -->

          <div
            *ngIf="editingPostId() === post.id"
            class="edit-post-section"
          >

            <!-- EDIT HEADER -->

            <div class="edit-post-header">

              <div class="edit-post-icon">
                ✏️
              </div>

              <div class="edit-post-heading">

                <h4>
                  Edit your post
                </h4>

                <p>
                  Make changes to your post below.
                </p>

              </div>

            </div>


            <!-- EDITOR -->

            <div class="edit-post-editor">

              <textarea
                [(ngModel)]="editPostContent"
                class="edit-post-textarea"
                rows="6"
                maxlength="5000"
                placeholder="Write something..."
              ></textarea>


              <div class="edit-post-footer">

                <span class="edit-character-hint">
                  You can update your post content before saving.
                </span>

                <span class="edit-character-count">
                  {{ editPostContent.length }}/5000
                </span>

              </div>

            </div>


            <!-- ACTIONS -->

            <div class="edit-post-actions">

              <button
                type="button"
                class="cancel-edit-button"
                (click)="cancelEdit()"
              >
                Cancel
              </button>


              <button
                type="button"
                class="save-edit-button"
                (click)="saveEdit(post)"
                [disabled]="!editPostContent.trim()"
              >
                💾 Save Changes
              </button>

            </div>

          </div>



          <!-- ==========================================
               NORMAL POST CONTENT
          =========================================== -->

          <div
            *ngIf="editingPostId() !== post.id"
            class="post-content"
          >

            <p>
              {{ post.content }}
            </p>


            <img
              *ngIf="post.image_url"
              [src]="post.image_url"
              alt="Post image"
              class="post-image"
            />

            <video
              *ngIf="post.video_url;"
              [src]="post.video_url"
              class="post-video"
              controls
              preload="metadata"
            >
              Your browser does not support video playback.
            </video>

          </div>



          <!-- ==========================================
               DELETE CONFIRMATION
          =========================================== -->

          <div
            *ngIf="deletePostId() === post.id"
            class="delete-confirmation"
          >

            <div class="delete-confirmation-icon">
              🗑️
            </div>


            <div class="delete-confirmation-content">

              <h4>
                Delete this post?
              </h4>

              <p>
                This action cannot be undone.
              </p>

            </div>


            <div class="delete-confirmation-actions">

              <button
                type="button"
                class="cancel-delete-button"
                (click)="cancelDelete()"
                [disabled]="deletingPost()"
              >
                Cancel
              </button>


              <button
                type="button"
                class="confirm-delete-button"
                (click)="deletePost(post)"
                [disabled]="deletingPost()"
              >

                {{
                  deletingPost()
                    ? 'Deleting...'
                    : 'Delete'
                }}

              </button>

            </div>

          </div>



          <!-- ==========================================
               POST STATS
          =========================================== -->

          <div
            *ngIf="editingPostId() !== post.id"
            class="post-stats"
          >

            <span>

              ❤️ {{ post.likes_count }}

              {{
                post.likes_count === 1
                  ? 'Like'
                  : 'Likes'
              }}

            </span>


            <span>

              💬 {{ post.comments_count }}

              {{
                post.comments_count === 1
                  ? 'Comment'
                  : 'Comments'
              }}

            </span>

          </div>



          <!-- ==========================================
               POST ACTIONS
          =========================================== -->

          <div
            *ngIf="editingPostId() !== post.id"
            class="post-actions"
          >

            <button
              type="button"
              [class.liked]="post.is_liked"
              (click)="toggleLike(post)"
            >

              {{
                post.is_liked
                  ? '❤️ Unlike'
                  : '♡ Like'
              }}

            </button>


            <button
              type="button"
              (click)="openComments(post)"
            >

              💬 Comment

            </button>

          </div>



          <!-- ==========================================
               COMMENTS SECTION
          =========================================== -->

          <div
            *ngIf="
              openCommentPostId() === post.id &&
              editingPostId() !== post.id
            "
            class="comments-section"
          >


            <!-- ========================================
                 NEW COMMENT INPUT
            ========================================= -->

            <div class="comment-composer">

              <div class="comment-composer-avatar">

                {{ getInitial('User') }}

              </div>


              <div class="comment-composer-content">

                <div class="comment-composer-label">

                  <strong>
                    Add a comment
                  </strong>

                  <span>
                    Share your thoughts with the community
                  </span>

                </div>


                <div class="comment-composer-row">

                  <input
                    type="text"
                    class="comment-input-field"
                    placeholder="Write a comment..."
                    [value]="
                      newComment()[post.id] || ''
                    "
                    (input)="
                      onCommentInput(post.id, $event)
                    "
                    (keyup.enter)="
                      submitComment(post.id)
                    "
                  />


                  <button
                    type="button"
                    class="comment-submit-button"
                    (click)="submitComment(post.id)"
                    [disabled]="
                      !(
                        newComment()[post.id] || ''
                      ).trim()
                    "
                  >
                    💬 Post Comment
                  </button>

                </div>

              </div>

            </div>



            <!-- ========================================
                 COMMENTS LOADING
            ========================================= -->

            <div
              *ngIf="isCommentsLoading(post.id)"
              class="comments-loading"
            >

              Loading comments...

            </div>



            <!-- ========================================
                 NO COMMENTS
            ========================================= -->

            <div
              *ngIf="
                !isCommentsLoading(post.id) &&
                getPostComments(post.id).length === 0
              "
              class="no-comments"
            >

              No comments yet.
              Be the first to comment!

            </div>



            <!-- ========================================
                 EXISTING COMMENTS
            ========================================= -->

            <div
              *ngIf="
                !isCommentsLoading(post.id) &&
                getPostComments(post.id).length > 0
              "
              class="comments-list"
            >


              <div
                *ngFor="
                  let comment
                  of getPostComments(post.id)
                "
                class="comment-item"
              >


                <div class="comment-avatar">

                  {{ getInitial(comment.author_name) }}

                </div>


                <div class="comment-body">

                  <div class="comment-author">

                    {{ comment.author_name }}

                  </div>


                  <div class="comment-email">

                    {{ comment.author_email }}

                  </div>


                  <div class="comment-content">

                    {{ comment.content }}

                  </div>


                  <div class="comment-date">

                    {{ formatDate(comment.created_at) }}

                  </div>

                </div>

              </div>

            </div>

          </div>


        </article>


      </section>


    </main>

  `,

  styleUrl: './social-feed.component.scss'
})


export class SocialFeedComponent implements OnInit, OnDestroy {


  // ==========================================================
  // SERVICES
  // ==========================================================

  private socialService = inject(SocialService);

  private authService = inject(AuthService);



  // ==========================================================
  // POSTS STATE
  // ==========================================================

  posts = signal<SocialPost[]>([]);

  loading = signal<boolean>(true);

  error = signal<string | null>(null);

  posting = signal<boolean>(false);



  // ==========================================================
  // CREATE POST
  // ==========================================================

  newPostContent = '';

  selectedImage = signal<File | null>(null);

  selectedVideo = signal<File | null>(null);

  imagePreviewUrl = signal<string | null>(null);

  videoPreviewUrl = signal<string | null>(null);

  // ==========================================================
  // EDIT POST STATE
  // ==========================================================

  editingPostId = signal<number | null>(null);

  editPostContent = '';

  updatingPost = signal<boolean>(false);



  // ==========================================================
  // DELETE POST STATE
  // ==========================================================

  deletePostId = signal<number | null>(null);

  deletingPost = signal<boolean>(false);



  // ==========================================================
  // POST MENU STATE
  // ==========================================================

  openPostMenuId = signal<number | null>(null);



  // ==========================================================
  // COMMENTS STATE
  // ==========================================================

  comments = signal<Record<number, SocialComment[]>>({});

  commentsLoading =
    signal<Record<number, boolean>>({});

  openCommentPostId =
    signal<number | null>(null);



  // ==========================================================
  // NEW COMMENT STATE
  // ==========================================================

  newComment =
    signal<Record<number, string>>({});



  // ==========================================================
  // INITIALIZATION
  // ==========================================================

  ngOnInit(): void {

    this.loadPosts();

  }



  // ==========================================================
  // LOAD POSTS
  // ==========================================================

  loadPosts(): void {

    this.loading.set(true);

    this.error.set(null);


    this.socialService.getPosts().subscribe({

      next: (response) => {

        this.posts.set(response.results);

      },


      error: (error) => {

        console.error(
          'Unable to load community posts:',
          error
        );

        this.error.set(
          'Unable to load community posts.'
        );

      },


      complete: () => {

        this.loading.set(false);

      }

    });

  }



  // ==========================================================
  // CREATE POST
  // ==========================================================

  createPost(
    imageInput?: HTMLInputElement,
    videoInput?: HTMLInputElement
  ): void {

    const content =
      this.newPostContent.trim();


    if (!content) {

      return;

    }


    this.posting.set(true);


    this.socialService.createPost({

      content: content,

      visibility: 'PUBLIC',

      image: this.selectedImage(),

      video: this.selectedVideo()

    }).subscribe({

      next: (createdPost) => {

        this.posts.update(
          currentPosts => [
            createdPost,
            ...currentPosts
          ]
        );


        this.newPostContent = '';

        // Clear selected media
        this.clearSelectedImage(imageInput);

        this.clearSelectedVideo(videoInput);

      },

      error: (error) => {

        console.error(
          'Unable to create post:',
          error
        );

      },


      complete: () => {

        this.posting.set(false);

      }

    });

  }

  // ==========================================================
  // SELECT IMAGE
  // ==========================================================

  onImageSelected(event: Event): void {

    const input =
      event.target as HTMLInputElement;


    if (!input.files || input.files.length === 0) {

      return;

    }


    const file = input.files[0];


    this.selectedImage.set(file);


    // Remove previous preview URL
    const previousUrl =
      this.imagePreviewUrl();

    if (previousUrl) {

      URL.revokeObjectURL(previousUrl);

    }


    // Create temporary browser preview URL
    const previewUrl =
      URL.createObjectURL(file);


    this.imagePreviewUrl.set(previewUrl);

  }

  // ==========================================================
  // SELECT VIDEO
  // ==========================================================

  onVideoSelected(event: Event): void {

    const input =
      event.target as HTMLInputElement;


    if (!input.files || input.files.length === 0) {

      return;

    }


    const file = input.files[0];


    this.selectedVideo.set(file);


    // Remove previous preview URL
    const previousUrl =
      this.videoPreviewUrl();

    if (previousUrl) {

      URL.revokeObjectURL(previousUrl);

    }


    // Create temporary browser preview URL
    const previewUrl =
      URL.createObjectURL(file);


    this.videoPreviewUrl.set(previewUrl);

  }

  // ==========================================================
  // REMOVE SELECTED IMAGE
  // ==========================================================

  clearSelectedImage(
    input?: HTMLInputElement
  ): void {

    const previewUrl =
      this.imagePreviewUrl();


    if (previewUrl) {

      URL.revokeObjectURL(previewUrl);

    }


    this.selectedImage.set(null);

    this.imagePreviewUrl.set(null);


    if (input) {

      input.value = '';

    }

  }

  // ==========================================================
  // REMOVE SELECTED VIDEO
  // ==========================================================

  clearSelectedVideo(
    input?: HTMLInputElement
  ): void {

    const previewUrl =
      this.videoPreviewUrl();


    if (previewUrl) {

      URL.revokeObjectURL(previewUrl);

    }


    this.selectedVideo.set(null);

    this.videoPreviewUrl.set(null);


    if (input) {

      input.value = '';

    }

  }

  // ==========================================================
  // COMPONENT CLEANUP
  // ==========================================================

  ngOnDestroy(): void {

    const imageUrl =
      this.imagePreviewUrl();

    const videoUrl =
      this.videoPreviewUrl();


    if (imageUrl) {

      URL.revokeObjectURL(imageUrl);

    }


    if (videoUrl) {

      URL.revokeObjectURL(videoUrl);

    }

  }


  // ==========================================================
  // CHECK POST OWNER
  // ==========================================================

  isPostOwner(post: SocialPost): boolean {

    const user =
      this.authService.currentUser();

    if (!user) {

      return false;

    }

    return Number(user.id) === Number(post.author_id);

  }



  // ==========================================================
  // TOGGLE POST MENU
  // ==========================================================

  togglePostMenu(postId: number): void {

    if (this.openPostMenuId() === postId) {

      this.openPostMenuId.set(null);

      return;

    }

    this.openPostMenuId.set(postId);

  }



  // ==========================================================
  // START EDIT
  // ==========================================================

  startEdit(post: SocialPost): void {

    if (!this.isPostOwner(post)) {

      return;

    }


    this.editingPostId.set(post.id);

    this.editPostContent = post.content;

    this.openPostMenuId.set(null);

    this.deletePostId.set(null);

    this.openCommentPostId.set(null);

  }



  // ==========================================================
  // CANCEL EDIT
  // ==========================================================

  cancelEdit(): void {

    this.editingPostId.set(null);

    this.editPostContent = '';

    this.updatingPost.set(false);

  }



  // ==========================================================
  // SAVE EDIT
  // ==========================================================

  saveEdit(post: SocialPost): void {

    if (!this.isPostOwner(post)) {

      return;

    }


    const content =
      this.editPostContent.trim();


    if (!content) {

      return;

    }


    this.updatingPost.set(true);


    this.socialService
      .updatePost(
        post.id,
        {
          content: content
        }
      )
      .subscribe({

        next: (updatedPost) => {

          this.posts.update(

            currentPosts =>

              currentPosts.map(

                currentPost =>

                  currentPost.id === post.id
                    ? {
                        ...currentPost,
                        ...updatedPost,
                        content:
                          updatedPost.content
                      }
                    : currentPost

              )

          );


          this.editingPostId.set(null);

          this.editPostContent = '';

        },


        error: (error) => {

          console.error(
            'Unable to update post:',
            error
          );

        },


        complete: () => {

          this.updatingPost.set(false);

        }

      });

  }



  // ==========================================================
  // CONFIRM DELETE
  // ==========================================================

  confirmDelete(post: SocialPost): void {

    if (!this.isPostOwner(post)) {

      return;

    }


    this.openPostMenuId.set(null);

    this.editingPostId.set(null);

    this.editPostContent = '';

    this.deletePostId.set(post.id);

    this.openCommentPostId.set(null);

  }



  // ==========================================================
  // CANCEL DELETE
  // ==========================================================

  cancelDelete(): void {

    this.deletePostId.set(null);

    this.deletingPost.set(false);

  }



  // ==========================================================
  // DELETE POST
  // ==========================================================

  deletePost(post: SocialPost): void {

    if (!this.isPostOwner(post)) {

      return;

    }


    this.deletingPost.set(true);


    this.socialService
      .deletePost(post.id)
      .subscribe({

        next: () => {

          this.posts.update(

            currentPosts =>

              currentPosts.filter(
                currentPost =>
                  currentPost.id !== post.id
              )

          );


          this.deletePostId.set(null);

        },


        error: (error) => {

          console.error(
            'Unable to delete post:',
            error
          );

        },


        complete: () => {

          this.deletingPost.set(false);

        }

      });

  }



  // ==========================================================
  // LIKE / UNLIKE
  // ==========================================================

  toggleLike(post: SocialPost): void {

    if (post.is_liked) {

      this.socialService
        .unlikePost(post.id)
        .subscribe({

          next: (response) => {

            this.posts.update(

              currentPosts =>

                currentPosts.map(

                  currentPost =>

                    currentPost.id === post.id
                      ? {
                          ...currentPost,

                          is_liked:
                            response.liked,

                          likes_count:
                            response.likes_count
                        }

                      : currentPost

                )

            );

          },


          error: (error) => {

            console.error(
              'Unable to unlike post:',
              error
            );

          }

        });


      return;

    }



    this.socialService
      .likePost(post.id)
      .subscribe({

        next: (response) => {

          this.posts.update(

            currentPosts =>

              currentPosts.map(

                currentPost =>

                  currentPost.id === post.id
                    ? {
                        ...currentPost,

                        is_liked:
                          response.liked,

                        likes_count:
                          response.likes_count
                      }

                    : currentPost

              )

          );

        },


        error: (error) => {

          console.error(
            'Unable to like post:',
            error
          );

        }

      });

  }



  // ==========================================================
  // OPEN COMMENTS
  // ==========================================================

  openComments(post: SocialPost): void {

    if (
      this.openCommentPostId() === post.id
    ) {

      this.openCommentPostId.set(null);

      return;

    }


    this.openCommentPostId.set(post.id);

    this.loadComments(post.id);

  }



  // ==========================================================
  // LOAD COMMENTS
  // ==========================================================

  loadComments(postId: number): void {

    this.commentsLoading.set({

      ...this.commentsLoading(),

      [postId]: true

    });


    this.socialService
      .getComments(postId)
      .subscribe({

        next: (response) => {

          this.comments.set({

            ...this.comments(),

            [postId]:
              response

          });

        },


        error: (error) => {

          console.error(
            'Unable to load comments:',
            error
          );


          this.comments.set({

            ...this.comments(),

            [postId]: []

          });

        },


        complete: () => {

          this.commentsLoading.set({

            ...this.commentsLoading(),

            [postId]: false

          });

        }

      });

  }



  // ==========================================================
  // CHECK COMMENT LOADING
  // ==========================================================

  isCommentsLoading(
    postId: number
  ): boolean {

    return this.commentsLoading()[postId] ?? false;

  }



  // ==========================================================
  // GET COMMENTS FOR POST
  // ==========================================================

  getPostComments(
    postId: number
  ): SocialComment[] {

    return this.comments()[postId] ?? [];

  }



  // ==========================================================
  // HANDLE COMMENT INPUT
  // ==========================================================

  onCommentInput(
    postId: number,
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;


    this.newComment.set({

      ...this.newComment(),

      [postId]:
        input.value

    });

  }



  // ==========================================================
  // SUBMIT COMMENT
  // ==========================================================

  submitComment(
    postId: number
  ): void {

    const content =
      (
        this.newComment()[postId] || ''
      ).trim();


    if (!content) {

      return;

    }


    this.socialService
      .createComment(
        postId,
        {
          content: content
        }
      )
      .subscribe({

        next: (comment) => {

          const existingComments =
            this.comments()[postId] ?? [];


          this.comments.set({

            ...this.comments(),

            [postId]: [
              ...existingComments,
              comment
            ]

          });


          this.newComment.set({

            ...this.newComment(),

            [postId]: ''

          });


          this.posts.update(

            currentPosts =>

              currentPosts.map(

                currentPost =>

                  currentPost.id === postId
                    ? {
                        ...currentPost,

                        comments_count:
                          currentPost.comments_count + 1

                      }
                    : currentPost

              )

          );

        },


        error: (error) => {

          console.error(
            'Unable to create comment:',
            error
          );

        }

      });

  }



  // ==========================================================
  // GET INITIAL
  // ==========================================================

  getInitial(
    name: string
  ): string {

    if (!name) {

      return '?';

    }


    return name
      .charAt(0)
      .toUpperCase();

  }



  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  formatDate(
    date: string
  ): string {

    if (!date) {

      return '';

    }


    return new Date(date)
      .toLocaleString(
        'en-IN',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }
      );

  }

}