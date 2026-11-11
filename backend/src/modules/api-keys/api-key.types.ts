export type ApiKeyRow = {
  key_id: string;
  encrypted_key: string;
  created_at: string;
};

export type ApiKeyMaterial = {
  key: string;
  keyId: string;
  encrypted: string;
  hash: string;
};
