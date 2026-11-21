import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/calendar.events');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initGoogleAuth = (
  onSuccess: (user: User, token: string) => void,
  onFailure: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user && cachedAccessToken) {
      onSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      onFailure();
    }
  });
};

export const signInWithGoogleWorkspace = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Falha ao obter token de acesso do Google Workspace.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const getWorkspaceAccessToken = () => cachedAccessToken;

// Google Sheets Export
export const exportToGoogleSheets = async (token: string, transactions: any[]) => {
  // Create spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title: `FINANCE IA - Relatório ${new Date().toLocaleDateString('pt-BR')}` }
    })
  });
  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;

  // Format rows
  const rows = [
    ['Data', 'Descrição', 'Categoria', 'Vínculo', 'Conta', 'Direção', 'Valor (R$)'],
    ...transactions.map(t => [
      t.date,
      t.description,
      t.category,
      t.entityId,
      t.account,
      t.direction === 'INCOME' ? 'Receita' : 'Despesa',
      t.amount
    ])
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: 'A1',
      majorDimension: 'ROWS',
      values: rows
    })
  });

  return spreadsheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
};

// Google Calendar Event Sync
export const syncBoletoToCalendar = async (token: string, boleto: { beneficiario: string; valorOriginal: number; vencimento: string; descricao: string }) => {
  const event = {
    summary: `[FINANCE IA] Vencimento: ${boleto.beneficiario} - R$ ${boleto.valorOriginal}`,
    description: `Boleto / Conta a pagar: ${boleto.descricao}`,
    start: { date: boleto.vencimento },
    end: { date: boleto.vencimento },
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 1440 }] // 1 day before
    }
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  });
  return await res.json();
};

// Google Drive Backup
export const backupToGoogleDrive = async (token: string, financialData: any) => {
  const fileContent = JSON.stringify(financialData, null, 2);
  const metadata = {
    name: `FINANCE_IA_Backup_${new Date().toISOString().split('T')[0]}.json`,
    mimeType: 'application/json'
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });
  return await res.json();
};
