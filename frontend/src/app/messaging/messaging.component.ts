import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ViewChild,
  ElementRef
} from '@angular/core';

import {
  Subscription,
  interval
} from 'rxjs';

import {
  CommonModule
} from '@angular/common';

import { Router } from '@angular/router';

import {
  FormsModule
} from '@angular/forms';

import {
  MessagingService
} from '../core/services/messaging.service';

import { AuthService } from '../core/services/auth.service';

import { HttpErrorResponse } from '@angular/common/http';

import {
  Conversation,
  Message,
  MessagingUser
} from '../core/models/messaging.model';


@Component({
  selector: 'app-messaging',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './messaging.component.html',

  styleUrl: './messaging.component.scss'
})
export class MessagingComponent implements OnInit, OnDestroy {

  // ==========================================================
  // SERVICES
  // ==========================================================

  private messagingService = inject(MessagingService);

  private router = inject(Router);
  private auth = inject(AuthService);

  private messagePollingSubscription?: Subscription;

  private conversationPollingSubscription?: Subscription;

  @ViewChild('messagesContainer')
  messagesContainer?: ElementRef<HTMLDivElement>;


  // ==========================================================
  // STATE
  // ==========================================================

  conversations = signal<Conversation[]>([]);

  selectedConversation = signal<Conversation | null>(null);

  messages = signal<Message[]>([]);

  newMessage = signal('');

  newMessagesAvailable = signal(false);

  loadingConversations = signal(false);

  loadingMessages = signal(false);

  sendingMessage = signal(false);

  error = signal('');

  messagesError = signal('');

  currentUserId = signal<number | null>(null);

  showNewConversation = signal(false);

  availableUsers = signal<MessagingUser[]>([]);

  userSearch = signal('');

  selectedUserId = signal<number | null>(null);

  loadingUsers = signal(false);

  creatingConversation = signal(false);

  userRoleFilter = signal<string>('');

  goToDashboard(): void {
    this.router.navigate([
      this.auth.getDashboardRoute()
    ]);
  }


  // ==========================================================
  // LIFECYCLE
  // ==========================================================

  ngOnInit(): void {

    this.loadCurrentUser();

    this.loadConversations();

    this.startConversationPolling();
  }

  ngOnDestroy(): void {

    this.stopMessagePolling();

    this.stopConversationPolling();
  }


  // ==========================================================
  // CURRENT USER
  // ==========================================================

  private loadCurrentUser(): void {

    try {

      const storedUser =
        localStorage.getItem('user');

      if (!storedUser) {
        return;
      }

      const user = JSON.parse(storedUser);

      if (user?.id) {

        this.currentUserId.set(
          Number(user.id)
        );

      }

    } catch (error) {

      console.error(
        'Unable to read current user:',
        error
      );

    }
  }

  private isNearBottom(): boolean {

    const container =
      this.messagesContainer?.nativeElement;

    if (!container) {
      return true;
    }

    const threshold = 120;

    return (
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight
    ) <= threshold;
  }

  private startConversationPolling(): void {

    this.stopConversationPolling();

    this.conversationPollingSubscription =
      interval(5000).subscribe(() => {

        this.messagingService
          .getConversations()
          .subscribe({

            next: (response:any) => {

              const updatedConversations =
                response?.results ?? []

              this.conversations.set(
                updatedConversations
              );

            },

            error: (error: any) => {

              console.error(
                'Conversation polling failed:',
                error
              );

            }

          });

      });
  }

  private stopConversationPolling(): void {

    this.conversationPollingSubscription
      ?.unsubscribe();

    this.conversationPollingSubscription =
      undefined;
  }

  // ==========================================================
  // LOAD CONVERSATIONS
  // ==========================================================

  loadConversations(): void {

    this.loadingConversations.set(true);

    this.error.set('');

    this.messagingService
      .getConversations()
      .subscribe({

        next: (response: any) => {

          /*
           * Your backend normally returns:
           *
           * {
           *   count: ...,
           *   next: ...,
           *   previous: ...,
           *   results: [...]
           * }
           *
           * We use results here.
           */

          this.conversations.set(
            response.results ?? []
          );

          this.loadingConversations.set(false);


          // --------------------------------------------------
          // Automatically select the first conversation
          // --------------------------------------------------

          if (
            !this.selectedConversation() &&
            this.conversations().length > 0
          ) {

            this.selectConversation(
              this.conversations()[0]
            );
          }

        },

        error: (error: HttpErrorResponse) => {

          console.error(
            'Failed to load conversations:',
            error
          );

          this.error.set(
            'Unable to load your conversations.'
          );

          this.loadingConversations.set(false);

        }

      });
  }


  // ==========================================================
  // SELECT CONVERSATION
  // ==========================================================

  selectConversation(
    conversation: Conversation
  ): void {

    this.selectedConversation.set(
      conversation
    );

    this.loadMessages(
      conversation.id
    );

    this.newMessagesAvailable.set(false);

    this.markAsRead(
      conversation.id
    );

    this.startMessagePolling(
      conversation.id
    );
  }


