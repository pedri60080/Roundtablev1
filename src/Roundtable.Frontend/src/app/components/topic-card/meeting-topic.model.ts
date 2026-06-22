export interface MeetingTopicDto {
  id: number;
  displayId?: string;
  meetingId: number;
  title: string;
  tags?: string | null;
  notes?: string | null;
  referenceDocumentsJson?: string | null;
  createdByOrganisation?: string | null;
  createdByNickname?: string | null;
  canEdit?: boolean;
  canDelete?: boolean;
  minuteNoteBody?: string | null;
  minuteNoteIsDraft?: boolean | null;

  /** Soft-deleted topic: only display id + deletion metadata are meaningful. */
  isDeleted?: boolean;
  deletedAtUtc?: string | null;
  deletedByOrganisation?: string | null;
}

export interface TopicWithMeetingDto extends MeetingTopicDto {
  meetingDate: string;
}
