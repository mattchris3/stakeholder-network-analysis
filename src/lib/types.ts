// Shapes of the records stored in Firebase Realtime Database.

export interface Unity {
  unityId: string;
  name: string;
  description?: string;
  accessCode?: string;
  created?: string;
  acceptingMembers?: boolean;
  focusAreas?: string[];
  /** Firebase uid of the network's admin account. */
  ownerUid?: string;
}

export interface Entity {
  id: string;
  unityId: string;
  name: string;
  fullName?: string;
  sector?: string;
  fundingType?: string;
  type?: string;
  size?: string;
  region?: string;
  focusAreas?: string[];
  status?: string;
  approval?: string;
  description?: string;
  duty?: string;
  appliedDate?: string;
  approvedDate?: string;
  /** Firebase uid of the account that manages this organisation. */
  ownerUid?: string;
  rejectedDate?: string;
  removedDate?: string;
  founded?: number | string;
  budget?: number;
  fundingSource?: string;
  location?: string;
}

export interface Meeting {
  id: string;
  unityId: string;
  title: string;
  date: string;
  type?: string;
  format?: string;
  location?: string;
  purpose?: string;
  outcome?: string;
  participants: string[];
  hostId?: string;
  status: string;
  approvals?: Record<string, string>;
}

export interface UnityData {
  unity: Unity | null;
  entities: Entity[];
  meetings: Meeting[];
  source: 'firebase' | 'snapshot';
}
