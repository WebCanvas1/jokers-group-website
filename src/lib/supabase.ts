type Row = Record<string, unknown>;

const API = '/api';
const TOKEN_KEY = 'jokers_admin_token';
const QUOTE_EMAIL = 'Rhett.jokersgroup@gmail.com';

async function request(path: string, init: RequestInit = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API}${path}`, { ...init, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Request failed');
  return payload;
}

async function sendQuoteEmail(payload: Row | Row[]) {
  const row = Array.isArray(payload) ? payload[0] : payload;
  if (!row) throw new Error('Missing enquiry details');

  const response = await fetch(`https://formsubmit.co/ajax/${QUOTE_EMAIL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      _subject: "New website enquiry - Joker's Group",
      _template: 'table',
      name: row.name ?? '',
      organisation: row.organisation ?? '',
      contact: row.email || row.phone || '',
      phone: row.phone ?? '',
      email: row.email ?? '',
      service: row.service ?? '',
      project_details: row.description ?? '',
      quantity: row.quantity ?? '',
      preferred_contact: row.timeframe ?? '',
      source: "Joker's Group website",
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) {
    throw new Error(result.message || 'Unable to send enquiry email');
  }

  return result;
}

class QueryBuilder {
  private table: string;
  private action: 'select' | 'insert' | 'delete' = 'select';
  private payload: Row | Row[] | null = null;
  private filter: { column: string; value: unknown } | null = null;

  constructor(table: string) { this.table = table; }
  select(_columns = '*') { this.action = 'select'; return this; }
  insert(payload: Row | Row[]) { this.action = 'insert'; this.payload = payload; return this; }
  delete() { this.action = 'delete'; return this; }
  eq(column: string, value: unknown) { this.filter = { column, value }; return this.execute(); }
  order(_column: string, _options?: { ascending?: boolean }) { return this.execute(); }
  then(resolve: (value: { data: unknown; error: Error | null }) => unknown, reject?: (reason: unknown) => unknown) { return this.execute().then(resolve, reject); }

  private async execute(): Promise<{ data: unknown; error: Error | null }> {
    try {
      if (this.action === 'select') {
        const payload = await request(`/${this.table}`);
        return { data: payload.data ?? [], error: null };
      }
      if (this.action === 'insert') {
        if (this.table === 'quote_enquiries' && this.payload) {
          const emailResult = await sendQuoteEmail(this.payload);

          // Keep a copy in the site's database for the owner dashboard when available.
          try {
            await request(`/${this.table}`, { method: 'POST', body: JSON.stringify(this.payload) });
          } catch (storageError) {
            console.warn('Enquiry email sent, but database storage failed:', storageError);
          }

          return { data: emailResult, error: null };
        }

        const payload = await request(`/${this.table}`, { method: 'POST', body: JSON.stringify(this.payload) });
        return { data: payload.data ?? null, error: null };
      }
      if (this.action === 'delete') {
        if (!this.filter || this.filter.column !== 'id') throw new Error('Delete requires an id filter');
        const payload = await request(`/${this.table}/${encodeURIComponent(String(this.filter.value))}`, { method: 'DELETE' });
        return { data: payload.data ?? null, error: null };
      }
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Request failed') };
    }
  }
}

export const supabase = {
  from(table: string) { return new QueryBuilder(table); },
  auth: {
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        const payload = await request('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        localStorage.setItem(TOKEN_KEY, payload.token);
        return { data: { user: { email } }, error: null };
      } catch (error) {
        return { data: null, error: error instanceof Error ? error : new Error('Login failed') };
      }
    },
    async signOut() { localStorage.removeItem(TOKEN_KEY); return { error: null }; },
  },
  async rpc(name: string) {
    if (name !== 'claim_first_admin') return { data: null, error: new Error('Unknown operation') };
    try {
      const payload = await request('/admin/check');
      return { data: Boolean(payload.ok), error: null };
    } catch (error) {
      return { data: false, error: error instanceof Error ? error : new Error('Not authorised') };
    }
  },
};