  // ==========================================================
  // LOAD MESSAGES
  // ==========================================================

  loadMessages(conversationId: number): void {

    this.loadingMessages.set(true);

    this.messagingService
      .getMessages(conversationId)
      .subscribe({
        next: (messages) => {
          this.messages.set(messages ?? []);
          this.loadingMessages.set(false);
          this.scrollToBottom();
        },

        error: (error) => {
          console.error(error);
          this.loadingMessages.set(false);
        }
        
      });
  }

  private startMessagePolling(
    conversationId: number
  ): void {

    // Stop previous polling first
    this.stopMessagePolling();

    this.messagePollingSubscription =
      interval(5000).subscribe(() => {

        this.messagingService
          .getMessages(conversationId)
          .subscribe({

            next: (messages) => {

              const incomingMessages =
                messages ?? [];

              const currentMessages =
                this.messages();

              // Only update if message count changed
              // or the latest message is different.
              const currentLast =
                currentMessages[
                  currentMessages.length - 1
                ];

              const incomingLast =
                incomingMessages[
                  incomingMessages.length - 1
                ];

              const hasChanged =
                incomingMessages.length !==
                  currentMessages.length ||
                currentLast?.id !==
                  incomingLast?.id;

              if (hasChanged) {

                const wasNearBottom =
                  this.isNearBottom();

                this.messages.set(
                  incomingMessages
                );

                if (wasNearBottom) {

                  this.scrollToBottom();

                  this.newMessagesAvailable.set(false);

                } else {

                  this.newMessagesAvailable.set(true);

                }
              }

            },

            error: (error) => {

              console.error(
                'Message polling failed:',
                error
              );

            }

          });

      });
  }

  private stopMessagePolling(): void {

    this.messagePollingSubscription?.unsubscribe();

    this.messagePollingSubscription =
      undefined;
  }

  private scrollToBottom(): void {

    setTimeout(() => {

      const container =
        this.messagesContainer?.nativeElement;

      if (!container) {
        return;
      }

      container.scrollTop =
        container.scrollHeight;

    }, 0);
  }

  scrollToNewMessages(): void {

    this.newMessagesAvailable.set(false);

    this.scrollToBottom();
  }


  // ==========================================================
  // SEND MESSAGE
  // ==========================================================

  sendMessage(): void {

    const conversation =
      this.selectedConversation();

    const content =
      this.newMessage().trim();


    if (!conversation) {
      return;
    }


    if (!content) {
      return;
    }


    if (this.sendingMessage()) {
      return;
    }


    this.sendingMessage.set(true);


    this.messagingService
      .sendMessage(
        conversation.id,
        {
          content
        }
      )
      .subscribe({

        next: (message: Message) => {

          // Add the newly created message
          // to the current chat immediately.

          this.messages.update(
            currentMessages => [
              ...currentMessages,
              message
            ]
          );

           this.newMessagesAvailable.set(
              false
            );

          this.scrollToBottom();

          // Clear input.

          this.newMessage.set('');


          this.sendingMessage.set(false);


          // Refresh conversation list so
          // last_message and updated_at are updated.

          this.refreshConversationList(
            conversation.id
          );

        },

        error: (error: HttpErrorResponse) => {

          console.error(
            'Failed to send message:',
            error
          );

          this.sendingMessage.set(false);

          this.messagesError.set(
            'Unable to send your message. Please try again.'
          );

        }

      });
  }


  // ==========================================================
  // ENTER TO SEND
  // ==========================================================

  handleMessageKeydown(
    event: KeyboardEvent
  ): void {

    /*
     * Enter = Send
     *
     * Shift + Enter = New line
     */

    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {

      event.preventDefault();

      this.sendMessage();
    }
  }


  // ==========================================================
  // MARK AS READ
  // ==========================================================

  markAsRead(
    conversationId: number
  ): void {

    this.messagingService
      .markAsRead(conversationId)
      .subscribe({

        next: () => {

          this.updateUnreadCount(
            conversationId,
            0
          );

        },

        error: (error: HttpErrorResponse) => {

          console.error(
            'Failed to mark conversation as read:',
            error
          );

        }

      });
  }

  openNewConversation(): void {
    this.showNewConversation.set(true);
    this.selectedUserId.set(null);
    this.userSearch.set('');
    this.userRoleFilter.set('');
    this.searchUsers();
    this.loadAvailableUsers();
  }

  closeNewConversation(): void {
    this.showNewConversation.set(false);
    this.selectedUserId.set(null);
    this.userSearch.set('');
  }

  loadAvailableUsers(): void {
    this.loadingUsers.set(true);

    this.messagingService
      .getUsers(
        this.userSearch(),
        undefined
      )
      .subscribe({
        next: (users: MessagingUser[]) => {
          this.availableUsers.set(users);
          this.loadingUsers.set(false);
        },

        error: (error: HttpErrorResponse) => {
          console.error(
            'Failed to load messaging users:',
            error
          );

          this.availableUsers.set([]);
          this.loadingUsers.set(false);
        }
      });
  }

