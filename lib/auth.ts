import { supabase } from './supabase';

// 用户权限等级
export type UserRole = 'admin' | 'leader' | 'employee';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
}

// 用户数据库（后续迁移到 Supabase）
const USERS_DATABASE = {
  // Level 1: Admin (完全访问)
  'cindyzhang@tassure.com': { name: 'Cindy', role: 'admin' as UserRole, department: 'Management' },
  'samuellng@tassure.com': { name: 'Samuell', role: 'admin' as UserRole, department: 'Management' },
  'yeesoon@tassure.com': { name: 'Yee Soon', role: 'admin' as UserRole, department: 'Management' },
  'esther@tassure.com': { name: 'Esther', role: 'admin' as UserRole, department: 'Internal' },
  'vincent@tassure.com': { name: 'Vincent', role: 'admin' as UserRole, department: 'Internal' },

  // Level 2: Leader (Self Review + Leader Review)
  'hoechyi@tassure.com': { name: 'Hoe Chyi', role: 'leader' as UserRole, department: 'Corporate Secretarial' },
  'sengxin@tassure.com': { name: 'Seng Xin', role: 'leader' as UserRole, department: 'Corporate Secretarial' },
  'clarencesaw@tassure.com': { name: 'Clarence', role: 'leader' as UserRole, department: 'Tax' },
  'jaytay@tassure.com': { name: 'Jay', role: 'leader' as UserRole, department: 'Accounting' },
  'jingfei@tassure.com': { name: 'Jing Fei', role: 'leader' as UserRole, department: 'Accounting' },

  // Level 3: Employee (Self Review only)
  'jennylai@tassure.com': { name: 'Jenny Lai', role: 'employee' as UserRole, department: 'Corporate Secretarial' },
  'kahye@tassure.com': { name: 'Chin Kah Ye', role: 'employee' as UserRole, department: 'Corporate Secretarial' },
  'shiming@tassure.com': { name: 'Ang Shi Ming', role: 'employee' as UserRole, department: 'Corporate Secretarial' },
  'shemin@tassure.com': { name: 'Tey Shemin', role: 'employee' as UserRole, department: 'Corporate Secretarial' },
  'minquan@tassure.com': { name: 'Tan Min Quan', role: 'employee' as UserRole, department: 'Corporate Secretarial' },
  'yuheng@tassure.com': { name: 'Tee Yu Heng', role: 'employee' as UserRole, department: 'Accounting' },
  'vernice@tassure.com': { name: 'Vernice Chai', role: 'employee' as UserRole, department: 'Accounting' },
  'weien@tassure.com': { name: 'Chee Wei En', role: 'employee' as UserRole, department: 'Accounting' },
  'chelsea@tassure.com': { name: 'Chelsea Ang', role: 'employee' as UserRole, department: 'Internal' },
  'quinnietan@tassure.com': { name: 'Quinnie Tan', role: 'employee' as UserRole, department: 'Tax' },
  'victoriayap@tassure.com': { name: 'Victoria Yap', role: 'employee' as UserRole, department: 'Tax' },
} as const;

export const PASSWORD = '123456';

export const DIRECTOR_EMAILS = [
  'cindyzhang@tassure.com',
  'samuellng@tassure.com',
  'yeesoon@tassure.com',
];

// All users who need to submit reviews (non-admin)
export const ALL_REVIEWABLE_USERS: User[] = Object.entries(USERS_DATABASE)
  .filter(([, data]) => data.role !== 'admin')
  .map(([email, data]) => ({
    id: email,
    email,
    name: data.name,
    role: data.role as UserRole,
    department: data.department,
  }));

// 验证登录
export async function authenticate(email: string, password: string): Promise<User | null> {
  // 简单的密码验证（后续改为 Supabase auth）
  if (password !== PASSWORD) {
    return null;
  }

  const userData = USERS_DATABASE[email as keyof typeof USERS_DATABASE];
  if (!userData) {
    return null;
  }

  return {
    id: email,
    email,
    name: userData.name,
    role: userData.role,
    department: userData.department,
  };
}

// ─── Google (Supabase) authentication ────────────────────────────────────────
// Only company Google Workspace accounts may sign in.
export const ALLOWED_EMAIL_DOMAIN = 'tassure.com';

// Map a verified email (from a Google/Supabase session) to an app User, or null
// if the email is not a registered member of the review system.
export function mapEmailToUser(email: string): User | null {
  const normalized = email.trim().toLowerCase();
  const userData = USERS_DATABASE[normalized as keyof typeof USERS_DATABASE];
  if (!userData) return null;
  return {
    id: normalized,
    email: normalized,
    name: userData.name,
    role: userData.role,
    department: userData.department,
  };
}

// Kick off the Google OAuth flow. The browser is redirected to Google and,
// after consent, back to the app origin where the session is finalized.
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      // hd hints Google to pre-select the company domain; real enforcement is
      // done below in resolveSessionUser (and by RLS at the database).
      queryParams: { hd: ALLOWED_EMAIL_DOMAIN, prompt: 'select_account' },
    },
  });
  return { error: error ? error.message : null };
}

export type SessionResolveReason = 'no-session' | 'wrong-domain' | 'not-registered';

// Resolve the current Supabase session into an app User, validating that the
// email belongs to the company domain and is a registered member.
export async function resolveSessionUser(): Promise<{ user: User | null; reason?: SessionResolveReason }> {
  const { data } = await supabase.auth.getSession();
  const email = data.session?.user?.email?.toLowerCase();
  if (!email) return { user: null, reason: 'no-session' };
  if (!email.endsWith('@' + ALLOWED_EMAIL_DOMAIN)) return { user: null, reason: 'wrong-domain' };
  const user = mapEmailToUser(email);
  if (!user) return { user: null, reason: 'not-registered' };
  return { user };
}

// Single logout entry point: clears both the Supabase session and the cached
// user object so the user is not silently re-authenticated.
export async function logout(): Promise<void> {
  try { await supabase.auth.signOut(); } catch { /* ignore */ }
  if (typeof window !== 'undefined') localStorage.removeItem('user');
}

// 权限检查
export function hasAccess(role: UserRole, page: string): boolean {
  const permissions = {
    admin: ['self-review', 'leader-review', 'admin-dashboard'],
    leader: ['self-review', 'leader-review'],
    employee: ['self-review'],
  };

  return permissions[role].includes(page);
}
