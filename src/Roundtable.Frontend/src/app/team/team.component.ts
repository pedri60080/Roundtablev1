import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { finalize, firstValueFrom, map, of } from 'rxjs';
import type { Team } from '../teams';
import { DemoVersionSettingsService } from '../demo-version-settings.service';
import { TopicCardComponent } from '../components/topic-card/topic-card.component';
import { TopicMinuteNotesCardComponent } from '../components/topic-card/topic-minute-notes-card.component';
import type { MeetingTopicDto, TopicWithMeetingDto } from '../components/topic-card/meeting-topic.model';
import { getTopicReferenceDocuments, getTopicTags } from '../components/topic-card/topic-text.utils';

export type { MeetingTopicDto, TopicWithMeetingDto } from '../components/topic-card/meeting-topic.model';

export interface MeetingDto {
  id: number;
  teamId: string;
  date: string;
  status: string;
  title?: string;
  notes?: string;
  createdAtUtc: string;
}

type RightPanel = 'none' | 'new' | { type: 'meeting'; meeting: MeetingDto };

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [RouterLink, TopicCardComponent, TopicMinuteNotesCardComponent],
  template: `
    @if (team) {
      <div class="team-page">
        <header class="team-header">
          <div class="team-header-top">
            <a routerLink="/" class="back-link">
              <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
              Back to teams
            </a>
          </div>
          <div class="team-title-row">
            @if (isImageIcon(team.icon)) {
              <img [src]="team.icon" [alt]="team.name + ' icon'" class="team-icon team-icon--image" />
            } @else {
              <span class="team-icon material-symbols-outlined" aria-hidden="true">{{ team.icon }}</span>
            }
            <h1 class="team-name">{{ team.name }}</h1>
            <a class="team-settings-btn" [routerLink]="['/team', team.id, 'settings']">
              <span class="material-symbols-outlined" aria-hidden="true">settings</span>
              Team settings
            </a>
          </div>
        </header>
        <div class="team-body">
          <aside class="team-sidebar">
            @if (!filterPanelOpen()) {
            <div class="sidebar-search">
              <span class="sidebar-search-icon material-symbols-outlined" aria-hidden="true">search</span>
              <input
                type="search"
                class="sidebar-search-input"
                placeholder="Search meeting topics"
                [value]="searchQuery()"
                (input)="searchQuery.set($any($event.target).value)"
                aria-label="Search meeting topics"
              />
              @if (searchQuery().trim()) {
                <button type="button" class="sidebar-search-clear" (click)="searchQuery.set('')" aria-label="Clear search">
                  <span class="material-symbols-outlined" aria-hidden="true">close</span>
                </button>
              }
            </div>
            @if (activeFilterCount() > 0) {
            <div class="filter-chips">
              @if (filterDateFrom()) {
                <div class="filter-chip">
                  <span class="filter-chip-label">≥ {{ filterDateFrom() }}</span>
                  <button type="button" class="filter-chip-remove" (click)="clearFilterDateFrom()" aria-label="Remove from date filter">
                    <span class="material-symbols-outlined" aria-hidden="true">close</span>
                  </button>
                </div>
              }
              @if (filterDateTo()) {
                <div class="filter-chip">
                  <span class="filter-chip-label">≤ {{ filterDateTo() }}</span>
                  <button type="button" class="filter-chip-remove" (click)="clearFilterDateTo()" aria-label="Remove to date filter">
                    <span class="material-symbols-outlined" aria-hidden="true">close</span>
                  </button>
                </div>
              }
              @for (tag of filterTagsSelectedList(); track tag) {
                <div class="filter-chip">
                  <span class="filter-chip-label">{{ tag }}</span>
                  <button type="button" class="filter-chip-remove" (click)="clearTagFilter(tag)" aria-label="Remove tag filter">
                    <span class="material-symbols-outlined" aria-hidden="true">close</span>
                  </button>
                </div>
              }
            </div>
            }
            <div class="sidebar-card sidebar-card--active">
              <div class="sidebar-card-head">
                <h2 class="sidebar-card-title">Active meetings</h2>
                @if (canCreateMeetings()) {
                  <button type="button" class="add-btn" (click)="onAddMeeting()">
                    <span class="material-symbols-outlined add-btn-icon" aria-hidden="true">add</span>
                    Add
                  </button>
                }
              </div>
              <ul class="meetings-list">
                @for (meeting of filteredActiveMeetings(); track meeting.id) {
                  <li>
                    <button
                      type="button"
                      class="meetings-list-item"
                      [class.meetings-list-item--active]="openedMeeting()?.id === meeting.id"
                      [class.meetings-list-item--today]="isMeetingToday(meeting.date)"
                      (click)="openMeeting(meeting)"
                    >
                      {{ formatMeetingLabel(meeting.date) }}
                    </button>
                  </li>
                }
                @if (filteredActiveMeetings().length === 0 && !activeMeetingsLoading()) {
                  <li class="meetings-list-empty">No active meetings</li>
                }
                @if (filteredActiveMeetings().length === 0 && activeMeetingsLoading()) {
                  <li class="meetings-list-empty">Loading…</li>
                }
              </ul>
            </div>
            <div class="sidebar-card sidebar-card--archive">
              <h2 class="sidebar-card-title">Archive</h2>
              <ul class="meetings-list">
                @for (meeting of filteredArchivedMeetings(); track meeting.id) {
                  <li>
                    <button
                      type="button"
                      class="meetings-list-item"
                      [class.meetings-list-item--active]="openedMeeting()?.id === meeting.id"
                      [class.meetings-list-item--today]="isMeetingToday(meeting.date)"
                      (click)="openMeeting(meeting)"
                    >
                      {{ formatMeetingLabel(meeting.date) }}
                    </button>
                  </li>
                }
                @if (filteredArchivedMeetings().length === 0 && !archivedMeetingsLoading()) {
                  <li class="meetings-list-empty">No archived meetings</li>
                }
                @if (filteredArchivedMeetings().length === 0 && archivedMeetingsLoading()) {
                  <li class="meetings-list-empty">Loading…</li>
                }
              </ul>
            </div>
            <button type="button" class="filter-bar-btn" (click)="openFilterPanel()">
              <span class="material-symbols-outlined filter-btn-icon">tune</span>
              Filter
              @if (activeFilterCount() > 0) {
                <span class="filter-btn-badge">{{ activeFilterCount() }}</span>
              }
            </button>
            }
            @if (filterPanelOpen()) {
            <div class="filter-panel-in-sidebar">
              <h3 class="filter-panel-title">Filters</h3>
              <div class="form-field">
                <label for="filter-date-from">From date</label>
                <input id="filter-date-from" type="date" class="form-input" [value]="filterDateFrom()" (input)="filterDateFrom.set($any($event.target).value)" />
              </div>
              <div class="form-field">
                <label for="filter-date-to">To date</label>
                <input id="filter-date-to" type="date" class="form-input" [value]="filterDateTo()" (input)="filterDateTo.set($any($event.target).value)" />
              </div>
              @if (tagCountsSorted().length > 0) {
              <div class="filter-panel-tags">
                <h4 class="filter-panel-tags-title">Tags</h4>
                @for (item of visibleTagCounts(); track item.tag) {
                  <label class="filter-panel-tag-option">
                    <input type="checkbox" [checked]="filterTagsSelected().has(item.tag)" (change)="toggleTagFilter(item.tag)" />
                    <span class="filter-panel-tag-label">{{ item.tag }}</span>
                    <span class="filter-panel-tag-count">({{ item.count }})</span>
                  </label>
                }
                @if (hasMoreTags() && !showAllTags()) {
                  <button type="button" class="filter-panel-show-all" (click)="showAllTags.set(true)">Show all</button>
                }
              </div>
              }
              <div class="filter-panel-actions">
                <button type="button" class="btn-primary filter-apply-btn" (click)="applyFilterPanel()">Show {{ filteredMeetingsCount() }} meetings</button>
              </div>
            </div>
            }
          </aside>
          @if (isRightPanelCardVisible()) {
            <div class="add-meeting-card">
              <div class="add-meeting-card-header">
                <h2 class="add-meeting-card-title">
                  @if (searchQuery().trim()) {
                    Search results
                  } @else if (rightPanel() === 'new') {
                    New meeting
                  } @else if (showAddTopicForm()) {
                    @if (editTopicId() != null) { Edit topic } @else { New topic }
                  } @else if (openedMeeting()) {
                    {{ formatMeetingTitleLong(openedMeeting()!.date) }}
                  }
                </h2>
                <button type="button" class="close-card-btn" (click)="closeRightPanel()" aria-label="Close">
                  <span class="material-symbols-outlined" aria-hidden="true">close</span>
                </button>
              </div>
              <div class="add-meeting-card-body">
                @if (searchQuery().trim()) {
                  @if (allTeamTopicsLoading()) {
                    <p class="meeting-topics-loading">Loading topics…</p>
                  } @else {
                    <div class="topics-list search-results-list">
                      @for (topic of searchFilteredTopics(); track topic.id) {
                        @let prevTopic = $index > 0 ? searchFilteredTopics()[$index - 1] : null;
                        <div class="search-result-block">
                          @if (prevTopic === null || prevTopic.meetingId !== topic.meetingId) {
                            <p class="search-result-meeting-date">{{ formatMeetingTitleLong(topic.meetingDate) }}</p>
                          }
                          <app-topic-card
                            [topic]="topic"
                            [searchQuery]="searchQuery()"
                            notesMode="preview"
                            [interactive]="topic.isDeleted !== true"
                            (cardClick)="onTopicCardOpenClick($event, topic)"
                            (tagSelected)="searchByTag($event)"
                          />
                        </div>
                      }
                      @if (searchFilteredTopics().length === 0) {
                        <p class="meeting-topics-loading">No topics match your search.</p>
                      }
                    </div>
                  }
                } @else if (rightPanel() === 'new') {
                  <div class="add-meeting-form">
                    <div class="form-field">
                      <label for="meeting-date">Date</label>
                      <input
                        id="meeting-date"
                        type="date"
                        class="form-input"
                        [value]="meetingDate()"
                        (input)="meetingDate.set($any($event.target).value)"
                      />
                    </div>
                    <div class="form-actions">
                      <button type="button" class="btn-cancel" (click)="closeRightPanel()">Cancel</button>
                      <button type="button" class="btn-primary" [disabled]="createInProgress || !canCreateMeetings()" (click)="createMeeting()">Create meeting</button>
                    </div>
                  </div>
                } @else if (openedMeeting() && !showAddTopicForm()) {
                  <div class="meeting-view">
                    <div class="meeting-view-toolbar">
                      <div class="meeting-view-toolbar-left">
                        @if (openedMeeting()?.status !== 'archived' && canCreateTopics()) {
                          <button type="button" class="add-topic-btn" (click)="openAddTopicForm()">
                            <span class="material-symbols-outlined add-topic-btn-icon" aria-hidden="true">add</span>
                            Add topic
                          </button>
                        }
                      </div>
                      <div class="meeting-view-toolbar-right">
                        @if (openedMeeting()?.status !== 'archived' && meetingTopics().length > 0) {
                          <button type="button" class="start-meeting-btn" (click)="openPresentationRoleDialog()">
                            <span class="material-symbols-outlined start-meeting-btn-icon" aria-hidden="true">slideshow</span>
                            Start meeting
                          </button>
                        }
                        <button
                          type="button"
                          class="download-meeting-pdf-btn"
                          [disabled]="pdfDownloadInProgress()"
                          (click)="downloadMeetingPdf()"
                        >
                          <span class="material-symbols-outlined download-meeting-pdf-btn-icon" aria-hidden="true">download</span>
                          {{ pdfDownloadInProgress() ? 'Generating…' : 'Download PDF' }}
                        </button>
                      </div>
                    </div>
                    <div class="meeting-view-content">
                      @if (meetingTopicsLoading()) {
                        <p class="meeting-topics-loading">Loading topics…</p>
                      } @else {
                        <div class="topics-list">
                          @for (topic of meetingTopics(); track topic.id) {
                            <app-topic-card
                              [topic]="topic"
                              notesMode="preview"
                              [interactive]="topic.isDeleted !== true"
                              (cardClick)="onTopicCardOpenClick($event, topic)"
                              (tagSelected)="searchByTag($event)"
                            >
                              @if (showMinuteNotesOnMeetingTopicCard(topic)) {
                                <app-topic-minute-notes-card
                                  data-topic-after-body
                                  variant="embedded"
                                  [readonly]="true"
                                  [body]="meetingCardMinuteBody(topic)"
                                  [isDraft]="meetingCardMinuteIsDraft(topic)"
                                  [error]="meetingCardMinuteSaveError() === topic.id ? 'Save failed. Try again.' : null"
                                />
                              }
                              @if ((openedMeeting()?.status !== 'archived' && topic.canEdit) || topic.canDelete) {
                                <div data-topic-footer-actions>
                                  @if (openedMeeting()?.status !== 'archived' && topic.canEdit) {
                                    <button type="button" class="topic-action-icon" (click)="openEditTopicForm(topic)" aria-label="Edit topic">
                                      <span class="material-symbols-outlined" aria-hidden="true">edit</span>
                                    </button>
                                  }
                                  @if (topic.canDelete) {
                                    <button type="button" class="topic-action-icon topic-action-icon--danger" (click)="deleteTopic(topic)" aria-label="Delete topic">
                                      <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                                    </button>
                                  }
                                </div>
                              }
                            </app-topic-card>
                          }
                        </div>
                      }
                      <div class="meeting-view-actions">
                        <button type="button" class="meeting-action-btn meeting-action-btn--delete" [disabled]="meetingActionInProgress() || !canWrite()" (click)="deleteMeeting()">Delete</button>
                        @if (openedMeeting()?.status !== 'archived') {
                          <button type="button" class="meeting-action-btn meeting-action-btn--archive" [disabled]="meetingActionInProgress() || !canWrite()" (click)="archiveMeeting()">Archive</button>
                        }
                      </div>
                    </div>
                  </div>
                } @else if (openedMeeting() && showAddTopicForm()) {
                  <div class="add-topic-form">
                    <div class="form-field">
                      <label for="topic-title">Title</label>
                      <input id="topic-title" type="text" class="form-input" required [value]="topicTitle()" (input)="topicTitle.set($any($event.target).value)" />
                    </div>
                    <div class="form-field">
                      <label for="topic-notes">Notes</label>
                      <textarea id="topic-notes" class="form-textarea" rows="4" required [value]="topicNotes()" (input)="topicNotes.set($any($event.target).value)"></textarea>
                    </div>
                    <div class="form-field">
                      <label for="topic-tags">Tags</label>
                      <input id="topic-tags" type="text" class="form-input" [value]="topicTags()" (input)="topicTags.set($any($event.target).value)" placeholder="Comma-separated" />
                    </div>
                    <div class="form-field">
                      <label>Reference documents</label>
                      @for (ref of topicReferenceDocuments(); track $index) {
                        <div class="form-ref-row">
                          <input type="text" class="form-input" [value]="ref" (input)="updateRef($index, $any($event.target).value)" placeholder="URL or document reference" />
                          <button type="button" class="form-ref-remove" (click)="removeRef($index)" aria-label="Remove">×</button>
                        </div>
                      }
                      <button type="button" class="form-ref-add" (click)="addRef()">+ Add reference</button>
                    </div>
                    <div class="form-actions">
                      <button type="button" class="btn-cancel" (click)="closeTopicForm()">Cancel</button>
                      <button
                        type="button"
                        class="btn-primary"
                        [disabled]="topicCreateInProgress() || (editTopicId() == null && !canCreateTopics())"
                        (click)="saveTopic()"
                      >
                        @if (editTopicId() != null) { Save changes } @else { Create topic }
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          } @else {
            <main class="team-main">
              <p class="team-welcome">Welcome to your team area.</p>
            </main>
          }
        </div>
      </div>

      @if (showPresentationRoleDialog() && includingMinutesEnabled()) {
        <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Choose presentation role">
          <div class="presentation-role-modal">
            <h2 class="presentation-role-modal-title">Start meeting</h2>
            <p class="presentation-role-modal-subtitle">How do you want to join this presentation?</p>
            <div class="presentation-role-options">
              <button type="button" class="presentation-role-option" (click)="confirmPresentationRole('viewer')">
                <span class="presentation-role-option-label">Any person</span>
                <span class="presentation-role-option-desc">Normal presentation view</span>
              </button>
              <button type="button" class="presentation-role-option" (click)="confirmPresentationRole('minuteTaker')">
                <span class="presentation-role-option-label">Minute taker</span>
                <span class="presentation-role-option-desc">Take notes during the meeting</span>
              </button>
            </div>
            <div class="presentation-role-modal-footer">
              <button type="button" class="btn-cancel" (click)="cancelPresentationRoleDialog()">Cancel</button>
            </div>
          </div>
        </div>
      }

      @if (topicDetailDialogTopicId() != null && topicDetailTopic(); as dt) {
        <div class="presentation-overlay topic-focus-overlay" role="dialog" aria-modal="true" aria-label="Topic focus">
          <div class="presentation-backdrop"></div>
          <div class="presentation-content" (click)="closeTopicDetailDialog()">
            <div class="presentation-cards-stack" (click)="$event.stopPropagation()">
              <app-topic-card
                [topic]="dt"
                [layout]="'expanded'"
                notesMode="full"
                [interactive]="dt.isDeleted !== true"
                (tagSelected)="searchByTag($event); closeTopicDetailDialog()"
              />
              @if (includingMinutesEnabled()) {
                @if (!isTopicMeetingArchived(dt)) {
                  @if (!topicHasMinuteNotesOnCard(dt) && !focusViewMinuteExpanded()) {
                    <div class="topic-focus-add-note-row">
                      <button type="button" class="topic-focus-add-note-btn" (click)="focusViewMinuteExpanded.set(true)">Add note</button>
                    </div>
                  }
                  @if (topicHasMinuteNotesOnCard(dt) || focusViewMinuteExpanded()) {
                    <app-topic-minute-notes-card
                      variant="presentation"
                      [textareaRows]="5"
                      [body]="meetingCardMinuteBody(dt)"
                      [isDraft]="meetingCardMinuteIsDraft(dt)"
                      [disabled]="meetingCardMinuteSaving() === dt.id"
                      [error]="meetingCardMinuteSaveError() === dt.id ? 'Save failed. Try again.' : null"
                      [ariaLabel]="'Minutes for ' + dt.title"
                      (bodyChange)="onMeetingCardMinuteInput(dt.id, $event)"
                      (save)="saveMeetingCardMinuteNote(dt.id)"
                      (markFinal)="markMeetingCardMinuteFinal(dt.id)"
                      (cancel)="onFocusViewMinuteCancel(dt)"
                      (delete)="deleteMeetingCardMinuteNote(dt.id)"
                    />
                  }
                } @else if (topicHasMinuteNotesOnCard(dt)) {
                  <app-topic-minute-notes-card
                    variant="presentation"
                    [readonly]="true"
                    [body]="meetingCardMinuteBody(dt)"
                    [isDraft]="meetingCardMinuteIsDraft(dt)"
                  />
                }
              }
            </div>
          </div>
        </div>
      }

      @if (presentationMode() && openedMeeting() && meetingTopics().length > 0) {
        <div class="presentation-overlay" role="dialog" aria-modal="true" aria-label="Presentation mode">
          <div class="presentation-backdrop"></div>
          <div class="presentation-content">
            <div class="presentation-cards-stack">
              @let topic = meetingTopics()[presentationTopicIndex()];
              @if (topic) {
                <app-topic-card
                  [topic]="topic"
                  [layout]="'expanded'"
                  notesMode="full"
                  [interactive]="false"
                  [tagsClickable]="false"
                />
                @if (includingMinutesEnabled() && presentationRole() === 'minuteTaker') {
                  <app-topic-minute-notes-card
                    variant="presentation"
                    [body]="minuteNoteBodyForTopic(topic.id)"
                    [isDraft]="minuteNoteIsDraftForTopic(topic.id)"
                    [readonly]="false"
                    [disabled]="minuteNoteSaving()"
                    [error]="minuteNoteSaveError()"
                    [textareaRows]="5"
                    [ariaLabel]="'Minutes for ' + topic.title"
                    (bodyChange)="onPresentationMinuteNoteInput(topic.id, $event)"
                    (save)="savePresentationMinuteNote()"
                    (markFinal)="markPresentationMinuteFinal()"
                    (cancel)="cancelPresentationMinuteNote()"
                    (delete)="deletePresentationMinuteNote()"
                  />
                }
              }
            </div>
          </div>
          <div class="presentation-nav">
            <span class="presentation-counter">Topic {{ presentationTopicIndex() + 1 }} of {{ meetingTopics().length }}</span>
            <div class="presentation-nav-buttons">
              <button type="button" class="presentation-nav-btn" [disabled]="presentationTopicIndex() <= 0 || minuteNoteSaving()" (click)="presentationPrev()" aria-label="Previous topic">
                <span class="material-symbols-outlined" aria-hidden="true">chevron_left</span>
                Previous
              </button>
              <button type="button" class="presentation-nav-btn" [disabled]="presentationTopicIndex() >= meetingTopics().length - 1 || minuteNoteSaving()" (click)="presentationNext()" aria-label="Next topic">
                Next
                <span class="material-symbols-outlined" aria-hidden="true">chevron_right</span>
              </button>
            </div>
            <button type="button" class="presentation-end-btn" [disabled]="minuteNoteSaving()" (click)="closePresentation()">End meeting</button>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .team-page {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100vh;
      max-height: 100vh;
      overflow: hidden;
      padding: 24px;
      box-sizing: border-box;
    }
    .team-header {
      padding-bottom: 24px;
      border-bottom: 2px solid var(--app-primary);
      margin-bottom: 24px;
    }
    .team-header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--app-primary);
      text-decoration: none;
      font-size: 0.9375rem;
      font-weight: 500;
    }
    .back-link:hover {
      text-decoration: underline;
    }
    .back-link .material-symbols-outlined {
      font-size: 20px;
    }
    .team-title-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .team-settings-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: var(--m3-shape-small);
      border: 1px solid var(--app-primary);
      background: color-mix(in srgb, var(--app-primary) 10%, transparent);
      color: var(--app-primary);
      font-weight: 700;
      text-decoration: none;
      margin-left: auto;
    }
    .team-settings-btn:hover {
      background: color-mix(in srgb, var(--app-primary) 16%, transparent);
    }
    .team-settings-btn .material-symbols-outlined {
      font-size: 20px;
    }
    .team-icon {
      font-size: 48px;
      color: var(--app-primary);
      flex-shrink: 0;
    }
    .team-icon--image {
      width: 48px;
      height: 48px;
      object-fit: contain;
      display: block;
    }
    .team-name {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0;
      color: var(--m3-on-surface);
    }
    .team-body {
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;
      gap: 24px;
    }
    .team-sidebar {
      flex-shrink: 0;
      width: 240px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-height: 0;
    }
    .sidebar-search {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: var(--m3-shape-small);
      background: var(--m3-surface-container-low);
      border: 1px solid var(--m3-outline-variant);
    }
    .sidebar-search-icon {
      font-size: 20px;
      color: var(--m3-on-surface-variant);
      flex-shrink: 0;
    }
    .sidebar-search-input {
      flex: 1;
      min-width: 0;
      padding: 0;
      border: none;
      background: none;
      font-family: inherit;
      font-size: 0.9375rem;
      color: var(--m3-on-surface);
    }
    .sidebar-search-input::placeholder {
      color: var(--m3-on-surface-variant);
    }
    .sidebar-search-input:focus {
      outline: none;
    }
    .sidebar-search-clear {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      border: none;
      border-radius: var(--m3-shape-full);
      background: transparent;
      color: var(--m3-on-surface-variant);
      cursor: pointer;
      flex-shrink: 0;
    }
    .sidebar-search-clear:hover {
      background: color-mix(in srgb, var(--m3-on-surface) 8%, transparent);
      color: var(--m3-on-surface);
    }
    .sidebar-search-clear .material-symbols-outlined {
      font-size: 18px;
    }
    .filter-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px 6px 12px;
      border-radius: var(--m3-shape-full);
      background: var(--m3-primary-container);
      color: var(--m3-on-primary-container);
      font-size: 0.8125rem;
      font-weight: 500;
    }
    .filter-chip-label {
      white-space: nowrap;
    }
    .filter-chip-remove {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      padding: 0;
      border: none;
      border-radius: var(--m3-shape-full);
      background: transparent;
      color: var(--m3-on-primary-container);
      cursor: pointer;
      transition: background 0.2s;
    }
    .filter-chip-remove:hover {
      background: color-mix(in srgb, var(--m3-on-primary-container) 15%, transparent);
    }
    .filter-chip-remove .material-symbols-outlined {
      font-size: 18px;
    }
    .sidebar-card {
      display: flex;
      flex-direction: column;
      padding: 20px;
      border-radius: var(--m3-shape-medium);
      background: var(--m3-surface-container-low);
      border: 1px solid var(--m3-outline-variant);
      box-shadow: var(--m3-elevation-1);
    }
    .sidebar-card--active {
      flex: 0 1 auto;
      min-height: 0;
      max-height: 50%;
    }
    .sidebar-card--archive {
      flex: 1 1 0;
      min-height: 0;
    }
    .sidebar-card-head {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .sidebar-card-title {
      flex-shrink: 0;
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--m3-on-surface);
    }
    .add-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 8px 12px;
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      color: var(--app-primary);
      background: transparent;
      border: 1px solid var(--app-primary);
      border-radius: var(--m3-shape-small);
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }
    .add-btn:hover {
      background: color-mix(in srgb, var(--app-primary) 8%, transparent);
    }
    .add-btn-icon {
      font-size: 18px;
    }
    .meetings-list {
      list-style: none;
      margin: 12px 0 0;
      padding: 0;
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }
    .meetings-list-item {
      width: 100%;
      text-align: left;
      font-size: 0.875rem;
      color: var(--m3-on-surface-variant);
      padding: 6px 0;
      border: none;
      border-bottom: 1px solid var(--m3-outline-variant);
      background: none;
      font-family: inherit;
      cursor: pointer;
    }
    .meetings-list-item:hover {
      color: var(--app-primary);
    }
    .meetings-list-item--active {
      color: var(--app-primary);
      font-weight: 600;
      background: color-mix(in srgb, var(--app-primary) 12%, transparent);
    }
    .meetings-list-item--active:hover {
      color: var(--app-primary);
    }
    .meetings-list-item--today {
      font-weight: 600;
      background: color-mix(in srgb, var(--app-primary) 8%, transparent);
      border-left: 3px solid var(--app-primary);
      padding-left: 8px;
    }
    .meetings-list-item--today.meetings-list-item--active {
      background: color-mix(in srgb, var(--app-primary) 12%, transparent);
    }
    .meetings-list li:last-child .meetings-list-item,
    .meetings-list-empty {
      border-bottom: none;
    }
    .meetings-list-empty {
      font-size: 0.875rem;
      color: var(--m3-on-surface-variant);
      padding: 6px 0;
      font-style: italic;
    }
    .filter-bar-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      min-width: 0;
      min-height: 44px;
      padding: 10px 16px;
      font-family: inherit;
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--m3-on-tertiary-container);
      background: var(--m3-tertiary-container);
      border: none;
      border-radius: var(--m3-shape-small);
      cursor: pointer;
      box-shadow: var(--m3-elevation-1);
    }
    .filter-bar-btn:hover {
      filter: brightness(0.96);
    }
    .filter-bar-btn .filter-btn-icon {
      font-size: 22px;
    }
    .filter-bar-btn .filter-btn-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--m3-tertiary-container);
      background: var(--m3-on-tertiary-container);
      border-radius: var(--m3-shape-full);
    }
    .filter-panel-in-sidebar {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      padding: 20px;
      border-radius: var(--m3-shape-medium);
      background: var(--m3-surface-container-low);
      border: 1px solid var(--m3-outline-variant);
      box-shadow: var(--m3-elevation-1);
      overflow-y: auto;
    }
    .filter-panel-title {
      margin: 0 0 16px;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--m3-on-surface);
    }
    .filter-panel-in-sidebar .form-field {
      margin-bottom: 16px;
    }
    .filter-panel-tags {
      margin-bottom: 16px;
    }
    .filter-panel-tags-title {
      margin: 0 0 10px;
      font-size: 1rem;
      font-weight: 600;
      color: var(--m3-on-surface);
    }
    .filter-panel-tag-option {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      font-size: 0.9375rem;
      color: var(--m3-on-surface);
      cursor: pointer;
    }
    .filter-panel-tag-option input {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      accent-color: var(--app-primary);
    }
    .filter-panel-tag-label {
      flex: 1;
    }
    .filter-panel-tag-count {
      color: var(--m3-on-surface-variant);
      font-size: 0.875rem;
    }
    .filter-panel-show-all {
      margin-top: 6px;
      padding: 4px 0;
      font-family: inherit;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--app-primary);
      background: none;
      border: none;
      cursor: pointer;
    }
    .filter-panel-show-all:hover {
      text-decoration: underline;
    }
    .filter-panel-actions {
      margin-top: auto;
      padding-top: 20px;
      border-top: 1px solid var(--m3-outline-variant);
    }
    .filter-apply-btn {
      width: 100%;
      min-height: 44px;
    }
    .team-main {
      flex: 1;
      min-width: 0;
      color: var(--m3-on-surface-variant);
    }
    .team-welcome {
      margin: 0;
      font-size: 1.125rem;
    }
    .add-meeting-card {
      flex: 1;
      min-width: 0;
      min-height: 0;
      display: flex;
      flex-direction: column;
      border-radius: var(--m3-shape-medium);
      background: var(--m3-surface-container-low);
      border: 1px solid var(--m3-outline-variant);
      box-shadow: var(--m3-elevation-1);
      overflow: hidden;
    }
    .add-meeting-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--m3-outline-variant);
      flex-shrink: 0;
    }
    .add-meeting-card-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--m3-on-surface);
    }
    .close-card-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
      font-size: 0;
      color: var(--m3-on-surface-variant);
      background: transparent;
      border: none;
      border-radius: var(--m3-shape-small);
      cursor: pointer;
    }
    .close-card-btn:hover {
      background: color-mix(in srgb, var(--m3-on-surface) 8%, transparent);
      color: var(--m3-on-surface);
    }
    .close-card-btn .material-symbols-outlined {
      font-size: 24px;
    }
    .add-meeting-card-body {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding: 20px;
    }
    .add-meeting-form,
    .add-topic-form {
      max-width: 560px;
      overflow: auto;
    }
    .form-textarea {
      width: 100%;
      padding: 10px 12px;
      font-family: inherit;
      font-size: 0.9375rem;
      border: 1px solid var(--m3-outline);
      border-radius: var(--m3-shape-small);
      color: var(--m3-on-surface);
      background: var(--m3-surface);
      box-sizing: border-box;
      resize: vertical;
    }
    .form-textarea:focus {
      outline: none;
      border-color: var(--app-primary);
    }
    .form-ref-row {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }
    .form-ref-row .form-input {
      flex: 1;
    }
    .form-ref-remove {
      flex-shrink: 0;
      width: 36px;
      padding: 0;
      font-size: 1.25rem;
      line-height: 1;
      color: var(--m3-on-surface-variant);
      background: transparent;
      border: 1px solid var(--m3-outline);
      border-radius: var(--m3-shape-small);
      cursor: pointer;
    }
    .form-ref-remove:hover {
      background: color-mix(in srgb, var(--m3-on-surface) 8%, transparent);
    }
    .form-ref-add {
      margin-top: 4px;
      padding: 6px 0;
      font-family: inherit;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--app-primary);
      background: none;
      border: none;
      cursor: pointer;
    }
    .form-ref-add:hover {
      text-decoration: underline;
    }
    .form-field {
      margin-bottom: 20px;
    }
    .form-field label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--m3-on-surface);
      margin-bottom: 6px;
    }
    .form-input {
      width: 100%;
      padding: 10px 12px;
      font-family: inherit;
      font-size: 0.9375rem;
      border: 1px solid var(--m3-outline);
      border-radius: var(--m3-shape-small);
      color: var(--m3-on-surface);
      background: var(--m3-surface);
      box-sizing: border-box;
    }
    .form-input:focus {
      outline: none;
      border-color: var(--app-primary);
    }
    .form-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 24px;
    }
    .btn-cancel {
      padding: 10px 20px;
      font-family: inherit;
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--app-primary);
      background: transparent;
      border: 1px solid var(--app-primary);
      border-radius: var(--m3-shape-small);
      cursor: pointer;
    }
    .btn-cancel:hover {
      background: color-mix(in srgb, var(--app-primary) 8%, transparent);
    }
    .btn-primary {
      padding: 10px 20px;
      font-family: inherit;
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--app-on-primary);
      background: var(--app-primary);
      border: none;
      border-radius: var(--m3-shape-small);
      cursor: pointer;
    }
    .btn-primary:hover:not(:disabled) {
      opacity: 0.92;
    }
    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .meeting-view {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      padding: 0;
    }
    .meeting-view-toolbar {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }
    .meeting-view-toolbar-left,
    .meeting-view-toolbar-right {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    .meeting-view-toolbar-right {
      margin-left: auto;
    }
    .meeting-view-content {
      flex: 1;
      min-height: 0;
      overflow: auto;
      padding-right: 14px;
      box-sizing: border-box;
    }
    .start-meeting-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      font-family: inherit;
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--m3-on-surface);
      background: var(--m3-surface-container-high);
      border: 1px solid var(--m3-outline-variant);
      border-radius: var(--m3-shape-small);
      cursor: pointer;
    }
    .start-meeting-btn:hover {
      background: var(--m3-surface-container);
    }
    .start-meeting-btn-icon {
      font-size: 20px;
    }
    .download-meeting-pdf-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      font-family: inherit;
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--app-primary);
      background: transparent;
      border: 1px solid var(--app-primary);
      border-radius: var(--m3-shape-small);
      cursor: pointer;
    }
    .download-meeting-pdf-btn:hover:not(:disabled) {
      background: color-mix(in srgb, var(--app-primary) 10%, transparent);
    }
    .download-meeting-pdf-btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
    .download-meeting-pdf-btn-icon {
      font-size: 20px;
    }
    .add-topic-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      font-family: inherit;
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--app-on-primary);
      background: var(--app-primary);
      border: none;
      border-radius: var(--m3-shape-small);
      cursor: pointer;
    }
    .add-topic-btn:hover {
      opacity: 0.92;
    }
    .add-topic-btn-icon {
      font-size: 20px;
    }
    .meeting-topics-loading {
      margin: 0;
      font-size: 0.9375rem;
      color: var(--m3-on-surface-variant);
    }
    .topics-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 16px;
    }
    .search-results-list {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding-right: 14px;
      box-sizing: border-box;
    }
    .search-result-block {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .search-result-meeting-date {
      margin: 0;
      padding: 8px 12px;
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      color: var(--m3-on-surface);
      background: var(--m3-surface-container-high);
      border-radius: var(--m3-shape-small);
      border-left: 4px solid var(--app-primary);
      box-shadow: 0 1px 0 color-mix(in srgb, var(--m3-on-surface) 6%, transparent);
    }
    .topic-action-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      padding: 0;
      border: none;
      border-radius: var(--m3-shape-full);
      background: color-mix(in srgb, var(--m3-on-surface) 6%, transparent);
      color: var(--m3-on-surface-variant);
      cursor: pointer;
    }
    .topic-action-icon:hover {
      background: color-mix(in srgb, var(--m3-on-surface) 10%, transparent);
      color: var(--m3-on-surface);
    }
    .topic-action-icon .material-symbols-outlined {
      font-size: 20px;
    }
    .topic-action-icon--danger:hover {
      background: color-mix(in srgb, var(--m3-error) 12%, transparent);
      color: var(--m3-error);
    }
    .topic-focus-add-note-row {
      display: flex;
      justify-content: center;
      width: 100%;
    }
    .topic-focus-add-note-btn {
      margin-top: 0.15em;
      padding: 10px 22px;
      font-family: inherit;
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--app-on-primary);
      background: var(--app-primary);
      border: none;
      border-radius: var(--m3-shape-small);
      cursor: pointer;
    }
    .topic-focus-add-note-btn:hover {
      opacity: 0.92;
    }
    .presentation-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      padding: 1.5em;
      padding-bottom: 6.25em;
      box-sizing: border-box;
      font-size: 130%;
    }
    .presentation-overlay.topic-focus-overlay {
      z-index: 1150;
      padding-bottom: 1.5em;
    }
    .presentation-backdrop {
      position: absolute;
      inset: 0;
      background: color-mix(in srgb, var(--m3-on-surface) 88%, transparent);
    }
    .presentation-content {
      position: relative;
      z-index: 1;
      flex: 1;
      min-height: 0;
      overflow: auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      z-index: 1100;
    }
    .presentation-role-modal {
      width: 100%;
      max-width: 420px;
      border-radius: var(--m3-shape-large);
      background: var(--m3-surface);
      color: var(--m3-on-surface);
      box-shadow: var(--m3-elevation-4);
      border: 1px solid var(--m3-outline-variant);
      padding: 24px;
    }
    .presentation-role-modal-title {
      margin: 0 0 8px;
      font-size: 1.25rem;
      font-weight: 700;
    }
    .presentation-role-modal-subtitle {
      margin: 0 0 20px;
      color: var(--m3-on-surface-variant);
      font-size: 0.9375rem;
    }
    .presentation-role-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .presentation-role-option {
      text-align: left;
      padding: 16px;
      border-radius: var(--m3-shape-medium);
      border: 1px solid var(--m3-outline-variant);
      background: var(--m3-surface-container-low);
      cursor: pointer;
      font-family: inherit;
      transition: border-color 0.2s, background 0.2s;
    }
    .presentation-role-option:hover {
      border-color: var(--app-primary);
      background: color-mix(in srgb, var(--app-primary) 8%, var(--m3-surface-container-low));
    }
    .presentation-role-option-label {
      display: block;
      font-weight: 700;
      font-size: 1rem;
      color: var(--m3-on-surface);
    }
    .presentation-role-option-desc {
      display: block;
      margin-top: 4px;
      font-size: 0.875rem;
      color: var(--m3-on-surface-variant);
    }
    .presentation-role-modal-footer {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
    .presentation-cards-stack {
      display: flex;
      flex-direction: column;
      gap: 1.25em;
      width: 100%;
      max-width: min(880px, 100vw - 3em);
      align-items: stretch;
    }
    .presentation-nav {
      position: fixed;
      bottom: 1.5em;
      left: 1.5em;
      right: 1.5em;
      max-width: min(880px, 100vw - 3em);
      margin: 0 auto;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1em;
      padding: 0.75em 1em;
      color: var(--m3-on-surface);
      background: var(--m3-surface-container-high);
      border: 1px solid var(--m3-outline-variant);
      border-radius: var(--m3-shape-medium);
      box-shadow: var(--m3-elevation-3);
    }
    .presentation-end-btn {
      flex-shrink: 0;
      padding: 0.5em 1em;
      font-family: inherit;
      font-size: 0.875em;
      font-weight: 500;
      color: var(--m3-on-error-container);
      background: var(--m3-error-container);
      border: none;
      border-radius: var(--m3-shape-small);
      cursor: pointer;
    }
    .presentation-end-btn:hover {
      filter: brightness(0.96);
    }
    .presentation-counter {
      font-size: 0.9375em;
      font-weight: 500;
    }
    .presentation-nav-buttons {
      display: flex;
      gap: 0.5em;
    }
    .presentation-nav-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25em;
      padding: 0.5em 1em;
      font-family: inherit;
      font-size: 0.875em;
      font-weight: 500;
      color: var(--m3-on-surface);
      background: var(--m3-surface-container);
      border: 1px solid var(--m3-outline);
      border-radius: var(--m3-shape-small);
      cursor: pointer;
    }
    .presentation-nav-btn:hover:not(:disabled) {
      background: var(--m3-surface-container-low);
    }
    .presentation-nav-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .presentation-nav-btn .material-symbols-outlined {
      font-size: 1.25em;
    }
    .meeting-view-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid var(--m3-outline-variant);
    }
    .meeting-action-btn {
      padding: 8px 16px;
      font-family: inherit;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: var(--m3-shape-small);
      cursor: pointer;
      border: none;
    }
    .meeting-action-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .meeting-action-btn--delete {
      color: var(--m3-error);
      background: var(--m3-error-container);
      border: 1px solid var(--m3-error);
    }
    .meeting-action-btn--delete:hover:not(:disabled) {
      filter: brightness(0.96);
    }
    .meeting-action-btn--archive {
      color: var(--app-primary);
      background: color-mix(in srgb, var(--app-primary) 10%, transparent);
      border: 1px solid var(--app-primary);
    }
    .meeting-action-btn--archive:hover:not(:disabled) {
      background: color-mix(in srgb, var(--app-primary) 18%, transparent);
    }
  `],
})
export class TeamComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  private readonly demoSettings = inject(DemoVersionSettingsService);
  readonly includingMinutesEnabled = computed(() => this.demoSettings.includingMinutes());

  team: Team | null = null;
  rightPanel = signal<RightPanel>('none');
  openedMeeting = signal<MeetingDto | null>(null);
  searchQuery = signal('');
  meetingDate = signal(this.todayIso());
  createInProgress = false;
  activeMeetings = signal<MeetingDto[]>([]);
  activeMeetingsLoading = signal(false);
  archivedMeetings = signal<MeetingDto[]>([]);
  archivedMeetingsLoading = signal(false);
  canWrite = signal(false);
  canCreateMeetings = signal(false);
  canCreateTopics = signal(false);

  private filterMeetingsByDate(meetings: MeetingDto[], fromIso: string, toIso: string): MeetingDto[] {
    if (!fromIso && !toIso) return meetings;
    const from = fromIso ? new Date(fromIso) : null;
    const toEnd = toIso ? new Date(toIso) : null;
    if (toEnd) toEnd.setHours(23, 59, 59, 999);
    return meetings.filter((m) => {
      const d = new Date(m.date);
      if (from && d < from) return false;
      if (toEnd && d > toEnd) return false;
      return true;
    });
  }

  filteredActiveMeetings = computed(() => {
    const byDate = this.filterMeetingsByDate(this.activeMeetings(), this.filterDateFrom(), this.filterDateTo());
    const byTag = this.meetingIdsWithSelectedTags();
    if (!byTag) return byDate;
    return byDate.filter((m) => byTag.has(m.id));
  });
  filteredArchivedMeetings = computed(() => {
    const byDate = this.filterMeetingsByDate(this.archivedMeetings(), this.filterDateFrom(), this.filterDateTo());
    const byTag = this.meetingIdsWithSelectedTags();
    if (!byTag) return byDate;
    return byDate.filter((m) => byTag.has(m.id));
  });
  filteredMeetingsCount = computed(() => this.filteredActiveMeetings().length + this.filteredArchivedMeetings().length);
  meetingActionInProgress = signal(false);
  showAddTopicForm = signal(false);
  editTopicId = signal<number | null>(null);
  topicTitle = signal('');
  topicTags = signal('');
  topicNotes = signal('');
  topicReferenceDocuments = signal<string[]>([]);
  topicCreateInProgress = signal(false);
  meetingTopics = signal<MeetingTopicDto[]>([]);
  meetingTopicsLoading = signal(false);
  presentationMode = signal(false);
  presentationTopicIndex = signal(0);
  showPresentationRoleDialog = signal(false);
  presentationRole = signal<'viewer' | 'minuteTaker'>('viewer');
  /** In-presentation edits keyed by topic id */
  minuteNoteEdits = signal(new Map<number, { body: string; isDraft: boolean }>());
  minuteNoteSaveError = signal<string | null>(null);
  minuteNoteSaving = signal(false);
  meetingCardMinuteEdits = signal(new Map<number, { body: string; isDraft: boolean }>());
  meetingCardMinuteSaving = signal<number | null>(null);
  meetingCardMinuteSaveError = signal<number | null>(null);
  pdfDownloadInProgress = signal(false);
  /** Open topic detail dialog (full card + minute notes). */
  topicDetailDialogTopicId = signal<number | null>(null);
  /** Focus view: user clicked "Voeg notitie toe" to show the minute-notes card. */
  focusViewMinuteExpanded = signal(false);
  allTeamTopics = signal<TopicWithMeetingDto[]>([]);
  allTeamTopicsLoading = signal(false);
  filterPanelOpen = signal(false);
  filterDateFrom = signal('');
  filterDateTo = signal('');
  filterTagsSelected = signal<Set<string>>(new Set());
  showAllTags = signal(false);

  /** Tag label and count, sorted by count descending. */
  tagCountsSorted = computed(() => {
    const topics = this.allTeamTopics();
    const countByTag = new Map<string, number>();
    for (const topic of topics) {
      for (const tag of getTopicTags(topic.tags)) {
        countByTag.set(tag, (countByTag.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(countByTag.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  });

  visibleTagCounts = computed(() => {
    const all = this.tagCountsSorted();
    return this.showAllTags() ? all : all.slice(0, 5);
  });

  hasMoreTags = computed(() => this.tagCountsSorted().length > 5);

  topicDetailTopic = computed((): MeetingTopicDto | null => {
    const id = this.topicDetailDialogTopicId();
    if (id == null) return null;
    return (
      this.meetingTopics().find((t) => t.id === id) ?? this.allTeamTopics().find((t) => t.id === id) ?? null
    );
  });

  meetingIdsWithSelectedTags = computed(() => {
    const selected = this.filterTagsSelected();
    if (selected.size === 0) return null;
    const ids = new Set<number>();
    for (const topic of this.allTeamTopics()) {
      const topicTags = getTopicTags(topic.tags);
      if (topicTags.some((t) => selected.has(t))) ids.add(topic.meetingId);
    }
    return ids;
  });

  filterTagsSelectedList = computed(() => Array.from(this.filterTagsSelected()));

  private topicMatchesSearch(topic: TopicWithMeetingDto, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const displayId = (topic.displayId ?? '').toLowerCase();
    const title = (topic.title ?? '').toLowerCase();
    const notes = (topic.notes ?? '').toLowerCase();
    const tags = (topic.tags ?? '').toLowerCase();
    const refs = getTopicReferenceDocuments(topic.referenceDocumentsJson).join(' ').toLowerCase();
    return (
      displayId.includes(q) ||
      title.includes(q) ||
      notes.includes(q) ||
      tags.includes(q) ||
      refs.includes(q)
    );
  }

  searchFilteredTopics = computed(() => {
    const q = this.searchQuery().trim();
    const topics = this.allTeamTopics();
    if (!q) return topics;
    return topics.filter((t) => this.topicMatchesSearch(t, q));
  });

  activeFilterCount = computed(() => {
    let n = 0;
    if (this.filterDateFrom()) n++;
    if (this.filterDateTo()) n++;
    n += this.filterTagsSelected().size;
    return n;
  });

  clearFilterDateFrom(): void {
    this.filterDateFrom.set('');
  }

  clearFilterDateTo(): void {
    this.filterDateTo.set('');
  }

  clearDateFilters(): void {
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
  }

  toggleTagFilter(tag: string): void {
    const next = new Set(this.filterTagsSelected());
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    this.filterTagsSelected.set(next);
  }

  clearTagFilter(tag: string): void {
    const next = new Set(this.filterTagsSelected());
    next.delete(tag);
    this.filterTagsSelected.set(next);
  }

  clearAllTagFilters(): void {
    this.filterTagsSelected.set(new Set());
  }

  ngOnInit(): void {
    document.addEventListener('keydown', this.onKeyDown, { passive: false });
    const teamId = this.route.snapshot.paramMap.get('teamId');
    if (!teamId) {
      this.router.navigate(['/']);
      return;
    }
    this.http.get<Team>(`/api/teams/${encodeURIComponent(teamId)}`).subscribe({
      next: (team) => {
        if (team.access === 'MembersOnlyNoAccess') {
          this.router.navigate(['/']);
          return;
        }
        this.team = team;
        this.canWrite.set(team.access === 'Admin');
        this.canCreateMeetings.set(team.access === 'Admin' || (team.access === 'Member' && team.membersCanCreateMeetings === true));
        this.canCreateTopics.set(team.access === 'Admin' || team.membersCanCreateTopics === true);
        this.loadActiveMeetings();
        this.loadArchivedMeetings();
        this.loadAllTeamTopics();
      },
      error: () => this.router.navigate(['/']),
    });
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.onKeyDown as any);
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase() ?? '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    if (e.key === 'Escape') {
      if (this.topicDetailDialogTopicId() != null) {
        e.preventDefault();
        this.closeTopicDetailDialog();
        return;
      }
      if (this.presentationMode()) {
        e.preventDefault();
        this.closePresentation();
      }
      return;
    }

    if (!this.presentationMode()) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.presentationPrev();
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.presentationNext();
      return;
    }
  };

  loadActiveMeetings(): void {
    if (!this.team) return;
    this.activeMeetingsLoading.set(true);
    this.http
      .get<MeetingDto[]>('/api/meetings', { params: { teamId: this.team.id, status: 'active' } })
      .subscribe({
        next: (list) => {
          this.activeMeetings.set([...list].sort((a, b) => b.date.localeCompare(a.date)));
          this.activeMeetingsLoading.set(false);
        },
        error: () => this.activeMeetingsLoading.set(false),
      });
  }

  loadArchivedMeetings(): void {
    if (!this.team) return;
    this.archivedMeetingsLoading.set(true);
    this.http
      .get<MeetingDto[]>('/api/meetings', { params: { teamId: this.team.id, status: 'archived' } })
      .subscribe({
        next: (list) => {
          this.archivedMeetings.set([...list].sort((a, b) => b.date.localeCompare(a.date)));
          this.archivedMeetingsLoading.set(false);
        },
        error: () => this.archivedMeetingsLoading.set(false),
      });
  }

  loadAllTeamTopics(): void {
    if (!this.team) return;
    this.allTeamTopicsLoading.set(true);
    this.http.get<TopicWithMeetingDto[]>(`/api/teams/${encodeURIComponent(this.team.id)}/topics`).subscribe({
      next: (list) => {
        this.allTeamTopics.set(list);
        this.allTeamTopicsLoading.set(false);
      },
      error: () => this.allTeamTopicsLoading.set(false),
    });
  }

  isMeetingToday(dateIso: string): boolean {
    const d = new Date(dateIso);
    const today = new Date();
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  }

  isMeetingTomorrow(dateIso: string): boolean {
    const d = new Date(dateIso);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return d.getFullYear() === tomorrow.getFullYear() && d.getMonth() === tomorrow.getMonth() && d.getDate() === tomorrow.getDate();
  }

  formatMeetingLabel(dateIso: string): string {
    const d = new Date(dateIso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dayLabel = this.isMeetingToday(dateIso) ? 'Today' : this.isMeetingTomorrow(dateIso) ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'long' });
    return `${y}-${m}-${day} (${dayLabel})`;
  }

  formatMeetingTitleLong(dateIso: string): string {
    const d = new Date(dateIso);
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  private todayIso(): string {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  onAddMeeting(): void {
    if (!this.canCreateMeetings()) return;
    this.meetingDate.set(this.todayIso());
    this.rightPanel.set('new');
  }

  isRightPanelCardVisible(): boolean {
    if (this.searchQuery().trim()) return true;
    const p = this.rightPanel();
    return p === 'new' || (typeof p === 'object' && p.type === 'meeting');
  }

  openFilterPanel(): void {
    this.filterPanelOpen.set(true);
  }

  closeFilterPanel(): void {
    this.filterPanelOpen.set(false);
  }

  applyFilterPanel(): void {
    this.filterPanelOpen.set(false);
  }

  openMeeting(meeting: MeetingDto): void {
    this.showAddTopicForm.set(false);
    this.presentationMode.set(false);
    this.showPresentationRoleDialog.set(false);
    this.pdfDownloadInProgress.set(false);
    this.openedMeeting.set(meeting);
    this.rightPanel.set({ type: 'meeting', meeting });
    this.loadMeetingTopics(meeting.id);
  }

  downloadMeetingPdf(): void {
    const meeting = this.openedMeeting();
    if (!meeting || this.pdfDownloadInProgress()) return;
    this.pdfDownloadInProgress.set(true);
    this.http
      .get(`/api/meetings/${meeting.id}/export/pdf?includeMinutes=${this.includingMinutesEnabled()}`, { responseType: 'blob', observe: 'response' })
      .subscribe({
        next: (res) => {
          this.pdfDownloadInProgress.set(false);
          if (res.status !== 200 || !res.body) {
            alert('PDF downloaden is mislukt.');
            return;
          }
          let name = `meeting-${meeting.date.slice(0, 10)}.pdf`;
          const cd = res.headers.get('Content-Disposition');
          if (cd) {
            const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(cd);
            if (m?.[1]) name = decodeURIComponent(m[1].trim());
          }
          const url = URL.createObjectURL(res.body);
          const a = document.createElement('a');
          a.href = url;
          a.download = name;
          a.click();
          URL.revokeObjectURL(url);
        },
        error: () => {
          this.pdfDownloadInProgress.set(false);
          alert('PDF downloaden is mislukt.');
        },
      });
  }

  openPresentationRoleDialog(): void {
    this.minuteNoteSaveError.set(null);
    if (!this.includingMinutesEnabled()) {
      this.confirmPresentationRole('viewer');
      return;
    }
    this.showPresentationRoleDialog.set(true);
  }

  cancelPresentationRoleDialog(): void {
    this.showPresentationRoleDialog.set(false);
  }

  confirmPresentationRole(role: 'viewer' | 'minuteTaker'): void {
    this.showPresentationRoleDialog.set(false);
    this.presentationRole.set(role);
    this.initMinuteNoteEditsFromTopics();
    this.presentationTopicIndex.set(0);
    this.presentationMode.set(true);
  }

  private initMinuteNoteEditsFromTopics(): void {
    const m = new Map<number, { body: string; isDraft: boolean }>();
    for (const t of this.meetingTopics()) {
      m.set(t.id, {
        body: t.minuteNoteBody ?? '',
        isDraft: t.minuteNoteIsDraft ?? true,
      });
    }
    this.minuteNoteEdits.set(m);
  }

  private patchTopicAfterMinuteSave(dto: MeetingTopicDto): void {
    const edits = new Map(this.minuteNoteEdits());
    edits.set(dto.id, {
      body: dto.minuteNoteBody ?? '',
      isDraft: dto.minuteNoteIsDraft ?? true,
    });
    this.minuteNoteEdits.set(edits);
    this.patchTopicMinuteFieldsInLists(dto);
  }

  private patchTopicMinuteFieldsInLists(dto: MeetingTopicDto): void {
    this.meetingTopics.update((list) =>
      list.map((t) =>
        t.id === dto.id
          ? { ...t, minuteNoteBody: dto.minuteNoteBody, minuteNoteIsDraft: dto.minuteNoteIsDraft }
          : t,
      ),
    );
    this.allTeamTopics.update((list) =>
      list.map((t) =>
        t.id === dto.id
          ? { ...t, minuteNoteBody: dto.minuteNoteBody, minuteNoteIsDraft: dto.minuteNoteIsDraft }
          : t,
      ),
    );
  }

  private findTopicById(topicId: number): MeetingTopicDto | undefined {
    return this.meetingTopics().find((t) => t.id === topicId) ?? this.allTeamTopics().find((t) => t.id === topicId);
  }

  private flushMinuteNoteForCurrentTopic() {
    const meeting = this.openedMeeting();
    if (!this.includingMinutesEnabled() || !meeting || this.presentationRole() !== 'minuteTaker') {
      return of(undefined);
    }
    const topics = this.meetingTopics();
    const idx = this.presentationTopicIndex();
    const topic = topics[idx];
    if (!topic) return of(undefined);

    const edit = this.minuteNoteEdits().get(topic.id);
    const body = edit?.body ?? topic.minuteNoteBody ?? '';
    const isDraft = edit?.isDraft ?? topic.minuteNoteIsDraft ?? true;
    const noSavedNote = topic.minuteNoteIsDraft == null && topic.minuteNoteBody == null;
    if (!body.trim() && isDraft && noSavedNote) {
      return of(undefined);
    }

    this.minuteNoteSaving.set(true);
    this.minuteNoteSaveError.set(null);
    return this.http
      .put<MeetingTopicDto>(`/api/meetings/${meeting.id}/topics/${topic.id}/minute-note`, { body, isDraft })
      .pipe(
        map((dto) => {
          this.patchTopicAfterMinuteSave(dto);
          return undefined;
        }),
        finalize(() => this.minuteNoteSaving.set(false)),
      );
  }

  async closePresentation(): Promise<void> {
    if (this.presentationMode() && this.includingMinutesEnabled() && this.presentationRole() === 'minuteTaker') {
      try {
        await firstValueFrom(this.flushMinuteNoteForCurrentTopic());
      } catch {
        this.minuteNoteSaveError.set('Could not save. Try Save, then end the meeting again.');
        return;
      }
    }
    this.presentationMode.set(false);
    const m = this.openedMeeting();
    if (m) this.loadMeetingTopics(m.id);
  }

  async presentationPrev(): Promise<void> {
    if (this.presentationMode() && this.includingMinutesEnabled() && this.presentationRole() === 'minuteTaker') {
      try {
        await firstValueFrom(this.flushMinuteNoteForCurrentTopic());
      } catch {
        return;
      }
    }
    this.presentationTopicIndex.update((i) => Math.max(0, i - 1));
  }

  async presentationNext(): Promise<void> {
    const len = this.meetingTopics().length;
    if (this.presentationMode() && this.includingMinutesEnabled() && this.presentationRole() === 'minuteTaker') {
      try {
        await firstValueFrom(this.flushMinuteNoteForCurrentTopic());
      } catch {
        return;
      }
    }
    this.presentationTopicIndex.update((i) => Math.min(len - 1, i + 1));
  }

  minuteNoteBodyForTopic(topicId: number): string {
    const edit = this.minuteNoteEdits().get(topicId);
    if (edit !== undefined) return edit.body;
    const t = this.findTopicById(topicId);
    return t?.minuteNoteBody ?? '';
  }

  minuteNoteIsDraftForTopic(topicId: number): boolean {
    const edit = this.minuteNoteEdits().get(topicId);
    if (edit !== undefined) return edit.isDraft;
    const t = this.findTopicById(topicId);
    return t?.minuteNoteIsDraft ?? true;
  }

  onPresentationMinuteNoteInput(topicId: number, value: string): void {
    const edits = new Map(this.minuteNoteEdits());
    const prev = edits.get(topicId) ?? {
      body: this.findTopicById(topicId)?.minuteNoteBody ?? '',
      isDraft: this.findTopicById(topicId)?.minuteNoteIsDraft ?? true,
    };
    edits.set(topicId, { ...prev, body: value });
    this.minuteNoteEdits.set(edits);
    this.minuteNoteSaveError.set(null);
  }

  async savePresentationMinuteNote(): Promise<void> {
    if (this.presentationRole() !== 'minuteTaker') return;
    this.minuteNoteSaveError.set(null);
    try {
      await firstValueFrom(this.flushMinuteNoteForCurrentTopic());
    } catch {
      this.minuteNoteSaveError.set('Save failed.');
    }
  }

  async markPresentationMinuteFinal(): Promise<void> {
    const topics = this.meetingTopics();
    const idx = this.presentationTopicIndex();
    const topic = topics[idx];
    if (!topic) return;
    const edits = new Map(this.minuteNoteEdits());
    const prev = edits.get(topic.id) ?? {
      body: topic.minuteNoteBody ?? '',
      isDraft: topic.minuteNoteIsDraft ?? true,
    };
    edits.set(topic.id, { ...prev, isDraft: false });
    this.minuteNoteEdits.set(edits);
    await this.savePresentationMinuteNote();
  }

  topicHasMinuteNotesOnCard(topic: MeetingTopicDto): boolean {
    if (topic.isDeleted) return false;
    if (this.meetingCardMinuteEdits().has(topic.id)) return true;
    return topic.minuteNoteIsDraft != null || (topic.minuteNoteBody != null && topic.minuteNoteBody.length > 0);
  }

  /** Embedded topic cards on the meeting list: only finalized notes (drafts stay in topic focus / presentation). */
  showMinuteNotesOnMeetingTopicCard(topic: MeetingTopicDto): boolean {
    if (!this.includingMinutesEnabled()) return false;
    if (!this.topicHasMinuteNotesOnCard(topic)) return false;
    const local = this.meetingCardMinuteEdits().get(topic.id);
    if (local !== undefined) return !local.isDraft;
    if (topic.minuteNoteIsDraft === true) return false;
    if (topic.minuteNoteIsDraft === false) return true;
    return false;
  }

  meetingCardMinuteBody(topic: MeetingTopicDto): string {
    const local = this.meetingCardMinuteEdits().get(topic.id);
    if (local !== undefined) return local.body;
    return topic.minuteNoteBody ?? '';
  }

  meetingCardMinuteIsDraft(topic: MeetingTopicDto): boolean {
    const local = this.meetingCardMinuteEdits().get(topic.id);
    if (local !== undefined) return local.isDraft;
    return topic.minuteNoteIsDraft ?? true;
  }

  onMeetingCardMinuteInput(topicId: number, value: string): void {
    const topic = this.findTopicById(topicId);
    if (!topic) return;
    const edits = new Map(this.meetingCardMinuteEdits());
    const prev = edits.get(topicId) ?? {
      body: topic.minuteNoteBody ?? '',
      isDraft: topic.minuteNoteIsDraft ?? true,
    };
    edits.set(topicId, { ...prev, body: value });
    this.meetingCardMinuteEdits.set(edits);
    this.meetingCardMinuteSaveError.set(null);
  }

  saveMeetingCardMinuteNote(topicId: number): void {
    const topic = this.findTopicById(topicId);
    if (!topic) return;
    const local = this.meetingCardMinuteEdits().get(topicId);
    const body = local?.body ?? topic.minuteNoteBody ?? '';
    const isDraft = local?.isDraft ?? topic.minuteNoteIsDraft ?? true;
    this.meetingCardMinuteSaving.set(topicId);
    this.meetingCardMinuteSaveError.set(null);
    this.http
      .put<MeetingTopicDto>(`/api/meetings/${topic.meetingId}/topics/${topicId}/minute-note`, { body, isDraft })
      .subscribe({
      next: (dto) => {
        this.meetingCardMinuteSaving.set(null);
        const edits = new Map(this.meetingCardMinuteEdits());
        edits.set(topicId, { body: dto.minuteNoteBody ?? '', isDraft: dto.minuteNoteIsDraft ?? true });
        this.meetingCardMinuteEdits.set(edits);
        this.patchTopicMinuteFieldsInLists(dto);
      },
      error: () => {
        this.meetingCardMinuteSaving.set(null);
        this.meetingCardMinuteSaveError.set(topicId);
      },
    });
  }

  markMeetingCardMinuteFinal(topicId: number): void {
    const topic = this.findTopicById(topicId);
    if (!topic) return;
    const edits = new Map(this.meetingCardMinuteEdits());
    const prev = edits.get(topicId) ?? {
      body: topic.minuteNoteBody ?? '',
      isDraft: topic.minuteNoteIsDraft ?? true,
    };
    edits.set(topicId, { ...prev, isDraft: false });
    this.meetingCardMinuteEdits.set(edits);
    this.saveMeetingCardMinuteNote(topicId);
  }

  cancelMeetingCardMinuteNote(topic: MeetingTopicDto): void {
    const edits = new Map(this.meetingCardMinuteEdits());
    edits.delete(topic.id);
    this.meetingCardMinuteEdits.set(edits);
    this.meetingCardMinuteSaveError.set(null);
  }

  deleteMeetingCardMinuteNote(topicId: number): void {
    const topic = this.findTopicById(topicId);
    if (!topic) return;
    this.meetingCardMinuteSaving.set(topicId);
    this.meetingCardMinuteSaveError.set(null);
    this.http.delete<MeetingTopicDto>(`/api/meetings/${topic.meetingId}/topics/${topicId}/minute-note`).subscribe({
      next: (dto) => {
        this.meetingCardMinuteSaving.set(null);
        const edits = new Map(this.meetingCardMinuteEdits());
        edits.delete(topicId);
        this.meetingCardMinuteEdits.set(edits);
        this.patchTopicMinuteFieldsInLists(dto);
        if (this.topicDetailDialogTopicId() === topicId) {
          queueMicrotask(() => {
            const t = this.findTopicById(topicId);
            if (t && !this.topicHasMinuteNotesOnCard(t)) {
              this.focusViewMinuteExpanded.set(false);
            }
          });
        }
      },
      error: () => {
        this.meetingCardMinuteSaving.set(null);
        this.meetingCardMinuteSaveError.set(topicId);
      },
    });
  }

  cancelPresentationMinuteNote(): void {
    const topics = this.meetingTopics();
    const idx = this.presentationTopicIndex();
    const topic = topics[idx];
    if (!topic) return;
    const edits = new Map(this.minuteNoteEdits());
    edits.set(topic.id, {
      body: topic.minuteNoteBody ?? '',
      isDraft: topic.minuteNoteIsDraft ?? true,
    });
    this.minuteNoteEdits.set(edits);
    this.minuteNoteSaveError.set(null);
  }

  deletePresentationMinuteNote(): void {
    const meeting = this.openedMeeting();
    const topics = this.meetingTopics();
    const idx = this.presentationTopicIndex();
    const topic = topics[idx];
    if (!meeting || !topic) return;
    this.minuteNoteSaving.set(true);
    this.minuteNoteSaveError.set(null);
    this.http.delete<MeetingTopicDto>(`/api/meetings/${meeting.id}/topics/${topic.id}/minute-note`).subscribe({
      next: (dto) => {
        const edits = new Map(this.minuteNoteEdits());
        edits.set(dto.id, { body: '', isDraft: true });
        this.minuteNoteEdits.set(edits);
        this.patchTopicMinuteFieldsInLists(dto);
        this.minuteNoteSaving.set(false);
      },
      error: () => {
        this.minuteNoteSaving.set(false);
        this.minuteNoteSaveError.set('Delete failed.');
      },
    });
  }

  loadMeetingTopics(meetingId: number): void {
    this.meetingTopicsLoading.set(true);
    this.meetingTopics.set([]);
    this.http.get<MeetingTopicDto[]>(`/api/meetings/${meetingId}/topics`).subscribe({
      next: (list) => {
        this.meetingTopics.set(list);
        this.meetingCardMinuteEdits.set(new Map());
        this.meetingCardMinuteSaveError.set(null);
        this.meetingTopicsLoading.set(false);
      },
      error: () => this.meetingTopicsLoading.set(false),
    });
  }

  onTopicCardOpenClick(ev: MouseEvent, topic: MeetingTopicDto): void {
    if (topic.isDeleted) return;
    const el = ev.target as HTMLElement;
    if (el.closest('button, a, textarea, input, [data-topic-card-no-dialog]')) return;
    this.topicDetailDialogTopicId.set(topic.id);
  }

  closeTopicDetailDialog(): void {
    this.topicDetailDialogTopicId.set(null);
    this.focusViewMinuteExpanded.set(false);
  }

  /** Collapse focus notitie-card when cancel leaves no draft/note to show. */
  onFocusViewMinuteCancel(topic: MeetingTopicDto): void {
    this.cancelMeetingCardMinuteNote(topic);
    queueMicrotask(() => {
      const t = this.findTopicById(topic.id);
      if (this.topicDetailDialogTopicId() === topic.id && t && !this.topicHasMinuteNotesOnCard(t)) {
        this.focusViewMinuteExpanded.set(false);
      }
    });
  }

  isTopicMeetingArchived(topic: MeetingTopicDto): boolean {
    const m =
      this.activeMeetings().find((x) => x.id === topic.meetingId) ??
      this.archivedMeetings().find((x) => x.id === topic.meetingId);
    return m?.status === 'archived';
  }

  searchByTag(tag: string): void {
    this.searchQuery.set(tag);
  }

  addRef(): void {
    this.topicReferenceDocuments.update((arr) => [...arr, '']);
  }
  removeRef(index: number): void {
    this.topicReferenceDocuments.update((arr) => arr.filter((_, i) => i !== index));
  }
  updateRef(index: number, value: string): void {
    this.topicReferenceDocuments.update((arr) => {
      const next = [...arr];
      next[index] = value;
      return next;
    });
  }

  openAddTopicForm(): void {
    if (!this.canCreateTopics()) return;
    this.editTopicId.set(null);
    this.topicTitle.set('');
    this.topicTags.set('');
    this.topicNotes.set('');
    this.topicReferenceDocuments.set([]);
    this.showAddTopicForm.set(true);
  }

  closeTopicForm(): void {
    this.showAddTopicForm.set(false);
    this.editTopicId.set(null);
  }

  saveTopic(): void {
    const meeting = this.openedMeeting();
    if (!meeting || this.topicCreateInProgress()) return;

    const title = this.topicTitle().trim();
    const notes = this.topicNotes().trim();
    if (!title) return;
    if (!notes) return;

    const payload = {
      title,
      notes,
      tags: this.topicTags().trim() || undefined,
      referenceDocuments: this.topicReferenceDocuments().filter((r) => r.trim()).length ? this.topicReferenceDocuments().filter((r) => r.trim()) : undefined,
    };

    this.topicCreateInProgress.set(true);
    const topicId = this.editTopicId();
    const req$ = topicId == null
      ? this.http.post(`/api/meetings/${meeting.id}/topics`, payload)
      : this.http.put(`/api/meetings/${meeting.id}/topics/${topicId}`, payload);

    req$.subscribe({
      next: () => {
        this.topicCreateInProgress.set(false);
        this.showAddTopicForm.set(false);
        this.editTopicId.set(null);
        this.topicTitle.set('');
        this.topicTags.set('');
        this.topicNotes.set('');
        this.topicReferenceDocuments.set([]);
        this.loadMeetingTopics(meeting.id);
        this.loadAllTeamTopics();
      },
      error: () => this.topicCreateInProgress.set(false),
    });
  }

  openEditTopicForm(topic: MeetingTopicDto): void {
    const meeting = this.openedMeeting();
    if (!meeting || meeting.status === 'archived') return;
    if (!topic.canEdit) return;

    this.editTopicId.set(topic.id);
    this.topicTitle.set(topic.title ?? '');
    this.topicTags.set((topic.tags ?? '') as any);
    this.topicNotes.set(topic.notes ?? '');
    this.topicReferenceDocuments.set(getTopicReferenceDocuments(topic.referenceDocumentsJson));
    this.showAddTopicForm.set(true);
  }

  deleteTopic(topic: MeetingTopicDto): void {
    const meeting = this.openedMeeting();
    if (!meeting) return;
    if (!topic.canDelete) return;
    if (!confirm('Delete this topic?')) return;

    this.http.delete(`/api/meetings/${meeting.id}/topics/${topic.id}`).subscribe({
      next: () => {
        this.loadMeetingTopics(meeting.id);
        this.loadAllTeamTopics();
      },
      error: () => {
        this.loadMeetingTopics(meeting.id);
        this.loadAllTeamTopics();
      },
    });
  }

  // kept for compatibility with older template fragments; prefer saveTopic()
  createTopic(): void {
    this.saveTopic();
  }

  closeRightPanel(): void {
    this.showAddTopicForm.set(false);
    this.editTopicId.set(null);
    this.presentationMode.set(false);
    this.showPresentationRoleDialog.set(false);
    this.searchQuery.set('');
    this.rightPanel.set('none');
    this.openedMeeting.set(null);
  }

  deleteMeeting(): void {
    const meeting = this.openedMeeting();
    if (!meeting || this.meetingActionInProgress() || !this.canWrite()) return;
    if (!confirm('Delete this meeting? This cannot be undone.')) return;
    this.meetingActionInProgress.set(true);
    this.http.delete(`/api/meetings/${meeting.id}`).subscribe({
      next: () => {
        this.meetingActionInProgress.set(false);
        this.closeRightPanel();
        this.loadActiveMeetings();
        this.loadArchivedMeetings();
      },
      error: (err) => {
        this.meetingActionInProgress.set(false);
        const msg = err?.error?.error || 'Failed to delete meeting.';
        alert(msg);
      },
    });
  }

  archiveMeeting(): void {
    const meeting = this.openedMeeting();
    if (!meeting || this.meetingActionInProgress() || meeting.status === 'archived' || !this.canWrite()) return;
    this.meetingActionInProgress.set(true);
    this.http.patch<MeetingDto>(`/api/meetings/${meeting.id}`, { status: 'archived' }).subscribe({
      next: () => {
        this.meetingActionInProgress.set(false);
        this.closeRightPanel();
        this.loadActiveMeetings();
        this.loadArchivedMeetings();
      },
      error: () => this.meetingActionInProgress.set(false),
    });
  }

  createMeeting(): void {
    if (!this.team || this.createInProgress || !this.canCreateMeetings()) return;
    const dateStr = this.meetingDate();
    if (!dateStr) return;
    this.createInProgress = true;
    const payload = {
      teamId: this.team.id,
      date: dateStr + 'T12:00:00.000Z',
      status: 'active',
    };
    this.http.post<MeetingDto>('/api/meetings', payload).subscribe({
      next: (created) => {
        this.createInProgress = false;
        this.loadActiveMeetings();
        this.openedMeeting.set(created);
        this.rightPanel.set({ type: 'meeting', meeting: created });
      },
      error: () => {
        this.createInProgress = false;
      },
    });
  }

  isImageIcon(icon: string): boolean {
    return icon.includes('/');
  }
}
