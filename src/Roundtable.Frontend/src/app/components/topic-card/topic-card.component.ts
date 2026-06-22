/**
 * Shared topic shell (header, notes, tags, refs, footer). Used in:
 * - Meeting list: `layout="meeting"`, `notesMode="preview"` for truncated notes (search uses full notes for highlights)
 * - Focus view & presentation: `[layout]="'expanded'"`, `notesMode="full"`
 */
import { Component, computed, input, output } from '@angular/core';

import type { MeetingTopicDto } from './meeting-topic.model';
import {
  getHighlightedSegments,
  getTopicReferenceDocuments,
  getTopicTags,
  topicNotesIsTruncated,
  topicNotesPreview,
} from './topic-text.utils';

@Component({
  selector: 'app-topic-card',
  standalone: true,
  template: `
    <article
      class="topic-card"
      [class.topic-card--interactive]="interactive() && !isTopicDeleted()"
      [class.topic-card--expanded]="layout() === 'expanded'"
      [class.topic-card--deleted]="isTopicDeleted()"
      (click)="onShellClick($event)"
    >
      @if (isTopicDeleted()) {
        <header class="topic-card-deleted-banner" role="status">
          <span class="topic-card-deleted-id">{{ topic().displayId }}</span>
          <p class="topic-card-deleted-text">
            <span class="topic-card-deleted-lead">DELETED</span>
            by {{ topic().deletedByOrganisation?.trim() || '—' }} on {{ deletedAtLabel() }}
          </p>
        </header>
      } @else {
      <header class="topic-card-header">
        <h3 class="topic-card-title">
          @if (searchQuery().trim()) {
            @for (seg of highlightedTitle(); track $index) {
              @if (seg.match) {
                <mark class="topic-card-highlight">{{ seg.text }}</mark>
              } @else {
                <span>{{ seg.text }}</span>
              }
            }
          } @else {
            {{ topic().title }}
          }
        </h3>
        @if (topic().displayId) {
          <div class="topic-card-header-right">
            <span class="topic-display-id">{{ topic().displayId }}</span>
          </div>
        }
      </header>
      @if (contextLine()) {
        <p class="topic-card-context-line">{{ contextLine() }}</p>
      }
      <div class="topic-card-body" [class.topic-card-body--single]="refs().length === 0">
        <div class="topic-card-main">
          @if (topic().notes) {
            @if (notesMode() === 'preview' && topicNotesIsTruncated(topic().notes) && !searchQuery().trim()) {
              <p class="topic-card-notes topic-card-notes--preview">{{ topicNotesPreview(topic().notes) }}</p>
            } @else if (searchQuery().trim()) {
              <p class="topic-card-notes">
                @for (seg of highlightedNotes(); track $index) {
                  @if (seg.match) {
                    <mark class="topic-card-highlight">{{ seg.text }}</mark>
                  } @else {
                    <span>{{ seg.text }}</span>
                  }
                }
              </p>
            } @else {
              <p class="topic-card-notes">{{ topic().notes }}</p>
            }
          }
          @if (tags().length > 0) {
            <div class="topic-card-tags">
              @for (tag of tags(); track tag) {
                @if (tagsClickable()) {
                  <span
                    class="topic-card-tag"
                    data-topic-card-no-dialog
                    role="button"
                    tabindex="0"
                    (click)="onTagClick($event, tag)"
                    (keydown.enter)="onTagClick($event, tag)"
                    (keydown.space)="onTagClick($event, tag); $event.preventDefault()"
                  >
                    @if (searchQuery().trim()) {
                      @for (seg of getHighlightedSegments(tag, searchQuery()); track $index) {
                        @if (seg.match) {
                          <mark class="topic-card-highlight">{{ seg.text }}</mark>
                        } @else {
                          <span>{{ seg.text }}</span>
                        }
                      }
                    } @else {
                      {{ tag }}
                    }
                  </span>
                } @else {
                  <span class="topic-card-tag topic-card-tag--static">{{ tag }}</span>
                }
              }
            </div>
          }
        </div>
        @if (refs().length > 0) {
          <aside class="topic-card-refs-column" aria-label="References">
            <h4 class="topic-card-refs-heading">References</h4>
            <ul class="topic-card-refs-list">
              @for (ref of refs(); track ref) {
                <li>
                  <a [href]="ref" target="_blank" rel="noopener noreferrer" (click)="$event.stopPropagation()">
                    @if (searchQuery().trim()) {
                      @for (seg of getHighlightedSegments(ref, searchQuery()); track $index) {
                        @if (seg.match) {
                          <mark class="topic-card-highlight">{{ seg.text }}</mark>
                        } @else {
                          <span>{{ seg.text }}</span>
                        }
                      }
                    } @else {
                      {{ ref }}
                    }
                  </a>
                </li>
              }
            </ul>
          </aside>
        }
      </div>
      <ng-content select="[data-topic-after-body]"></ng-content>
      <footer class="topic-card-footer">
        <div class="topic-card-footer-created">
          <span class="topic-card-created-label">Created by</span>
          <span class="topic-card-created-name">{{ topic().createdByNickname?.trim() || '—' }}</span>
        </div>
        <div class="topic-card-footer-org-wrap">
          @if (topic().createdByOrganisation) {
            <span class="topic-card-org-footer">{{ topic().createdByOrganisation }}</span>
          } @else {
            <span class="topic-card-org-footer topic-card-org-footer--placeholder">—</span>
          }
        </div>
        <ng-content select="[data-topic-footer-actions]"></ng-content>
      </footer>
      }
    </article>
  `,
  styles: [
    `
      .topic-card {
        display: flex;
        flex-direction: column;
        padding: 0;
        border-radius: 12px;
        background: var(--m3-surface);
        border: 1px solid var(--m3-outline-variant);
        box-shadow: 0 1px 3px color-mix(in srgb, var(--m3-on-surface) 12%, transparent);
        overflow: hidden;
      }
      /* Focus view + presentation: full content, same shell as meeting list card */
      .topic-card--expanded {
        width: 100%;
        max-width: 100%;
        margin: 0;
        box-shadow: var(--m3-elevation-4);
        border-radius: var(--m3-shape-large);
      }
      .topic-card--deleted {
        cursor: default;
        overflow: hidden;
      }
      .topic-card--deleted .topic-card-deleted-banner {
        flex: 1;
      }
      .topic-card-deleted-banner {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px 16px;
        margin: 0;
        padding: 14px 18px;
        border-top: 4px solid var(--m3-error);
        background: color-mix(in srgb, var(--m3-error) 14%, var(--m3-surface));
        border-bottom: 1px solid color-mix(in srgb, var(--m3-error) 35%, var(--m3-outline-variant));
      }
      .topic-card-deleted-id {
        flex-shrink: 0;
        font-size: 0.875rem;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.02em;
        color: var(--m3-on-surface);
      }
      .topic-card-deleted-text {
        flex: 1;
        min-width: 0;
        margin: 0;
        font-size: 0.875rem;
        font-weight: 600;
        line-height: 1.4;
        color: var(--m3-on-surface);
      }
      .topic-card-deleted-lead {
        margin-right: 0.35em;
        font-weight: 800;
        letter-spacing: 0.06em;
        color: var(--m3-error);
      }
      .topic-card--interactive {
        cursor: pointer;
      }
      .topic-card--interactive .topic-card-tag:not(.topic-card-tag--static),
      .topic-card--interactive .topic-card-notes,
      .topic-card--interactive .topic-card-title {
        cursor: pointer;
      }
      .topic-card-tag--static {
        cursor: default;
      }
      .topic-card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 18px 20px 14px;
        border-bottom: 1px solid var(--m3-outline-variant);
      }
      .topic-card-title {
        margin: 0;
        flex: 1;
        min-width: 0;
        font-size: 1.0625rem;
        font-weight: 700;
        line-height: 1.35;
        letter-spacing: -0.01em;
        color: var(--m3-on-surface);
      }
      .topic-card-header-right {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
      }
      .topic-display-id {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 400;
        letter-spacing: 0.02em;
        color: var(--m3-on-surface-variant);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .topic-card-context-line {
        margin: 0;
        padding: 10px 20px 12px;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--m3-on-surface-variant);
        border-bottom: 1px solid var(--m3-outline-variant);
      }
      .topic-card-body {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(140px, 26%);
        gap: 0;
        align-items: stretch;
        min-height: 0;
      }
      .topic-card-body--single {
        grid-template-columns: 1fr;
      }
      .topic-card-main {
        padding: 16px 20px 18px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 0;
      }
      .topic-card-body:not(.topic-card-body--single) .topic-card-main {
        border-right: 1px solid var(--m3-outline-variant);
      }
      .topic-card-notes {
        margin: 0;
        font-size: 0.9375rem;
        line-height: 1.55;
        color: var(--m3-on-surface);
        white-space: pre-wrap;
      }
      .topic-card-notes--preview {
        white-space: pre-wrap;
        word-break: break-word;
      }
      .topic-card-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 4px 0 0;
      }
      .topic-card-tag {
        display: inline-block;
        padding: 5px 12px;
        font-size: 0.8125rem;
        font-weight: 500;
        color: #4a5d78;
        background: #e8eef6;
        border-radius: var(--m3-shape-full);
        cursor: pointer;
      }
      .topic-card-tag:hover:not(.topic-card-tag--static) {
        filter: brightness(0.97);
      }
      .topic-card-highlight {
        padding: 0;
        border-radius: 1px;
        background: #fef08a;
        color: #713f12;
        font-weight: 600;
      }
      .topic-card-refs-column {
        padding: 16px 18px 18px 20px;
        min-width: 0;
      }
      .topic-card-refs-heading {
        margin: 0 0 10px;
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--m3-on-surface-variant);
      }
      .topic-card-refs-list {
        margin: 0;
        padding-left: 1.1rem;
        font-size: 0.875rem;
        line-height: 1.5;
        color: var(--app-primary);
      }
      .topic-card-refs-list li {
        margin-bottom: 4px;
      }
      .topic-card-refs-list li::marker {
        color: var(--app-primary);
      }
      .topic-card-refs-list a {
        color: var(--app-primary);
        text-decoration: none;
        font-weight: 500;
        word-break: break-all;
      }
      .topic-card-refs-list a:hover {
        text-decoration: underline;
      }
      .topic-card-footer {
        position: relative;
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        column-gap: 14px;
        padding: 16px 20px 18px;
        border-top: 1px solid var(--m3-outline-variant);
        background: color-mix(in srgb, var(--app-primary) 7%, var(--m3-surface));
      }
      .topic-card-footer-created {
        grid-column: 1;
        justify-self: start;
        min-width: 0;
        max-width: 100%;
        text-align: left;
      }
      .topic-card-created-label {
        display: block;
        font-size: 0.625rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--m3-on-surface-variant);
        opacity: 0.72;
      }
      .topic-card-created-name {
        display: block;
        margin-top: 3px;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--m3-on-surface);
        line-height: 1.3;
        word-break: break-word;
      }
      .topic-card-footer-org-wrap {
        grid-column: 2;
        justify-self: center;
        min-width: 0;
        max-width: 100%;
        text-align: center;
      }
      ::ng-deep [data-topic-footer-actions] {
        grid-column: 3;
        justify-self: end;
        align-self: center;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .topic-card-org-footer {
        font-size: 1rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: var(--app-primary);
        text-align: center;
      }
      .topic-card-org-footer--placeholder {
        font-weight: 500;
        font-size: 0.9375rem;
        color: var(--m3-on-surface-variant);
        letter-spacing: normal;
      }
    `,
  ],
})
export class TopicCardComponent {
  readonly topic = input.required<MeetingTopicDto>();
  /** Search highlighting; empty = no highlight. */
  readonly searchQuery = input('');
  readonly contextLine = input<string | null>(null);
  readonly notesMode = input<'preview' | 'full'>('full');
  readonly interactive = input(false);
  /**
   * `meeting` = list/search (default). `expanded` = focus view & presentation (elevated, large radius, full width of parent).
   */
  readonly layout = input<'meeting' | 'expanded'>('meeting');
  readonly tagsClickable = input(true);

