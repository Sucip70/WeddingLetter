export interface PresignedUpload {
  uploadUrl: string;
  method: 'PUT';
  // Header yang WAJIB dikirim klien saat upload (mis. Content-Type).
  headers: Record<string, string>;
  expiresInSeconds: number;
}

export interface StorageDriver {
  readonly name: 'r2' | 'local';
  // Kunci objek berbentuk `<invitationId>/<mediaId>.<ext>`.
  presignUpload(input: { key: string; contentType: string; sizeBytes: number }): Promise<PresignedUpload>;
  // Unggah langsung dari server (mis. foto bawaan lewat seed); klien memakai presignUpload.
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  head(key: string): Promise<{ sizeBytes: number } | null>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
}
