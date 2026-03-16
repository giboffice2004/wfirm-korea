export interface SiteSettings {
  heroTitle: string;
  heroDescription: string;
  videoUrl: string;
  heroImage: string;
  officeImage: string;
  location: string;
  contact: string;
  openingCeremonyImages: string[];
  officeViewImages: string[];
}

export interface BioTrend {
  id: string;
  keyword: string;
  marketShare: number;
  growthRate: number[];
  connectivity: number;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}