  readonly cardClick = output<MouseEvent>();
  readonly tagSelected = output<string>();

  protected readonly isTopicDeleted = computed(() => this.topic().isDeleted === true);

  protected readonly deletedAtLabel = computed(() => {
    const iso = this.topic().deletedAtUtc;
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });

  protected readonly tags = computed(() =>
    this.topic().isDeleted ? [] : getTopicTags(this.topic().tags),
  );
  protected readonly refs = computed(() =>
    this.topic().isDeleted ? [] : getTopicReferenceDocuments(this.topic().referenceDocumentsJson),
  );

  protected readonly highlightedTitle = computed(() =>
    getHighlightedSegments(this.topic().title, this.searchQuery()),
  );

  protected readonly highlightedNotes = computed(() =>
    getHighlightedSegments(this.topic().notes, this.searchQuery()),
  );

  protected readonly topicNotesIsTruncated = topicNotesIsTruncated;
  protected readonly topicNotesPreview = topicNotesPreview;
  protected readonly getHighlightedSegments = getHighlightedSegments;

  onShellClick(ev: MouseEvent): void {
    if (!this.interactive() || this.topic().isDeleted) return;
    const el = ev.target as HTMLElement;
    if (el.closest('button, a, textarea, input, [data-topic-card-no-dialog]')) return;
    this.cardClick.emit(ev);
  }

  onTagClick(ev: Event, tag: string): void {
    ev.stopPropagation();
    this.tagSelected.emit(tag);
  }
}
