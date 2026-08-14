import { Component, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';

import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

import { AiCoachService } from '../../core/services/ai-coach.service';
import { ChatMessage } from '../../core/models/ai-coach.model';

import { Conversation } from '../../core/models/ai-coach.model';

interface QuickAction {

  icon: string;

  title: string;

  action: () => void;

}

@Component({
  selector: 'app-ai-career-center',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MarkdownModule,
    RouterLink
  ],
  templateUrl: './ai-career-center.component.html',
  styleUrls: ['./ai-career-center.component.scss']
})

export class AiCareerCenterComponent {

  private aiService = inject(AiCoachService);
  private authService = inject(AuthService);

  @ViewChild('chatContainer')
  chatContainer!: ElementRef;

  @ViewChild('fileInput')
  fileInput!: ElementRef<HTMLInputElement>;

  selectedFile = signal<File | null>(null);

  message = '';

  // ======================================================
  // FILE ATTACHMENTS
  // ======================================================

  selectedFiles: File[] = [];

  readonly allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ];

  readonly maxFileSize = 10 * 1024 * 1024; // 10 MB

  role = this.authService.userRole;

  constructor() {

    console.log('Current Role:', this.role());

    this.loadConversations();

  }

  selectFile(event: Event): void {

  const input = event.target as HTMLInputElement;

  if (!input.files || input.files.length === 0) {
    return;
  }

  const file = input.files[0];

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {

      alert('Please select a PDF or DOCX file.');

      input.value = '';

      return;
    }

    this.selectedFile.set(file);
  }

  removeSelectedFile(): void {

    this.selectedFile.set(null);

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private loadConversations(): void {

    this.aiService.getConversations().subscribe({

      next: (data) => {

        this.conversations.set(data);

      },

      error: (err) => {

        console.error(err);

      }

    });

  }

  loadConversation(id: number): void {

    this.aiService.getConversation(id).subscribe({

      next: (conversation) => {

        this.selectedConversationId.set(conversation.id);

        this.messages.set(
          conversation.messages.map(message => ({
            role: message.role,
            message: message.message,
            timestamp: new Date(message.created_at)
          }))
        );

        this.scrollToBottom();

      },

      error: (err) => {

        console.error(err);

      }

    });

  }

  deleteConversation(
    id: number,
    event: MouseEvent
  ): void {

    event.stopPropagation();

    if (!confirm('Delete this conversation?')) {
      return;
    }

    this.aiService.deleteConversation(id)
      .subscribe({

        next: () => {

          this.loadConversations();

          if (this.selectedConversationId() === id) {

            this.selectedConversationId.set(null);

            this.newChat();

          }

        },

        error: err => {

          console.error(err);

        }

      });

  }

  loading = signal(false);

    conversations = signal<Conversation[]>([]);

    selectedConversationId = signal<number | null>(null);

    messages = signal<ChatMessage[]>([
      {
        role: 'assistant',

        message:
          this.welcomeMessage,

        timestamp: new Date()
      }
    ]);

  get pageTitle(): string {

    switch (this.role()) {

      case 'HR':
        return '🤖 AI Hiring Assistant';

      case 'SUPER_ADMIN':
        return '🤖 AI Admin Assistant';

      default:
        return '🤖 AI Career Center';

    }

  }

  get pageDescription(): string {

    switch (this.role()) {

      case 'HR':
        return 'Your AI assistant for hiring, recruitment and candidate management.';

      case 'SUPER_ADMIN':
        return 'Your AI assistant for system administration and analytics.';

      default:
        return 'Your personal AI assistant for interview preparation, resumes and career growth.';
    }

  }

  get assistantName(): string {

    switch (this.role()) {

      case 'HR':
        return 'AI Hiring Assistant';

      case 'SUPER_ADMIN':
        return 'AI Admin Assistant';

      default:
        return 'AI Career Coach';

    }

  }

  get welcomeMessage(): string {

    switch (this.role()) {

      case 'HR':
        return '👋 Hello! I am your AI Hiring Assistant. I can help you create job descriptions, screen candidates, prepare interview questions, evaluate resumes, and improve your hiring process.';

      case 'SUPER_ADMIN':
        return '👋 Hello! I am your AI Admin Assistant. I can help you analyze platform statistics, manage users, monitor system health, generate reports, and support administration tasks.';

      default:
        return '👋 Hello! I am your AI Career Coach. I can help you with resumes, interviews, career guidance, skills, and job preparation.';

    }

  }

  get dashboardRoute(): string {

    switch (this.role()) {

      case 'HR':
        return '/hr-dashboard';

      case 'SUPER_ADMIN':
        return '/admin-dashboard';

      default:
        return '/candidate-dashboard';

    }

  }

  get quickActions(): QuickAction[] {

    switch (this.role()) {

      case 'HR':

        return [

          {
            icon: '📝',
            title: 'Generate Job Description',
            action: () => this.generateJobDescription()
          },

          {
            icon: '📄',
            title: 'Resume Screening',
            action: () => this.resumeScreening()
          },

          {
            icon: '❓',
            title: 'Interview Questions',
            action: () => this.interviewQuestions()
          },

          {
            icon: '⭐',
            title: 'Candidate Evaluation',
            action: () => this.evaluateCandidate()
          },

          {
            icon: '📈',
            title: 'Hiring Strategy',
            action: () => this.hiringStrategy()
          },

          {
            icon: '📧',
            title: 'Recruitment Email',
            action: () => this.recruitmentEmail()
          },

          {
            icon: '🤝',
            title: 'Offer Letter',
            action: () => this.offerLetter()
          },

          {
            icon: '🎯',
            title: 'Talent Search',
            action: () => this.talentSearch()
          }

        ];

      case 'SUPER_ADMIN':

        return [

          {
            icon: '📊',
            title: 'Platform Analytics',
            action: () => this.platformAnalytics()
          },

          {
            icon: '👥',
            title: 'User Insights',
            action: () => this.userInsights()
          },

          {
            icon: '🏢',
            title: 'Company Reports',
            action: () => this.companyReports()
          },

          {
            icon: '📢',
            title: 'Broadcast Draft',
            action: () => this.broadcastDraft()
          },

          {
            icon: '📜',
            title: 'Audit Analysis',
            action: () => this.auditAnalysis()
          },

          {
            icon: '⚙️',
            title: 'System Health',
            action: () => this.systemHealth()
          },

          {
            icon: '🤖',
            title: 'AI Recommendations',
            action: () => this.aiRecommendations()
          },

          {
            icon: '📋',
            title: 'Executive Summary',
            action: () => this.executiveSummary()
          }

        ];

      default:

        return [

          {
            icon: '📄',
            title: 'Resume Review',
            action: () => this.resumeReview()
          },

          {
            icon: '🎯',
            title: 'ATS Resume Check',
            action: () => this.atsCheck()
          },

          {
            icon: '💼',
            title: 'HR Interview',
            action: () => this.hrInterview()
          },

          {
            icon: '💻',
            title: 'Technical Interview',
            action: () => this.technicalInterview()
          },

          {
            icon: '🧠',
            title: 'Mock Interview',
            action: () => this.mockInterview()
          },

          {
            icon: '📈',
            title: 'Career Roadmap',
            action: () => this.careerRoadmap()
          },

          {
            icon: '💰',
            title: 'Salary Negotiation',
            action: () => this.salaryNegotiation()
          },

          {
            icon: '✉️',
            title: 'Cover Letter',
            action: () => this.coverLetter()
          }

        ];

    }

  }

    onFilesSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);

    for (const file of files) {

      // ----------------------------------------
      // File Type Validation
      // ----------------------------------------

      if (!this.allowedFileTypes.includes(file.type)) {

        alert(
          `"${file.name}" is not a supported file type.`
        );

        continue;
      }

      // ----------------------------------------
      // File Size Validation
      // ----------------------------------------

      if (file.size > this.maxFileSize) {

        alert(
          `"${file.name}" exceeds the maximum file size of 10 MB.`
        );

        continue;
      }

      // ----------------------------------------
      // Prevent Duplicate Files
      // ----------------------------------------

      const alreadySelected = this.selectedFiles.some(
        existingFile =>
          existingFile.name === file.name &&
          existingFile.size === file.size &&
          existingFile.lastModified === file.lastModified
      );

      if (alreadySelected) {
        continue;
      }

      this.selectedFiles.push(file);

    }

    // Refresh Angular view

    this.selectedFiles = [...this.selectedFiles];

    // Reset input so the same file can be selected again

    input.value = '';

  }

    removeFile(index: number): void {

    if (index < 0 || index >= this.selectedFiles.length) {
      return;
    }

    this.selectedFiles.splice(index, 1);

    this.selectedFiles = [...this.selectedFiles];

  }

    getFileIcon(file: File): string {

    const extension =
      file.name.split('.').pop()?.toLowerCase();

    switch (extension) {

      case 'pdf':
        return '📕';

      case 'doc':
      case 'docx':
        return '📘';

      case 'xls':
      case 'xlsx':
      case 'csv':
        return '📊';

      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';

      case 'txt':
        return '📄';

      default:
        return '📎';

    }

  }

    formatFileSize(bytes: number): string {

    if (bytes === 0) {
      return '0 Bytes';
    } 

    const units = [
      'Bytes',
      'KB',
      'MB',
      'GB'
    ];

    const index = Math.floor(
      Math.log(bytes) / Math.log(1024)
    );

    return (
      parseFloat(
        (bytes / Math.pow(1024, index)).toFixed(2)
      ) +
      ' ' +
      units[index]
    );

  }

  sendMessage(): void {

    const text = this.message.trim();

    const files = this.selectedFiles;

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!text && files.length === 0) {
      return;
    }

    // -----------------------------------------------------
    // Currently the backend upload method supports
    // one file per message.
    // -----------------------------------------------------

    if (files.length > 1) {

      alert(
        'Please attach only one file per message for now.'
      );

      return;
    }


    // =====================================================
    // MESSAGE DISPLAY
    // =====================================================

    let displayMessage = text;

    if (files.length === 1) {

      const file = files[0];

      if (displayMessage) {

        displayMessage =
          `📎 ${file.name}\n\n${displayMessage}`;

      } else {

        displayMessage =
          `📎 ${file.name}`;

      }

    }


    this.messages.update(messages => [

      ...messages,

      {
        role: 'user',

        message: displayMessage,

        timestamp: new Date()
      }

    ]);


    this.scrollToBottom();


    // =====================================================
    // LOADING
    // =====================================================

    this.loading.set(true);


    // =====================================================
    // ROLE
    // =====================================================

    const role =
      this.role() === 'SUPER_ADMIN'
        ? 'ADMIN'
        : (this.role() as 'CANDIDATE' | 'HR');


    // =====================================================
    // FILE UPLOAD / NORMAL CHAT
    // =====================================================

    const request$ =

      files.length === 1

        ? this.aiService.chatWithFile(
            text,
            role,
            this.selectedConversationId(),
            files[0]
          )

        : this.aiService.chat(
            text,
            role,
            this.selectedConversationId()
          );


    // =====================================================
    // API RESPONSE
    // =====================================================

    request$.subscribe({

      next: (response) => {

        // -----------------------------------------------
        // Save conversation ID
        // -----------------------------------------------

        this.selectedConversationId.set(
          response.conversation_id
        );


        // -----------------------------------------------
        // Update conversation title
        // -----------------------------------------------

        if (text.length > 0) {

          this.aiService.updateConversationTitle(
            response.conversation_id,
            text
          ).subscribe({

            next: () => {

              this.loadConversations();

            }

          });

        } else {

          // If the user only uploaded a file,
          // still refresh the conversation list.

          this.loadConversations();

        }


        // -----------------------------------------------
        // Stop loading
        // -----------------------------------------------

        this.loading.set(false);


        // -----------------------------------------------
        // Display AI response
        // -----------------------------------------------

        this.typeResponse(
          response.reply
        );

      },


      // =================================================
      // ERROR
      // =================================================

      error: (err) => {

        console.error(
          'AI Chat Error:',
          err
        );


        this.messages.update(messages => [

          ...messages,

          {
            role: 'assistant',

            message:
              '❌ Sorry, something went wrong while contacting the AI.',

            timestamp: new Date()
          }

        ]);


        this.loading.set(false);

        this.scrollToBottom();

      }

    });


    // =====================================================
    // RESET INPUT
    // =====================================================

    this.message = '';

    this.selectedFiles = [];

  }

  onKeyDown(event: KeyboardEvent): void {

    if (event.key === 'Enter' && !event.shiftKey) {

      event.preventDefault();

      this.sendMessage();

    }

  }

  askAI(prompt: string): void {

    this.message = prompt;

    this.sendMessage();

  }

  resumeReview(): void {

    this.loading.set(true);

    // Show a message so the user knows what's happening
    this.messages.update(messages => [
      ...messages,
      {
        role: 'user',
        message: '📄 Analyze my uploaded resume',
        timestamp: new Date()
      }
    ]);

    this.scrollToBottom();

    this.aiService.resumeReview().subscribe({

      next: (response) => {

        this.loading.set(false);

        this.typeResponse(response.review);

      },

      error: (err) => {

        this.loading.set(false);

        let message = '❌ Unable to analyze your resume.';

        if (err?.error?.detail) {
          message = `❌ ${err.error.detail}`;
        }

        this.messages.update(messages => [
          ...messages,
          {
            role: 'assistant',
            message,
            timestamp: new Date()
          }
        ]);

        this.scrollToBottom();

      }

    });

  }

  atsCheck() {

    this.askAI(`
  Act as an ATS Resume Scanner.

  Evaluate my resume for ATS compatibility.

  Give:

  - ATS Score
  - Missing Keywords
  - Formatting Issues
  - Improvements

  Use tables where possible.
  `);

  }

  hrInterview() {

    this.askAI(`
  Act as an HR interviewer.

  Conduct a professional HR interview.

  Ask one HR question.

  Wait for my answer before asking the next question.

  After every answer:

  - Evaluate it
  - Give strengths
  - Explain mistakes
  - Suggest a better answer
  - Give score out of 10
  `);

  }

  technicalInterview() {

    this.askAI(`
  Act as a Senior Technical Interviewer.

  Interview me for a Python Full Stack Developer role.

  Topics:

  - Python
  - Django
  - REST API
  - SQL
  - Angular
  - HTML
  - CSS
  - JavaScript

  Ask one question at a time.

  Evaluate every answer.
  `);

  }

  mockInterview() {

    this.askAI(`
  Conduct a complete mock interview.

  Include:

  HR Round

  Technical Round

  Project Discussion

  Coding Round

  Communication Score

  Final Score

  Overall Feedback
  `);

  }

  careerRoadmap() {

    this.askAI(`
  Create a learning roadmap.

  Include:

  Current Level

  Required Skills

  Weekly Plan

  Projects

  Certifications

  Interview Preparation

  Job Strategy
  `);

  }

  salaryNegotiation() {

    this.askAI(`
  Act as a Salary Negotiation Coach.

  Explain:

  How to negotiate salary

  Common mistakes

  Example conversation

  HR objections

  Professional responses

  Best negotiation tips
  `);

  }

  coverLetter() {

    this.askAI(`
  Act as an expert Cover Letter writer.

  Generate a professional cover letter.

  Use placeholders for:

  Name

  Company

  Role

  Experience

  Projects

  Skills
  `);

  }

  private scrollToBottom(): void {

    setTimeout(() => {

      this.chatContainer.nativeElement.scrollTop =
      this.chatContainer.nativeElement.scrollHeight;

    });

  }