  startConversation(): void {
    const userId = this.selectedUserId();

    if (!userId) {
      return;
    }

    this.creatingConversation.set(true);

    this.messagingService
      .createConversation(userId)
      .subscribe({
        next: (conversation: Conversation) => {

          this.creatingConversation.set(false);

          this.showNewConversation.set(false);

          this.selectedUserId.set(null);

          this.userSearch.set('');

          // Refresh conversation list
          this.loadConversations();

          // Open the newly created conversation
          this.selectConversation(conversation);
        },

        error: (error: HttpErrorResponse) => {

          console.error(
            'Failed to create conversation:',
            error
          );

          this.creatingConversation.set(false);
        }
      });
  }

  // ==========================================================
  // REFRESH CONVERSATION LIST
  // ==========================================================

  private refreshConversationList(
    selectedConversationId: number
  ): void {

    this.messagingService
      .getConversations()
      .subscribe({

        next: (response: any) => {

          const updatedConversations =
            response.results ?? [];

          this.conversations.set(
            updatedConversations
          );


          const updatedConversation =
            updatedConversations.find(
              (conversation: Conversation)  =>
                conversation.id ===
                selectedConversationId
            );


          if (updatedConversation) {

            this.selectedConversation.set(
              updatedConversation
            );

          }

        },

        error: (error: HttpErrorResponse) => {

          console.error(
            'Failed to refresh conversations:',
            error
          );

        }

      });
  }

  searchUsers(): void {

    this.loadingUsers.set(true);

    this.messagingService
      .getUsers(
        this.userSearch(),
        this.userRoleFilter()
      )
      .subscribe({

        next: (users) => {

          this.availableUsers.set(
            users
          );

          this.loadingUsers.set(false);
        },

        error: (error) => {

          console.error(
            'Failed to load users:',
            error
          );

          this.availableUsers.set([]);

          this.loadingUsers.set(false);
        }

      });
  }

  setUserRoleFilter(role: string): void {

    this.userRoleFilter.set(role);

    this.searchUsers();
  }

  selectUser(user: MessagingUser): void {
    this.selectedUserId.set(user.id);
  }

  // ==========================================================
  // UPDATE UNREAD COUNT
  // ==========================================================

  private updateUnreadCount(
    conversationId: number,
    unreadCount: number
  ): void {

    this.conversations.update(
      conversations =>
        conversations.map(
          conversation =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  unread_count: unreadCount
                }
              : conversation
        )
    );


    const selected =
      this.selectedConversation();


    if (
      selected &&
      selected.id === conversationId
    ) {

      this.selectedConversation.set({
        ...selected,
        unread_count: unreadCount
      });

    }
  }


  // ==========================================================
  // GET OTHER USER
  // ==========================================================

  getOtherUser(
    conversation: Conversation
  ) {

    return conversation.other_user;
  }


  // ==========================================================
  // MESSAGE OWNERSHIP
  // ==========================================================

  isOwnMessage(
    message: Message
  ): boolean {

    const userId =
      this.currentUserId();

    if (!userId) {
      return false;
    }

    return (
      message.sender_id === userId
    );
  }


  // ==========================================================
  // FORMAT TIME
  // ==========================================================

  formatMessageTime(
    date: string
  ): string {

    if (!date) {
      return '';
    }

    const messageDate =
      new Date(date);

    return messageDate.toLocaleTimeString(
      [],
      {
        hour: 'numeric',
        minute: '2-digit'
      }
    );
  }


  // ==========================================================
  // FORMAT CONVERSATION TIME
  // ==========================================================

  formatConversationTime(
    date: string
  ): string {

    if (!date) {
      return '';
    }

    const messageDate =
      new Date(date);

    const now =
      new Date();


    const sameDay =
      messageDate.toDateString() ===
      now.toDateString();


    if (sameDay) {

      return messageDate.toLocaleTimeString(
        [],
        {
          hour: 'numeric',
          minute: '2-digit'
        }
      );
    }


    return messageDate.toLocaleDateString(
      [],
      {
        day: '2-digit',
        month: 'short'
      }
    );
  }


  // ==========================================================
  // GET INITIAL
  // ==========================================================

  getInitial(
    name: string | undefined | null
  ): string {

    if (!name) {
      return '?';
    }

    return name
      .trim()
      .charAt(0)
      .toUpperCase();
  }


  // ==========================================================
  // LAST MESSAGE PREVIEW
  // ==========================================================

  getLastMessagePreview(
    conversation: Conversation
  ): string {

    const lastMessage =
      conversation.last_message;

    if (!lastMessage) {
      return 'No messages yet';
    }

    return lastMessage.content;
  }


  // ==========================================================
  // TRACK BY
  // ==========================================================

  trackConversation(
    index: number,
    conversation: Conversation
  ): number {

    return conversation.id;
  }


  trackMessage(
    index: number,
    message: Message
  ): number {

    return message.id;
  }

}