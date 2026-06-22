export interface Team {
  id: string;
  name: string;
  icon: string;
  authorized: boolean;
  access: 'Admin' | 'Member' | 'ReadOnly' | 'MembersOnlyNoAccess';
  isMembersOnly: boolean;
  membersCanCreateMeetings: boolean;
  membersCanCreateTopics: boolean;
}
