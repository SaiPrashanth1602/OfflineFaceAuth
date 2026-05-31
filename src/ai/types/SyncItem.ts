export interface SyncItem {
  id: string;
  payload: string;
  status: 'pending' | 'synced' | 'failed';
  createdAt: string;
}
