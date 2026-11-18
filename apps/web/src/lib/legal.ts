export interface LegalSettings {
  ownerName: string;
  ownerUrl: string;
  supportEmail: string;
  serviceHours: string;
  responseBusinessDays: number;
  draftRetentionDays: number;
}
export interface LegalPolicy {
  version: string;
  revision: string;
  settings: LegalSettings;
  supportWhatsapp: string;
  sections: { title: string; paragraphs: string[] }[];
}
export interface PublicSettings {
  supportWhatsapp: string;
  legal: LegalSettings;
  policy: LegalPolicy;
}
