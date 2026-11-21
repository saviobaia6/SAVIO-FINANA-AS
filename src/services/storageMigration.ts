import { db } from './indexedDb';
import { fileStorageService } from './fileStorage';
import {
  STORAGE_KEYS,
  STORAGE_SCHEMA_VERSION,
  storageService,
  writeStringSafe,
} from './storage';
import {
  AppDataset,
  AppSettingsSnapshot,
  sanitizeDocumentsForMetadata,
  savePreOperationSnapshot,
} from './backupService';
import { DocumentItem } from '../types';

export interface MigrationResult {
  ok: boolean;
  migratedLegacyDocsCount: number;
  cleanedDocuments?: DocumentItem[];
  dexieSynced: boolean;
  error?: string;
}

/**
 * Mirrors active entity datasets into IndexedDB (SavioFinanaDB) stores without altering localStorage.
 */
export async function mirrorDatasetToDexie(
  dataset: AppDataset,
  settings?: AppSettingsSnapshot
): Promise<boolean> {
  const database = db;
  if (!database) return false;
  try {
    const nowIso = new Date().toISOString();
    await database.transaction(
      'rw',
      [
        database.accounts,
        database.transactions,
        database.creditCards,
        database.boletos,
        database.debts,
        database.assets,
        database.documents,
        database.settings,
      ],
      async () => {
        await database.accounts.clear();
        if (dataset.accounts.length > 0) await database.accounts.bulkPut(dataset.accounts);

        await database.transactions.clear();
        if (dataset.transactions.length > 0) await database.transactions.bulkPut(dataset.transactions);

        await database.creditCards.clear();
        if (dataset.creditCards.length > 0) await database.creditCards.bulkPut(dataset.creditCards);

        await database.boletos.clear();
        if (dataset.boletos.length > 0) await database.boletos.bulkPut(dataset.boletos);

        await database.debts.clear();
        if (dataset.debts.length > 0) await database.debts.bulkPut(dataset.debts);

        await database.assets.clear();
        if (dataset.assets.length > 0) await database.assets.bulkPut(dataset.assets);

        const cleanDocs = sanitizeDocumentsForMetadata(dataset.documents);
        await database.documents.clear();
        if (cleanDocs.length > 0) await database.documents.bulkPut(cleanDocs);

        if (settings) {
          await database.settings.bulkPut([
            { key: 'theme', value: settings.theme, updatedAt: nowIso },
            { key: 'density', value: settings.density, updatedAt: nowIso },
            { key: 'zoom', value: settings.zoom, updatedAt: nowIso },
          ]);
        }
      }
    );
    return true;
  } catch (err) {
    console.error('[Migration] Dexie mirror error:', err);
    return false;
  }
}

/**
 * Safely migrates legacy localStorage data & base64 data URLs into SavioFinanaDB.
 * Guarantees:
 * 1. Never executes localStorage.clear().
 * 2. Captures a pre-migration snapshot before touching anything.
 * 3. Keeps original localStorage keys intact if any error occurs.
 */
export async function runSafeStorageMigration(params: {
  dataset: AppDataset;
  settings?: AppSettingsSnapshot;
}): Promise<MigrationResult> {
  const { dataset, settings } = params;
  const legacyDocs = dataset.documents.filter(
    (d) => typeof d.previewUrl === 'string' && d.previewUrl.startsWith('data:')
  );

  try {
    if (legacyDocs.length > 0) {
      const snapRes = savePreOperationSnapshot(
        { ...dataset, settings },
        'pre_migration'
      );
      if (!snapRes.ok && snapRes.error) {
        console.warn('[Migration] Pre-migration localStorage snapshot warning:', snapRes.error);
      }

      let migratedCount = 0;
      const migratedMap = new Map<string, DocumentItem>();

      for (const doc of legacyDocs) {
        if (!doc.previewUrl) continue;
        const meta = await fileStorageService.migrateDataUrlToFile(
          doc.id,
          doc.previewUrl,
          doc.name,
          doc.mimeType
        );
        migratedCount += 1;
        const { previewUrl: _dropped, ...rest } = doc;
        migratedMap.set(doc.id, {
          ...rest,
          fileId: meta.fileId,
          hasBlob: true,
          mimeType: meta.mimeType,
          size: meta.sizeLabel,
        });
      }

      const cleanedDocuments = sanitizeDocumentsForMetadata(
        dataset.documents.map((d) => migratedMap.get(d.id) || d)
      );

      // Update sanitized docs key safely (never localStorage.clear())
      const writeRes = storageService.set(STORAGE_KEYS.docs, cleanedDocuments);
      if (!writeRes.ok) {
        return {
          ok: false,
          migratedLegacyDocsCount: migratedCount,
          dexieSynced: false,
          error: writeRes.error || 'Falha ao atualizar metadados após migração de arquivos.',
        };
      }

      writeStringSafe(STORAGE_KEYS.schemaVersion, String(STORAGE_SCHEMA_VERSION));
      writeStringSafe(STORAGE_KEYS.migrationVersion, String(STORAGE_SCHEMA_VERSION));

      const dexieSynced = await mirrorDatasetToDexie(
        { ...dataset, documents: cleanedDocuments },
        settings
      );

      return {
        ok: true,
        migratedLegacyDocsCount: migratedCount,
        cleanedDocuments,
        dexieSynced,
      };
    }

    writeStringSafe(STORAGE_KEYS.schemaVersion, String(STORAGE_SCHEMA_VERSION));
    writeStringSafe(STORAGE_KEYS.migrationVersion, String(STORAGE_SCHEMA_VERSION));
    const dexieSynced = await mirrorDatasetToDexie(dataset, settings);

    return {
      ok: true,
      migratedLegacyDocsCount: 0,
      dexieSynced,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido na migração segura.';
    console.error('[Migration] Failed safely without clearing localStorage:', msg);
    return {
      ok: false,
      migratedLegacyDocsCount: 0,
      dexieSynced: false,
      error: msg,
    };
  }
}
