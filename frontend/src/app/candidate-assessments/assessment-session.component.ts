import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TopNavComponent } from '../shared/top-nav/top-nav.component';
import { AIService } from '../core/services/ai.service';
import { MockInterviewQuestion, MockInterviewEvaluation } from '../core/models/ai.model';

@Component({
  selector: 'app-assessment-session',
  standalone: true,
  imports: [CommonModule, TopNavComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-white">
      <app-top-nav portalName="Assessment Session"></app-top-nav>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">{{ sessionTitle }}</h1>
              <p class="mt-2 text-gray-600">{{ sessionDescription }}</p>
            </div>
            <button (click)="goBack()" class="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Back to Assessments
            </button>
          </div>

          <div class="mt-8 space-y-4">
            <div class="rounded-2xl bg-indigo-50 p-6">
              <p class="text-sm text-indigo-700">This is a demonstration assessment session page. You can replace this with a real practice experience, question flow, or external evaluation module.</p>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div class="rounded-2xl border border-slate-200 p-6">
                <p class="text-sm font-semibold text-gray-900">Duration</p>
                <p class="mt-2 text-lg text-gray-700">{{ sessionDuration }}</p>
              </div>
              <div class="rounded-2xl border border-slate-200 p-6">
                <p class="text-sm font-semibold text-gray-900">Level</p>
                <p class="mt-2 text-lg text-gray-700">{{ sessionLevel }}</p>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-200 p-6">
              <h2 class="text-lg font-semibold text-gray-900">What to expect</h2>
              <ul class="mt-4 space-y-3 text-gray-600 list-disc list-inside">
                <li>AI-driven mock interview questions</li>
                <li>Practice answering in real time</li>
                <li>Structured feedback and summary</li>
                <li>Plan-based content tailored to your level</li>
              </ul>
            </div>

            <div class="space-y-4">
              <div *ngIf="loadingQuestions()" class="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                Loading assessment questions from AI...
              </div>

              <div *ngIf="errorMessage() && !loadingQuestions()" class="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                {{ errorMessage() }}
              </div>

              <div *ngIf="!questions().length && !loadingQuestions() && !errorMessage()" class="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                No assessment questions are available for this session yet. Please refresh or try a different assessment.
              </div>

              <ng-container *ngIf="!started() && !completed()">
                <button
                  type="button"
                  (click)="startAssessment()"
                  [disabled]="loadingQuestions() || !questions().length || !!errorMessage()"
                  class="w-full rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  Begin Assessment
                </button>
              </ng-container>
            </div>

            <ng-container *ngIf="started() || completed()">
              <div class="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <div class="flex items-center justify-between mb-5">
                  <div>
                    <h3 class="text-xl font-semibold text-gray-900">AI Interview Bot</h3>
                    <p class="text-sm text-gray-500">Answer the questions below to simulate a real interview.</p>
                  </div>
                  <span class="text-xs uppercase tracking-[0.24em] text-indigo-600 font-semibold">{{ currentQuestionIndex() + 1 }} / {{ questions().length }}</span>
                </div>

                <div *ngIf="!completed()" class="space-y-5">
                  <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p class="text-sm text-slate-800"><span class="font-semibold">Bot:</span> {{ currentQuestion?.prompt }}</p>
                  </div>

                  <form (submit)="submitAnswer($event, answerInput)" class="space-y-4">
                    <textarea
                      #answerInput
                      rows="5"
                      placeholder="Type your answer here..."
                      class="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    ></textarea>

                    <button
                      type="submit"
                      class="w-full rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      {{ currentQuestionIndex() + 1 === questions().length ? 'Finish Assessment' : 'Submit Answer' }}
                    </button>
                  </form>
                </div>

                <div *ngIf="completed()" class="space-y-4">
                  <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <h4 class="font-semibold text-emerald-800">Assessment Complete</h4>
                    <p class="mt-2 text-sm text-emerald-700">Great work! Your answers have been recorded and you can review them below.</p>
                    <p class="mt-3 text-sm text-slate-700"><span class="font-semibold">Score:</span> {{ assessmentScore() }} / 100</p>
                    <p class="mt-2 text-sm text-slate-700"><span class="font-semibold">Feedback:</span> {{ feedback() }}</p>
                  </div>

                  <div class="space-y-4">
                    <div *ngFor="let item of completedAnswers(); let idx = index" class="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                      <p class="text-sm text-slate-900"><span class="font-semibold">Q{{ idx + 1 }}:</span> {{ item.question }}</p>
                      <p class="mt-3 text-sm text-slate-700"><span class="font-semibold">Your answer:</span> {{ item.answer }}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    (click)="resetAssessment()"
                    class="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                  >
                    Start Another Practice
                  </button>
                </div>
              </div>
            </ng-container>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AssessmentSessionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private aiService = inject(AIService);

  sessionTitle = 'Assessment';
  sessionDescription = 'Loading session details...';
  sessionDuration = 'TBD';
  sessionLevel = 'TBD';
  started = signal(false);
  currentQuestionIndex = signal(0);
  completed = signal(false);
  loadingQuestions = signal(false);
  questions = signal<MockInterviewQuestion[]>([]);
  completedAnswers = signal<Array<{ question: string; answer: string }>>([]);
  assessmentScore = signal<number | null>(null);
  feedback = signal('');
  highlights = signal<string[]>([]);
  errorMessage = signal('');

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');

    const sessionMap: Record<string, { title: string; description: string; duration: string; level: string }> = {
      'mock-interview-sprint': {
        title: 'Mock Interview Sprint',
        description: 'Practice an AI-guided mock interview with recruiter-style questions and instant feedback.',
        duration: '15 min',
        level: 'Core',
      },
      'aptitude-challenge': {
        title: 'Aptitude Challenge',
        description: 'Measure your reasoning and technical aptitude with a timed challenge designed for hiring readiness.',
        duration: '20 min',
        level: 'Pro',
      },
      'behavioral-readiness-test': {
        title: 'Behavioral Readiness Test',
        description: 'Prepare for real hiring scenarios with a structured behavioral assessment and scorecard.',
        duration: '10 min',
        level: 'Premium',
      },
    };

    if (slug && sessionMap[slug]) {
      const session = sessionMap[slug];
      this.sessionTitle = session.title;
      this.sessionDescription = session.description;
      this.sessionDuration = session.duration;
      this.sessionLevel = session.level;
      this.loadQuestions(slug);
    } else {
      this.sessionTitle = 'Unknown assessment';
      this.sessionDescription = 'The requested assessment session could not be found.';
      this.sessionDuration = 'N/A';
      this.sessionLevel = 'N/A';
      this.questions.set([]);
    }
  }

  startAssessment(): void {
    this.started.set(true);
    this.completed.set(false);
    this.currentQuestionIndex.set(0);
    this.completedAnswers.set([]);
    this.assessmentScore.set(null);
    this.feedback.set('');
    this.highlights.set([]);
  }

  get currentQuestion(): MockInterviewQuestion | undefined {
    return this.questions()[this.currentQuestionIndex()];
  }

  submitAnswer(event: Event, answerInput: HTMLTextAreaElement): void {
    event.preventDefault();
    const trimmedAnswer = answerInput?.value?.trim();
    if (!trimmedAnswer) {
      return;
    }

    const question = this.currentQuestion;
    if (!question) {
      return;
    }

    this.completedAnswers.update((answers) => [
      ...answers,
      { question: question.prompt, answer: trimmedAnswer },
    ]);

    answerInput.value = '';

    const nextIndex = this.currentQuestionIndex() + 1;
    if (nextIndex >= this.questions().length) {
      this.completed.set(true);
      this.started.set(false);
      this.evaluateAssessment();
      return;
    }

    this.currentQuestionIndex.set(nextIndex);
  }

  resetAssessment(): void {
    this.started.set(false);
    this.completed.set(false);
    this.currentQuestionIndex.set(0);
    this.completedAnswers.set([]);
    this.assessmentScore.set(null);
    this.feedback.set('');
  }

  private evaluateAssessment(): void {
    const answers = this.completedAnswers();
    if (!answers.length) {
      this.assessmentScore.set(0);
      this.feedback.set('No answers recorded. Please try another assessment.');
      this.highlights.set([]);
      return;
    }

    this.aiService
      .evaluateMockInterviewAnswers(this.route.snapshot.paramMap.get('slug') || '', answers)
      .subscribe({
        next: (result: MockInterviewEvaluation) => {
          this.assessmentScore.set(result.score);
          this.feedback.set(result.feedback);
          this.highlights.set(result.highlights || []);
        },
        error: () => {
          this.assessmentScore.set(70);
          this.feedback.set('AI evaluation failed. Your answers were submitted locally.');
          this.highlights.set(['Use more concrete examples and structure your responses clearly.']);
        },
      });
  }

  private loadQuestions(sessionSlug: string): void {
    this.loadingQuestions.set(true);
    this.errorMessage.set('');

    this.aiService.getMockInterviewQuestions(sessionSlug).subscribe({
      next: (questions) => {
        this.questions.set(questions);
        this.loadingQuestions.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load AI interview questions. Please try again later.');
        this.questions.set([]);
        this.loadingQuestions.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/assessments']);
  }
}