private typeResponse(fullText: string): void {

  const assistantMessage: ChatMessage = {

    role: 'assistant',

    message: '',

    timestamp: new Date(),

    copied: false

  };

  this.messages.update(messages => [

    ...messages,

    assistantMessage

  ]);

  let index = 0;

    const interval = setInterval(() => {

      assistantMessage.message += fullText.slice(index, index + 3);

      index += 3;

      this.messages.update(messages => [...messages]);

      this.scrollToBottom();

      if (index >= fullText.length) {

          clearInterval(interval);

      }

  }, 15);

}

  copyMessage(chat: ChatMessage): void {

    navigator.clipboard.writeText(chat.message);

    chat.copied = true;

    this.messages.update(messages => [...messages]);

    setTimeout(() => {

      chat.copied = false;

      this.messages.update(messages => [...messages]);

    }, 2000);

  }

  // ======================================================
  // HR AI ACTIONS
  // ======================================================

  generateJobDescription() {

    this.askAI(`
  Act as a Senior HR Manager.

  Generate a professional Job Description.

  Include:

  - Job Summary
  - Responsibilities
  - Required Skills
  - Preferred Skills
  - Experience
  - Benefits
  - Salary Range
  `);

  }

  resumeScreening() {

    this.askAI(`
  Act as an AI Resume Screening Expert.

  Explain how to evaluate resumes.

  Provide:

  - Candidate Score
  - Strengths
  - Weaknesses
  - Hiring Recommendation
  `);

  }

  interviewQuestions() {

    this.askAI(`
  Generate professional interview questions for hiring candidates.

  Include:

  - HR Questions
  - Technical Questions
  - Behavioral Questions
  - Follow-up Questions
  `);

  }

  evaluateCandidate() {

    this.askAI(`
  Act as an HR Evaluation Assistant.

  Evaluate a candidate.

  Provide:

  - Technical Score
  - Communication
  - Culture Fit
  - Hiring Recommendation
  `);

  }

  hiringStrategy() {

    this.askAI(`
  Suggest an effective hiring strategy.

  Include:

  - Hiring Funnel
  - Recruitment Channels
  - Screening Process
  - Interview Flow
  - Offer Strategy
  `);

  }

  recruitmentEmail() {

    this.askAI(`
  Generate a professional recruitment email inviting a candidate for an interview.
  `);

  }

  offerLetter() {

    this.askAI(`
  Generate a professional Offer Letter template.
  `);

  }

  talentSearch() {

    this.askAI(`
  Suggest strategies to find high-quality candidates for software engineering positions.
  `);

  }

  // ======================================================
  // ADMIN AI ACTIONS
  // ======================================================

  platformAnalytics() {

    this.askAI(`
  Analyze a Job Portal platform.

  Suggest important KPIs for administrators.
  `);

  }

  userInsights() {

    this.askAI(`
  Provide insights about user engagement.

  Include:

  - Active Users
  - Growth
  - Retention
  - Recommendations
  `);

  }

  companyReports() {

    this.askAI(`
  Generate a professional company performance report.
  `);

  }

  broadcastDraft() {

    this.askAI(`
  Create an announcement for all users of the Job Portal.
  `);

  }

  auditAnalysis() {

    this.askAI(`
  Explain recent audit log activities and highlight suspicious actions.
  `);

  }

  systemHealth() {

    this.askAI(`
  Analyze overall system health.

  Include:

  - API Health
  - Database
  - Performance
  - Recommendations
  `);

  }

  aiRecommendations() {

    this.askAI(`
  Suggest AI-powered improvements for a Job Portal platform.
  `);

  }

  executiveSummary() {

    this.askAI(`
  Generate an executive summary for platform administrators.
  `);

  }

  newChat(): void {

    const role =
      this.role() === 'SUPER_ADMIN'
        ? 'ADMIN'
        : (this.role() as 'CANDIDATE' | 'HR');

    this.aiService.createConversation(role)
      .subscribe({

        next: (conversation) => {

          this.selectedConversationId.set(conversation.id);

          this.conversations.update(list => [
            conversation,
            ...list
          ]);

          this.messages.set([
            {
              role: 'assistant',
              message: this.welcomeMessage,
              timestamp: new Date()
            }
          ]);

        },

        error: (err) => {

          console.error(err);

        }
      } 
    );

  }

  clearChat(): void {

    console.log('Clear Chat clicked');

    this.messages.set([
      {
        role: 'assistant',
        message: this.welcomeMessage,
        timestamp: new Date()
      }
    ]);

    this.message = '';

    this.selectedFiles = [];

    this.selectedConversationId.set(null);

    this.scrollToBottom();

  }

  exportChat(): void {

    const currentMessages = this.messages();

    if (!currentMessages.length) {
      return;
    }

    let exportContent = '';

    exportContent += '========================================\n';
    exportContent += '        AI CAREER CENTER - CHAT\n';
    exportContent += '========================================\n\n';

    exportContent += `Exported On: ${new Date().toLocaleString()}\n`;

    if (this.selectedConversationId()) {
      exportContent += `Conversation ID: ${this.selectedConversationId()}\n`;
    }

    exportContent += '\n';
    exportContent += '----------------------------------------\n\n';

    currentMessages.forEach((message) => {

      const sender =
        message.role === 'user'
          ? 'YOU'
          : 'AI CAREER ASSISTANT';

      exportContent += `${sender}\n`;
      exportContent += `${message.timestamp.toLocaleString()}\n`;
      exportContent += '\n';
      exportContent += `${message.message}\n`;
      exportContent += '\n';

      exportContent += '----------------------------------------\n\n';
    });

    exportContent += '========================================\n';
    exportContent += '              END OF CHAT\n';
    exportContent += '========================================\n';

    const blob = new Blob(
      [exportContent],
      {
        type: 'text/plain;charset=utf-8'
      }
    );

    const url = window.URL.createObjectURL(blob);

    const anchor = document.createElement('a');

    const date = new Date()
      .toISOString()
      .split('T')[0];

    anchor.href = url;
    anchor.download = `ai-career-chat-${date}.txt`;

    document.body.appendChild(anchor);

    anchor.click();

    document.body.removeChild(anchor);

    window.URL.revokeObjectURL(url);
  }

}
