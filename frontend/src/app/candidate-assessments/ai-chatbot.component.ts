import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TopNavComponent } from '../shared/top-nav/top-nav.component';
import { AIService } from '../core/services/ai.service';
import { MockInterviewQuestion, MockInterviewEvaluation } from '../core/models/ai.model';

interface ChatMessage {
  sender: 'bot' | 'candidate';
  text: string;
}

@Component({
  selector: 'app-ai-chatbot',
  standalone: true,
  imports: [CommonModule, TopNavComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-white">
      <app-top-nav portalName="AI Chatbot"></app-top-nav>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div class="flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">AI Interview Coach</h1>
              <p class="mt-2 text-gray-600">Practice your answers with a chat-based AI coach and get instant interview feedback.</p>
            </div>
            <button
              type="button"
              (click)="goBack()"
              class="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Back to Assessments
            </button>
          </div>

          <div *ngIf="errorMessage()" class="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 mb-6">
            {{ errorMessage() }}
          </div>

          <div class="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
            <div class="space-y-6">
              <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h2 class="text-lg font-semibold text-gray-900">Session</h2>
                <p class="mt-3 text-sm text-slate-700">{{ sessionTitle }}</p>
                <p class="mt-1 text-sm text-slate-600">{{ sessionDescription }}</p>
                <div class="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                  <span class="rounded-full bg-white px-3 py-2 shadow-sm">Duration: {{ sessionDuration }}</span>
                  <span class="rounded-full bg-white px-3 py-2 shadow-sm">Level: {{ sessionLevel }}</span>
                </div>
              </div>

              <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <div class="flex items-center justify-between mb-5">
                  <div>
                    <h3 class="text-xl font-semibold text-gray-900">Chat</h3>
                    <p class="mt-1 text-sm text-slate-500">Answer one question at a time and get instant prompts from the AI coach.</p>
                  </div>
                  <span class="text-sm font-semibold text-slate-500">{{ currentStepText() }}</span>
                </div>

                <div class="max-h-[520px] space-y-4 overflow-y-auto pr-2">
                  <div *ngIf="loadingQuestions()" class="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                    Loading chat session...
                  </div>
                  <div *ngIf="!loadingQuestions() && !messages().length" class="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-sm text-indigo-700">
                    Ready to start. Type your answer to begin the chat.
                  </div>

                  <div *ngFor="let message of messages()" class="flex flex-col gap-2" [ngClass]="{ 'items-end': message.sender === 'candidate' }">
                    <div
                      [class]="message.sender === 'candidate'
                        ? 'max-w-[85%] rounded-3xl bg-indigo-600 px-5 py-4 text-sm text-white shadow-soft'
                        : 'max-w-[85%] rounded-3xl bg-slate-100 px-5 py-4 text-sm text-slate-800 shadow-soft'"
                    >
                      <p>{{ message.text }}</p>
                    </div>
                  </div>
                </div>

                <form (submit)="submitChat($event, answerInput)" class="mt-5 space-y-4">
                  <textarea
                    #answerInput
                    rows="4"
                    [disabled]="loadingQuestions() || sessionCompleted()"
                    placeholder="Type your answer here..."
                    class="w-full rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                  ></textarea>

                  <button
                    type="submit"
                    [disabled]="loadingQuestions() || sessionCompleted()"
                    class="w-full rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {{ sessionCompleted() ? 'Session Complete' : 'Submit Answer' }}
                  </button>
                </form>

                <button
                  type="button"
                  (click)="refreshQuestions()"
                  [disabled]="loadingQuestions()"
                  class="mt-3 w-full rounded-2xl border border-indigo-200 bg-indigo-50 px-6 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Load New Questions
                </button>
              </div>
            </div>

            <div class="space-y-6">
              <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h3 class="text-lg font-semibold text-gray-900">Progress</h3>
                <p class="mt-3 text-sm text-slate-600">{{ questions().length ? currentQuestionIndex() + 1 : 0 }} of {{ questions().length }} questions answered.</p>
                <div class="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div class="h-full rounded-full bg-indigo-600 transition-all" [style.width.%]="progress()"></div>
                </div>
              </div>

              <div *ngIf="sessionCompleted()" class="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
                <h3 class="text-lg font-semibold text-emerald-800">Evaluation</h3>
                <p class="mt-3 text-sm text-emerald-700"><strong>Score:</strong> {{ assessmentScore() }} / 100</p>
                <p class="mt-3 text-sm text-emerald-700"><strong>Feedback:</strong> {{ feedback() }}</p>
                <div *ngIf="highlights().length" class="mt-4 space-y-2">
                  <p class="text-sm font-semibold text-emerald-800">Highlights</p>
                  <ul class="list-disc pl-5 text-sm text-emerald-700">
                    <li *ngFor="let highlight of highlights()">{{ highlight }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AIChatbotComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private aiService = inject(AIService);

  sessionTitle = 'AI Practice Chat';
  sessionDescription = 'Practice with an interactive AI interview bot.';
  sessionDuration = '15 min';
  sessionLevel = 'Core';

  loadingQuestions = signal(false);
  questions = signal<MockInterviewQuestion[]>([]);
  currentQuestionIndex = signal(0);
  messages = signal<ChatMessage[]>([]);
  assessmentScore = signal<number | null>(null);
  feedback = signal('');
  highlights = signal<string[]>([]);
  errorMessage = signal('');

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    this.initializeSession(slug);
  }

  private initializeSession(sessionSlug: string | null): void {
    if (!sessionSlug) {
      this.errorMessage.set('Invalid assessment session.');
      return;
    }

    this.loadQuestions(sessionSlug);
  }

  private loadQuestions(sessionSlug: string): void {
    this.loadingQuestions.set(true);
    this.errorMessage.set('');
    this.assessmentScore.set(null);
    this.feedback.set('');
    this.highlights.set([]);
    this.currentQuestionIndex.set(0);
    this.messages.set([]);

    this.aiService.getMockInterviewQuestions(sessionSlug).subscribe({
      next: (questions) => {
        this.questions.set(questions);
        this.messages.set([
          { sender: 'bot', text: questions.length ? questions[0].prompt : 'No questions available for this session.' },
        ]);
        this.loadingQuestions.set(false);
      },
      error: () => {
        this.errorMessage.set('Unable to load AI chat questions. Please try again later.');
        this.questions.set([]);
        this.loadingQuestions.set(false);
      },
    });
  }

  submitChat(event: Event, answerInput: HTMLTextAreaElement): void {
    event.preventDefault();
    const answerText = answerInput?.value?.trim();
    if (!answerText || this.sessionCompleted()) {
      return;
    }

    const currentQuestion = this.questions()[this.currentQuestionIndex()];
    const nextIndex = this.currentQuestionIndex() + 1;

    this.messages.update((existing) => [
      ...existing,
      { sender: 'candidate', text: answerText },
    ]);

    answerInput.value = '';

    if (nextIndex >= this.questions().length) {
      this.evaluateSession(currentQuestion?.prompt ?? '');
      return;
    }

    const nextQuestion = this.questions()[nextIndex];
    this.messages.update((existing) => [
      ...existing,
      { sender: 'bot', text: nextQuestion.prompt },
    ]);
    this.currentQuestionIndex.set(nextIndex);
  }

  private evaluateSession(lastQuestion: string): void {
    const slug = this.route.snapshot.paramMap.get('slug') || '';
    const responses = this.messages()
      .filter((m) => m.sender === 'candidate')
      .map((m, idx) => ({ question: this.questions()[idx]?.prompt || '', answer: m.text }));

    this.aiService.evaluateMockInterviewAnswers(slug, responses).subscribe({
      next: (result: MockInterviewEvaluation) => {
        this.assessmentScore.set(result.score);
        this.feedback.set(result.feedback);
        this.highlights.set(result.highlights || []);
        this.messages.update((existing) => [
          ...existing,
          { sender: 'bot', text: 'Session complete! Review your feedback on the right.' },
        ]);
      },
      error: () => {
        this.assessmentScore.set(72);
        this.feedback.set('AI evaluation unavailable. Your practice session is complete.');
        this.highlights.set(['Try refining your structure and examples next time.']);
      },
    });
  }

  sessionCompleted(): boolean {
    return this.assessmentScore() !== null;
  }

  currentStepText(): string {
    return this.questions().length ? `Question ${this.currentQuestionIndex() + 1} of ${this.questions().length}` : 'No questions loaded';
  }

  progress(): number {
    return this.questions().length ? ((this.currentQuestionIndex() + (this.sessionCompleted() ? 1 : 0)) / this.questions().length) * 100 : 0;
  }

  refreshQuestions(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadQuestions(slug);
    }
  }

  goBack(): void {
    this.router.navigate(['/assessments']);
  }
}
