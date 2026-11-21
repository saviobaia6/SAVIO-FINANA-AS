import Dexie, { type Table } from 'dexie';
import {
  Transaction,
  Account,
  CreditCard,
  Boleto,
  Debt,
  Asset,
  DocumentItem,
} from '../types';

export interface StoredFileRecord {
  id: string;
  documentId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  blob: Blob;
  createdAt: string;
}

export interface StoredSettingRecord {
  key: string;
  value: string;
  updatedAt: string;
}

export interface StoredBackupRecord {
  id: string;
  reason: 'manual' | 'reset' | 'replace_import' | 'pre_migration';
  createdAt: string;
  schemaVersion: number;
  payloadJson: string;
}

export interface RecoveryBackupRecord {
  id: string;
  key: string;
  originalValue: string | null;
  createdAt: string;
  reason: string;
  schemaVersion: number;
}

export class SavioFinanaDatabase extends Dexie {
  transactions!: Table<Transaction, string>;
  accounts!: Table<Account, string>;
  creditCards!: Table<CreditCard, string>;
  boletos!: Table<Boleto, string>;
  debts!: Table<Debt, string>;
  assets!: Table<Asset, string>;
  documents!: Table<DocumentItem, string>;
  files!: Table<StoredFileRecord, string>;
  settings!: Table<StoredSettingRecord, string>;
  backups!: Table<StoredBackupRecord, string>;
  recovery!: Table<RecoveryBackupRecord, string>;

  constructor() {
    super('SavioFinanaDB');
    this.version(1).stores({
      transactions: 'id, entityId, accountId, date, category, status, externalId',
      accounts: 'id, entityId, archived',
      creditCards: 'id, entityId, status',
      boletos: 'id, entityId, status, vencimento',
      debts: 'id, entityId, status',
      assets: 'id, entityId, assetType',
      documents: 'id, type, status, fileId',
      files: 'id, documentId, mimeType, createdAt',
      settings: 'key',
      backups: 'id, reason, createdAt',
      recovery: 'id, key, createdAt',
    });
  }
}

export function hasIndexedDbSupport(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

export const db: SavioFinanaDatabase | null = hasIndexedDbSupport()
  ? new SavioFinanaDatabase()
  : null;
