'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { User, ALL_REVIEWABLE_USERS, DIRECTOR_EMAILS } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getCurrentReviewPeriod, formatPeriodDisplay } from '@/lib/reviewHelpers';

interface SubmissionRow {
  id: string;
  user_id: string;
  submitted_at: string | null;
  status: 'draft' | 'submitted';
  department: string;
  employee_name: string;
  employee_email: string;
  review_period: string;
  form_data?: any;
  director_comment?: string;
  source_table?: string;
}

interface SuggestionRow {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  department: string;
  suggestion: string;
  files: Array<{name: string; url: string}>;
  submitted_at: string | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('status-overview');
  const [selfReviews, setSelfReviews] = useState<SubmissionRow[]>([]);
  const [leaderReviews, setLeaderReviews] = useState<SubmissionRow[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [totalSuggestions, setTotalSuggestions] = useState(0);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestionRow | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<SubmissionRow | null>(null);
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalSelfReviews, setTotalSelfReviews] = useState(0);
  const [totalLeaderReviews, setTotalLeaderReviews] = useState(0);
  const [hrReviews, setHrReviews] = useState<SubmissionRow[]>([]);
  const [financeReviews, setFinanceReviews] = useState<SubmissionRow[]>([]);
  const [marketingReviews, setMarketingReviews] = useState<SubmissionRow[]>([]);
  const [totalHrReviews, setTotalHrReviews] = useState(0);
  const [totalFinanceReviews, setTotalFinanceReviews] = useState(0);
  const [totalMarketingReviews, setTotalMarketingReviews] = useState(0);
  const pageSize = 50;

  // Table view state
  const [tableAllSelf, setTableAllSelf] = useState<SubmissionRow[]>([]);
  const [tableAllLeader, setTableAllLeader] = useState<SubmissionRow[]>([]);
  const [tableDataLoaded, setTableDataLoaded] = useState(false);
  const [tableYearSel, setTableYearSel] = useState('');
  const [tableMonthSel, setTableMonthSel] = useState('');
  const [tablePersonSel, setTablePersonSel] = useState('');
  const [tableDetailRow, setTableDetailRow] = useState<SubmissionRow | null>(null);
  const [tableDemoMode, setTableDemoMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingComment, setEditingComment] = useState<{id: string; value: string} | null>(null);

  // Status overview state
  const [overviewSelf, setOverviewSelf]       = useState<SubmissionRow[]>([]);
  const [overviewLeader, setOverviewLeader]   = useState<SubmissionRow[]>([]);
  const [overviewLoaded, setOverviewLoaded]   = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    setUser(parsedUser);
    setIsEmbedded(window.self !== window.top);
    fetchAllReviews(currentPage);
    fetchSuggestions(currentPage);
    fetchOverviewData();
  }, [router, currentPage]);

  const fetchTableData = async () => {
    if (tableDataLoaded) return;
    const [selfRes, leaderRes] = await Promise.all([
      supabase.from('self_review_submissions').select('*').order('review_period', { ascending: true }),
      supabase.from('leader_review_submissions').select('*').order('review_period', { ascending: true })
    ]);
    if (selfRes.data) setTableAllSelf(selfRes.data.map((r: any) => ({
      id: r.id, user_id: r.user_id, submitted_at: r.submitted_at,
      status: r.submitted_at ? 'submitted' : 'draft',
      department: r.department, employee_name: r.employee_name,
      employee_email: r.employee_email, review_period: r.review_period, form_data: r.form_data
    })));
    if (leaderRes.data) setTableAllLeader(leaderRes.data.map((r: any) => ({
      id: r.id, user_id: r.user_id, submitted_at: r.submitted_at,
      status: r.submitted_at ? 'submitted' : 'draft',
      department: r.department, employee_name: r.employee_name,
      employee_email: r.employee_email, review_period: r.review_period, form_data: r.form_data
    })));
    setTableDataLoaded(true);
  };

  const loadDemoData = () => {
    const employees = [
      // Corporate Secretarial
      { name: 'Hoe Chyi',     email: 'hoechyi@tassure.com',    dept: 'Corporate Secretarial', isLeader: true,  srcTable: 'self_review_submissions'    },
      { name: 'Seng Xin',     email: 'sengxin@tassure.com',    dept: 'Corporate Secretarial', isLeader: true,  srcTable: 'self_review_submissions'    },
      { name: 'Jenny Lai',    email: 'jennylai@tassure.com',   dept: 'Corporate Secretarial', isLeader: false, srcTable: 'self_review_submissions'    },
      { name: 'Chin Kah Ye', email: 'kahye@tassure.com',      dept: 'Corporate Secretarial', isLeader: false, srcTable: 'self_review_submissions'    },
      { name: 'Ang Shi Ming', email: 'shiming@tassure.com',   dept: 'Corporate Secretarial', isLeader: false, srcTable: 'self_review_submissions'    },
      { name: 'Tey Shemin',   email: 'shemin@tassure.com',     dept: 'Corporate Secretarial', isLeader: false, srcTable: 'self_review_submissions'    },
      { name: 'Tan Min Quan', email: 'minquan@tassure.com',   dept: 'Corporate Secretarial', isLeader: false, srcTable: 'self_review_submissions'    },
      // Accounting
      { name: 'Jay',          email: 'jaytay@tassure.com',     dept: 'Accounting',            isLeader: true,  srcTable: 'self_review_submissions'    },
      { name: 'Jing Fei',     email: 'jingfei@tassure.com',    dept: 'Accounting',            isLeader: true,  srcTable: 'self_review_submissions'    },
      { name: 'Tee Yu Heng',  email: 'yuheng@tassure.com',     dept: 'Accounting',            isLeader: false, srcTable: 'self_review_submissions'    },
      { name: 'Vernice Chai', email: 'vernice@tassure.com',    dept: 'Accounting',            isLeader: false, srcTable: 'self_review_submissions'    },
      { name: 'Chee Wei En',  email: 'weien@tassure.com',      dept: 'Accounting',            isLeader: false, srcTable: 'self_review_submissions'    },
      // Tax
      { name: 'Clarence',     email: 'clarencesaw@tassure.com',dept: 'Tax',                   isLeader: true,  srcTable: 'self_review_submissions'    },
      { name: 'Quinnie Tan',  email: 'quinnietan@tassure.com', dept: 'Tax',                   isLeader: false, srcTable: 'self_review_submissions'    },
      { name: 'Victoria Yap', email: 'victoriayap@tassure.com',dept: 'Tax',                   isLeader: false, srcTable: 'self_review_submissions'    },
      // Internal
      { name: 'Esther',       email: 'esther@tassure.com',     dept: 'Internal-HR',           isLeader: false, srcTable: 'hr_review_submissions'      },
      { name: 'Chelsea Ang',  email: 'chelsea@tassure.com',    dept: 'Internal-Finance',      isLeader: false, srcTable: 'finance_review_submissions' },
      { name: 'Vincent',      email: 'vincent@tassure.com',    dept: 'Internal-Marketing',    isLeader: false, srcTable: 'marketing_review_submissions'},
    ];
    // Last 12 months up to current period (2026-06)
    const periods = ['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06'];
    // Statuses: submitted / draft / null — 18 employees × 12 months
    // pi:           0           1           2           3           4           5           6           7           8           9          10          11
    const selfMatrix: (string|null)[][] = [
      // Corporate Secretarial
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted', null      ], // Hoe Chyi
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','draft'     ], // Seng Xin
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted', null      ], // Jenny Lai
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','draft',     'submitted', null      ], // Chin Kah Ye
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted', null      ], // Ang Shi Ming
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','draft',     'submitted','submitted', null      ], // Tey Shemin
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted', null      ], // Tan Min Quan
      // Accounting
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted'], // Jay
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted', null      ], // Jing Fei
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted', null      ], // Tee Yu Heng
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','draft',     null      ], // Vernice Chai
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted', null      ], // Chee Wei En
      // Tax
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','draft'     ], // Clarence
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted', null      ], // Quinnie Tan
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','draft',     'submitted','submitted','submitted', null      ], // Victoria Yap
      // Internal
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted', null      ], // Esther
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','draft'     ], // Chelsea Ang
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','draft'     ], // Vincent
    ];
    const leaderMatrix: (string|null)[][] = [
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted', null      ], // Hoe Chyi
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted', null      ], // Seng Xin
      [null,null,null,null,null,null,null,null,null,null,null,null], // Jenny Lai
      [null,null,null,null,null,null,null,null,null,null,null,null], // Chin Kah Ye
      [null,null,null,null,null,null,null,null,null,null,null,null], // Ang Shi Ming
      [null,null,null,null,null,null,null,null,null,null,null,null], // Tey Shemin
      [null,null,null,null,null,null,null,null,null,null,null,null], // Tan Min Quan
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted'], // Jay
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted', null      ], // Jing Fei
      [null,null,null,null,null,null,null,null,null,null,null,null], // Tee Yu Heng
      [null,null,null,null,null,null,null,null,null,null,null,null], // Vernice Chai
      [null,null,null,null,null,null,null,null,null,null,null,null], // Chee Wei En
      ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted'], // Clarence
      [null,null,null,null,null,null,null,null,null,null,null,null], // Quinnie Tan
      [null,null,null,null,null,null,null,null,null,null,null,null], // Victoria Yap
      [null,null,null,null,null,null,null,null,null,null,null,null], // Esther
      [null,null,null,null,null,null,null,null,null,null,null,null], // Chelsea Ang
      [null,null,null,null,null,null,null,null,null,null,null,null], // Vincent
    ];
    const selfRows: SubmissionRow[] = [];
    const leaderRows: SubmissionRow[] = [];
    let idCounter = 1000;
    employees.forEach((emp, ei) => {
      periods.forEach((period, pi) => {
        const sStatus = selfMatrix[ei][pi];
        if (sStatus) selfRows.push({ id: `demo-s-${idCounter++}`, user_id: emp.email, submitted_at: sStatus==='submitted'?`${period}-15T09:00:00Z`:null, status: sStatus as any, department: emp.dept, employee_name: emp.name, employee_email: emp.email, review_period: period, form_data: null, source_table: emp.srcTable });
        if (emp.isLeader) {
          const lStatus = leaderMatrix[ei][pi];
          if (lStatus) leaderRows.push({ id: `demo-l-${idCounter++}`, user_id: emp.email, submitted_at: lStatus==='submitted'?`${period}-16T10:00:00Z`:null, status: lStatus as any, department: emp.dept, employee_name: emp.name, employee_email: emp.email, review_period: period, form_data: null, source_table: 'leader_review_submissions' });
        }
      });
    });
    const curPeriod = getCurrentReviewPeriod();
    setTableAllSelf(selfRows);
    setTableAllLeader(leaderRows);
    setSelfReviews(selfRows);
    setLeaderReviews(leaderRows);
    setTotalSelfReviews(selfRows.length);
    setTotalLeaderReviews(leaderRows.length);
    setOverviewSelf(selfRows.filter(r => r.review_period === curPeriod));
    setOverviewLeader(leaderRows.filter(r => r.review_period === curPeriod));
    setOverviewLoaded(true);
    setTableDataLoaded(true);
    setTableDemoMode(true);
    setTableYearSel('2026');
    setTableMonthSel('06');
    setTablePersonSel('');
    setLoading(false);
  };

  const clearDemoData = () => {
    setTableAllSelf([]);
    setTableAllLeader([]);
    setSelfReviews([]);
    setLeaderReviews([]);
    setTotalSelfReviews(0);
    setTotalLeaderReviews(0);
    setOverviewSelf([]);
    setOverviewLeader([]);
    setOverviewLoaded(false);
    setTableDataLoaded(false);
    setTableDemoMode(false);
    setTableYearSel('');
    setTableMonthSel('');
    setTablePersonSel('');
  };

  const fetchOverviewData = async () => {
    if (overviewLoaded) return;
    const period = getCurrentReviewPeriod();
    const [selfRes, leaderRes] = await Promise.all([
      supabase.from('self_review_submissions').select('*').eq('review_period', period),
      supabase.from('leader_review_submissions').select('*').eq('review_period', period),
    ]);
    if (selfRes.data) setOverviewSelf(selfRes.data.map((r: any) => ({ id:r.id, user_id:r.user_id, submitted_at:r.submitted_at, status:r.submitted_at?'submitted':'draft', department:r.department, employee_name:r.employee_name, employee_email:r.employee_email, review_period:r.review_period, form_data:r.form_data })));
    if (leaderRes.data) setOverviewLeader(leaderRes.data.map((r: any) => ({ id:r.id, user_id:r.user_id, submitted_at:r.submitted_at, status:r.submitted_at?'submitted':'draft', department:r.department, employee_name:r.employee_name, employee_email:r.employee_email, review_period:r.review_period, form_data:r.form_data })));
    setOverviewLoaded(true);
  };

  const handleActiveMenuChangeRef = useRef<(menu: string) => void>(() => {});

  const handleActiveMenuChange = (menu: string) => {
    setActiveMenu(menu);
    setCurrentPage(0);
    setSearchTerm('');
    setFilterDept('');
    setFilterStatus('');
    setFilterYear('');
    setFilterMonth('');
    if (menu === 'table-by-year' || menu === 'table-by-person') fetchTableData();
    if (menu === 'status-overview') fetchOverviewData();
  };
  handleActiveMenuChangeRef.current = handleActiveMenuChange;

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'setAdminMenu') handleActiveMenuChangeRef.current(e.data.menu);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const fetchSuggestions = async (page: number = 0) => {
    const start = page * pageSize;
    const end = start + pageSize - 1;
    const [countRes, dataRes] = await Promise.all([
      supabase.from('suggestion_submissions').select('id', { count: 'exact', head: true }),
      supabase.from('suggestion_submissions').select('*').order('submitted_at', { ascending: false }).range(start, end)
    ]);
    setTotalSuggestions(countRes.count || 0);
    if (dataRes.data) setSuggestions(dataRes.data as SuggestionRow[]);
  };

  const INTERNAL_DEPT_MAP: Record<string, string> = {
    'esther@tassure.com': 'Internal-HR',
    'chelsea@tassure.com': 'Internal-Finance',
    'vincent@tassure.com': 'Internal-Marketing',
  };
  const mapRow = (r: any, sourceTable?: string): SubmissionRow => ({
    id: r.id, user_id: r.user_id, submitted_at: r.submitted_at,
    status: r.submitted_at ? 'submitted' : 'draft',
    department: INTERNAL_DEPT_MAP[r.employee_email] ?? r.department,
    employee_name: r.employee_name,
    employee_email: r.employee_email, review_period: r.review_period, form_data: r.form_data,
    director_comment: r.director_comment || '',
    source_table: sourceTable,
  });

  const fetchAllReviews = async (page: number = 0) => {
    try {
      const start = page * pageSize;
      const end = start + pageSize - 1;

      const [selfCountRes, selfDataRes, leaderCountRes, leaderDataRes,
             hrCountRes, finCountRes, mktCountRes,
             hrInternalRes, finInternalRes, mktInternalRes] = await Promise.all([
        supabase.from('self_review_submissions').select('id', { count: 'exact', head: true }),
        supabase.from('self_review_submissions').select('*').range(start, end),
        supabase.from('leader_review_submissions').select('id', { count: 'exact', head: true }),
        supabase.from('leader_review_submissions').select('*').range(start, end),
        supabase.from('hr_review_submissions').select('id', { count: 'exact', head: true }),
        supabase.from('finance_review_submissions').select('id', { count: 'exact', head: true }),
        supabase.from('marketing_review_submissions').select('id', { count: 'exact', head: true }),
        supabase.from('hr_review_submissions').select('*').eq('employee_email', 'esther@tassure.com'),
        supabase.from('finance_review_submissions').select('*').eq('employee_email', 'chelsea@tassure.com'),
        supabase.from('marketing_review_submissions').select('*').eq('employee_email', 'vincent@tassure.com'),
      ]);

      setTotalSelfReviews(selfCountRes.count || 0);
      setTotalLeaderReviews(leaderCountRes.count || 0);
      setTotalHrReviews(hrCountRes.count || 0);
      setTotalFinanceReviews(finCountRes.count || 0);
      setTotalMarketingReviews(mktCountRes.count || 0);

      const selfRows = (selfDataRes.data || []).map((r: any) => mapRow(r, 'self_review_submissions'));
      const hrInternal = (hrInternalRes.data || []).map((r: any) => mapRow(r, 'hr_review_submissions'));
      const finInternal = (finInternalRes.data || []).map((r: any) => mapRow(r, 'finance_review_submissions'));
      const mktInternal = (mktInternalRes.data || []).map((r: any) => mapRow(r, 'marketing_review_submissions'));
      const mergedSelf = [...selfRows, ...hrInternal, ...finInternal, ...mktInternal]
        .sort((a, b) => {
          const ta = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
          const tb = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
          return tb - ta;
        });
      setSelfReviews(mergedSelf);

      if (leaderDataRes.data) setLeaderReviews(leaderDataRes.data.map((r: any) => mapRow(r, 'leader_review_submissions')));
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSuggestion = async (row: SuggestionRow) => {
    if (!confirm(`Delete suggestion by ${row.user_name}? This cannot be undone.`)) return;
    const { error } = await supabase.from('suggestion_submissions').delete().eq('id', row.id);
    if (error) {
      alert('Delete failed: ' + error.message);
    } else {
      fetchSuggestions(currentPage);
    }
  };

  const handleDelete = async (row: SubmissionRow) => {
    if (!confirm(`Delete submission by ${row.employee_name}? This cannot be undone.`)) return;
    const tableMap: Record<string, string> = {
      'self-reviews': 'self_review_submissions',
      'leader-reviews': 'leader_review_submissions',
    };
    const table = row.source_table || tableMap[activeMenu] || 'self_review_submissions';
    const { error } = await supabase.from(table).delete().eq('id', row.id);
    if (error) {
      alert('Delete failed: ' + error.message);
    } else {
      fetchAllReviews(currentPage);
      // Invalidate table view cache so it re-fetches with latest data
      setTableDataLoaded(false);
      setTableAllSelf([]);
      setTableAllLeader([]);
    }
  };

  const handleSaveComment = async (row: SubmissionRow, comment: string) => {
    const tableMap: Record<string, string> = {
      'self-reviews': 'self_review_submissions',
      'leader-reviews': 'leader_review_submissions',
    };
    const table = row.source_table || tableMap[activeMenu] || 'self_review_submissions';
    const { error } = await supabase.from(table).update({ director_comment: comment }).eq('id', row.id);
    if (error) {
      alert('Save failed: ' + error.message);
    } else {
      setEditingComment(null);
      fetchAllReviews(currentPage);
    }
  };

  const handleExportAll = async () => {
    const period = getCurrentReviewPeriod();
    const EXCLUDED = ['chelsea@tassure.com', 'esther@tassure.com', 'vincent@tassure.com'];
    const fmt = (v: any) => v ?? '';
    const fmtDate = (v: any) => v ? new Date(v).toLocaleString('en-GB', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '';

    const [selfRes, leaderRes, hrRes, finRes, mktRes, sugRes] = await Promise.all([
      supabase.from('self_review_submissions').select('*').eq('review_period', period),
      supabase.from('leader_review_submissions').select('*').eq('review_period', period),
      supabase.from('hr_review_submissions').select('*').eq('review_period', period),
      supabase.from('finance_review_submissions').select('*').eq('review_period', period),
      supabase.from('marketing_review_submissions').select('*').eq('review_period', period),
      supabase.from('suggestion_submissions').select('*').order('submitted_at', { ascending: false }),
    ]);

    const kpiKeys = ['client_complaints','client_attrition','minor_delays','serious_delays','minor_errors','serious_errors','communication_issues','team_impact','learning_application'];
    const posKeys = ['pos_compliment','pos_requested','pos_prevented','pos_recovered','pos_resolved','pos_business','pos_special'];

    // ── SELF sheet ──
    const selfRows = (selfRes.data || []).filter((r: any) => !EXCLUDED.includes(r.employee_email));
    const selfHeaders = [
      'Submitted At','Name','Email','Department','Period','Status',
      ...kpiKeys.flatMap(k => [`${k} Count`, `${k} Comment`]),
      ...posKeys.map(k => `${k} Description`),
    ];
    const selfSheetData = [
      selfHeaders,
      ...selfRows.map((r: any) => {
        const fd = r.form_data || {};
        return [
          fmtDate(r.submitted_at), fmt(r.employee_name), fmt(r.employee_email),
          fmt(r.department), fmt(r.review_period), r.submitted_at ? 'Submitted' : 'Draft',
          ...kpiKeys.flatMap(k => [fd.kpis?.[k]?.count ?? 0, fmt(fd.kpis?.[k]?.comment)]),
          ...posKeys.map(k => fmt(fd.positive_items?.[k]?.description)),
        ];
      }),
    ];

    // ── LEADER sheet ──
    const leaderRows = leaderRes.data || [];
    const leaderHeaders = ['Submitted At','Leader Name','Leader Email','Department','Period','Status','KPI','Employee','Comment','Positive Item','Positive Comment','Overall Remarks'];
    const leaderSheetData: any[][] = [leaderHeaders];
    leaderRows.forEach((r: any) => {
      const fd = r.form_data || {};
      const base = [fmtDate(r.submitted_at), fmt(r.employee_name), fmt(r.employee_email), fmt(r.department), fmt(r.review_period), r.submitted_at ? 'Submitted' : 'Draft'];
      const entries: any[][] = [];
      Object.values(fd.kpis || {}).forEach((kpi: any) => {
        (kpi.rows || []).forEach((row: any) => {
          if (row.employee?.trim() || row.comment?.trim())
            entries.push([...base, kpi.kpi, row.employee, row.comment, '', '', '']);
        });
      });
      Object.values(fd.positive_items || {}).forEach((pos: any) => {
        (pos.rows || []).forEach((row: any) => {
          if (row.comment?.trim())
            entries.push([...base, '', '', '', pos.label, row.comment, '']);
        });
      });
      if (fd.overall_remarks?.remarks?.trim())
        entries.push([...base, '', '', '', '', '', fd.overall_remarks.remarks]);
      if (entries.length === 0) leaderSheetData.push([...base, '', '', '', '', '', '']);
      else entries.forEach((e, i) => leaderSheetData.push(i === 0 ? e : [...base.map(() => ''), ...e.slice(6)]));
    });

    // ── INTERNAL sheet (HR + Finance + Marketing) ──
    const internalRows = [
      ...(hrRes.data || []).map((r: any) => ({...r, review_type: 'HR'})),
      ...(finRes.data || []).map((r: any) => ({...r, review_type: 'Finance'})),
      ...(mktRes.data || []).map((r: any) => ({...r, review_type: 'Marketing'})),
    ];
    const internalHeaders = ['Type','Submitted At','Name','Email','Department','Period','Status','KPI Issues Summary','Positive Contributions Summary'];
    const internalSheetData = [
      internalHeaders,
      ...internalRows.map((r: any) => {
        const fd = r.form_data || {};
        const kpiSummary = Object.entries(fd.kpis || {})
          .filter(([, v]: any) => (v.count ?? 0) > 0 || v.comment?.trim())
          .map(([k, v]: any) => `${k}(×${v.count ?? 0})`)
          .join('; ');
        const posSummary = Object.entries(fd.positive_items || {})
          .filter(([, v]: any) => v.description?.trim())
          .map(([k]: any) => k)
          .join('; ');
        return [
          r.review_type, fmtDate(r.submitted_at), fmt(r.employee_name), fmt(r.employee_email),
          fmt(r.department), fmt(r.review_period), r.submitted_at ? 'Submitted' : 'Draft',
          kpiSummary, posSummary,
        ];
      }),
    ];

    // ── SUGGESTION sheet ──
    const sugHeaders = ['Submitted At','Name','Email','Department','Suggestion','File Count'];
    const sugSheetData = [
      sugHeaders,
      ...(sugRes.data || []).map((r: any) => [
        fmtDate(r.submitted_at), fmt(r.user_name), fmt(r.user_email),
        fmt(r.department), fmt(r.suggestion), r.files?.length ?? 0,
      ]),
    ];

    // ── Build workbook ──
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(selfSheetData),     'SELF');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(leaderSheetData),   'LEADER');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(internalSheetData), 'INTERNAL');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sugSheetData),      'SUGGESTION');
    XLSX.writeFile(wb, `tassure-review-${period}.xlsx`);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)'}}>
      <div style={{color: '#64748b'}}>Loading...</div>
    </div>;
  }

  if (!user) {
    return null;
  }

  const displayData =
    activeMenu === 'self-reviews'   ? selfReviews :
    activeMenu === 'leader-reviews' ? leaderReviews : [];
  const filteredData = displayData.filter(row => {
    const matchesSearch =
      row.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.employee_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !filterDept || row.department === filterDept;
    const matchesStatus = !filterStatus || row.status === filterStatus;
    const matchesPeriod = !filterYear
      ? true
      : filterMonth
        ? row.review_period === `${filterYear}-${filterMonth}`
        : row.review_period?.startsWith(filterYear);
    return matchesSearch && matchesDept && matchesStatus && matchesPeriod;
  });


  const KPI_INFO: Record<string, {name: string; question: string}> = {
    client_complaints: { name: 'Client Complaints / Issues 客户抱怨／异常', question: 'Were there any client complaints, issues or controllable churn? / 有没有客户抱怨、异常和可控流失？' },
    client_attrition:  { name: 'Client Attrition / 客户流失', question: 'Was there client loss due to lack of follow-up or unresolved issues? / 因为没有及时跟进和解决问题，导致客户流失？' },
    minor_delays:      { name: 'Chased / Minor Delays / 被催、一般延误', question: 'Was the employee chased by clients or management? / 有没有被催、被客户或被管理？' },
    serious_delays:    { name: 'Serious Delays / 严重延误', question: 'Were there delays that affected client arrangements or led to cancellations? / 有没有延误影响客户安排，甚至导致客户取消服务？' },
    minor_errors:      { name: 'Minor Errors / 轻微错误', question: 'Were there any mistakes made? / 有没有出错？' },
    serious_errors:    { name: 'Serious Errors / Penalty Risk / 严重错误／罚款风险', question: 'Were there any filing issues, penalty risks or client impact? / 是否有申报、罚款和客户影响风险？' },
    communication_issues: { name: 'Communication / Handover Issues / 沟通／交接问题', question: 'Was collaboration with colleagues smooth? / 和员工和同事协作顺不顺？' },
    team_impact:       { name: 'Team Impact / 影响团队', question: 'Were there any communication or handover problems? / 有没有沟通和交接问题？' },
    learning_application: { name: 'Learning & Application / 学习并应用', question: 'Has new knowledge been applied to work? / 学到的东西有没有在工作里正用？' },
  };

  const POSITIVE_INFO: Record<string, {name: string; question: string}> = {
    pos_compliment: { name: 'Written Client Compliment / 客户书面表扬', question: 'Client proactively sent email/message with explicit praise (not routine thanks) / 客户主动发email/message有明确表扬，非常规感谢' },
    pos_requested:  { name: 'Client Requested Same Staff / 客户点名继续服务', question: 'Client explicitly requested the same employee or gave special recognition / 客户明确要求继续由该员工负责，有特别认可' },
    pos_prevented:  { name: 'Prevented Major Risk / Penalty / 避免重大风险／罚款', question: 'Identified issues outside scope and prevented significant losses / 超职责范围发现问题并避免重大损失' },
    pos_recovered:  { name: 'Recovered Client / 挽回客户', question: 'Successfully retained a client at risk of leaving / 已有流失风险客户被成功挽回' },
    pos_resolved:   { name: 'Resolved Legacy / Complex Issues / 解决遗留／复杂问题', question: 'Took over and resolved problems not caused by themselves / 接手非本人造成的问题并成功处理' },
    pos_business:   { name: 'Additional Business Opportunity / 额外业务机会', question: 'Referral / upsell / cross-sell (outside sales role) / 转介业务' },
    pos_special:    { name: 'Special Contribution / 特别贡献', question: 'Contribution clearly beyond job scope, requires manager explanation / 有明显超出岗位职责的贡献，需主管说明' },
  };

  const hasContent = (val: any) =>
    (val?.count ?? 0) > 0 || val?.comment?.trim() || val?.description?.trim() || val?.files?.length > 0;

  const renderFiles = (files: any[]) => {
    if (!files?.length) return null;
    return (
      <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px'}}>
        {files.map((f: any, i: number) => (
          f.url && !f.url.startsWith('blob:') ? (
            <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" style={{
              background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '5px',
              fontSize: '11px', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px'
            }}>
              📎 {f.name} ↗
            </a>
          ) : (
            <span key={i} style={{background: '#f1f5f9', color: '#94a3b8', padding: '4px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px'}} title="File URL expired (uploaded before storage was set up)">
              📎 {f.name} (expired)
            </span>
          )
        ))}
      </div>
    );
  };

  const renderFormData = (form_data: any, type: string) => {
    if (type === 'self-reviews') {
      const kpis = form_data?.kpis || {};
      const positiveItems = form_data?.positive_items || {};

      const filledKpis = Object.entries(kpis).filter(([, val]: any) => hasContent(val));
      const filledPositive = Object.entries(positiveItems).filter(([, val]: any) =>
        val?.description?.trim() || val?.files?.length > 0
      );

      return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
          {/* KPI Issues */}
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px'}}>
              <div style={{width: '4px', height: '16px', background: '#7eb8d4', borderRadius: '2px'}} />
              <span style={{fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px'}}>KPI Performance</span>
            </div>
            {filledKpis.length > 0 ? (
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                {filledKpis.map(([key, val]: any) => {
                  const info = KPI_INFO[key];
                  return (
                    <div key={key} style={{background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '4px'}}>
                        <span style={{fontSize: '13px', fontWeight: '700', color: '#0f172a'}}>{info?.name || key}</span>
                        {val.count > 0 && (
                          <span style={{flexShrink: 0, background: '#dbeafe', color: '#1d4ed8', padding: '2px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700'}}>
                            ×{val.count}
                          </span>
                        )}
                      </div>
                      {info?.question && (
                        <p style={{fontSize: '12px', color: '#94a3b8', margin: '0 0 6px 0', lineHeight: '1.5', fontStyle: 'italic'}}>{info.question}</p>
                      )}
                      {val.comment?.trim() && (
                        <p style={{fontSize: '13px', color: '#475569', margin: '6px 0 0 0', lineHeight: '1.6', background: 'rgba(255,255,255,0.7)', padding: '8px 10px', borderRadius: '6px'}}>{val.comment}</p>
                      )}
                      {renderFiles(val.files)}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#1d4ed8', fontWeight: '600'}}>
                ✓ No issues reported
              </div>
            )}
          </div>

          {/* Positive Contributions */}
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px'}}>
              <div style={{width: '4px', height: '16px', background: '#16a34a', borderRadius: '2px'}} />
              <span style={{fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Positive Contributions</span>
            </div>
            {filledPositive.length > 0 ? (
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                {filledPositive.map(([key, val]: any) => {
                  const info = POSITIVE_INFO[key];
                  return (
                    <div key={key} style={{background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 14px'}}>
                      <div style={{fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '4px'}}>{info?.name || key}</div>
                      {info?.question && (
                        <p style={{fontSize: '12px', color: '#94a3b8', margin: '0 0 6px 0', lineHeight: '1.5', fontStyle: 'italic'}}>{info.question}</p>
                      )}
                      {val.description?.trim() && (
                        <p style={{fontSize: '13px', color: '#475569', margin: '6px 0 0 0', lineHeight: '1.6', background: 'rgba(255,255,255,0.7)', padding: '8px 10px', borderRadius: '6px'}}>{val.description}</p>
                      )}
                      {renderFiles(val.files)}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#94a3b8'}}>
                No positive contributions noted
              </div>
            )}
          </div>
        </div>
      );
    }

    // Leader review
    const kpis = form_data?.kpis || {};
    const positiveItems = form_data?.positive_items || {};
    const overallRemarks = form_data?.overall_remarks || {};

    const filledKpis = Object.entries(kpis).filter(([, val]: any) =>
      val.rows?.some((r: any) => r.employee?.trim() || r.comment?.trim() || r.files?.length > 0)
    );
    const filledPositive = Object.entries(positiveItems).filter(([, val]: any) =>
      val.rows?.some((r: any) => r.comment?.trim() || r.files?.length > 0)
    );
    const hasRemarks = overallRemarks.remarks?.trim() || overallRemarks.files?.length > 0;

    return (
      <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
        {/* KPI Evaluations */}
        <div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px'}}>
            <div style={{width: '4px', height: '16px', background: '#7eb8d4', borderRadius: '2px'}} />
            <span style={{fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px'}}>KPI Performance</span>
          </div>
          {filledKpis.length > 0 ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              {filledKpis.map(([key, val]: any) => (
                <div key={key} style={{background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px'}}>
                  <div style={{fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '8px'}}>{val.kpi}</div>
                  {val.rows?.filter((r: any) => r.employee?.trim() || r.comment?.trim() || r.files?.length > 0).map((row: any, i: number) => (
                    <div key={i} style={{marginTop: i > 0 ? '8px' : 0, paddingTop: i > 0 ? '8px' : 0, borderTop: i > 0 ? '1px dashed #bfdbfe' : 'none'}}>
                      {row.employee && <span style={{display: 'inline-block', background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '5px', fontSize: '12px', fontWeight: '700', marginBottom: '4px'}}>{row.employee}</span>}
                      {row.comment?.trim() && <p style={{fontSize: '13px', color: '#475569', margin: '4px 0 0 0', lineHeight: '1.6'}}>{row.comment}</p>}
                      {renderFiles(row.files)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div style={{background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#1d4ed8', fontWeight: '600'}}>
              ✓ No KPI issues recorded
            </div>
          )}
        </div>

        {/* Positive Items */}
        <div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px'}}>
            <div style={{width: '4px', height: '16px', background: '#16a34a', borderRadius: '2px'}} />
            <span style={{fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Positive Contributions</span>
          </div>
          {filledPositive.length > 0 ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              {filledPositive.map(([key, val]: any) => (
                <div key={key} style={{background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 14px'}}>
                  <div style={{fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '8px'}}>{val.label}</div>
                  {val.rows?.filter((r: any) => r.comment?.trim() || r.files?.length > 0).map((row: any, i: number) => (
                    <div key={i} style={{marginTop: i > 0 ? '6px' : 0}}>
                      {row.comment?.trim() && <p style={{fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.6'}}>{row.comment}</p>}
                      {renderFiles(row.files)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div style={{background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#94a3b8'}}>
              No positive contributions noted
            </div>
          )}
        </div>

        {/* Overall Remarks */}
        {hasRemarks && (
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px'}}>
              <div style={{width: '4px', height: '16px', background: '#7eb8d4', borderRadius: '2px'}} />
              <span style={{fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Overall Remarks</span>
            </div>
            <div style={{background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px'}}>
              {overallRemarks.remarks?.trim() && <p style={{fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.6'}}>{overallRemarks.remarks}</p>}
              {renderFiles(overallRemarks.files)}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDeptFormData = (form_data: any) => {
    const kpis = form_data?.kpis || {};
    const pos  = form_data?.positive_items || {};
    const overallRemarks = form_data?.overall_remarks;
    const filledKpis = Object.entries(kpis).filter(([, v]: any) => hasContent(v));
    const filledPos  = Object.entries(pos).filter(([, v]: any) => v?.description?.trim() || v?.files?.length > 0);
    const hasRemarks = overallRemarks?.remarks?.trim() || overallRemarks?.files?.length > 0;
    return (
      <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
            <div style={{width:'4px',height:'16px',background:'#7eb8d4',borderRadius:'2px'}} />
            <span style={{fontSize:'12px',fontWeight:'800',color:'#334155',textTransform:'uppercase',letterSpacing:'0.5px'}}>KPI Issues</span>
          </div>
          {filledKpis.length > 0 ? (
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {filledKpis.map(([key, val]: any) => (
                <div key={key} style={{background:'#f0f7ff',border:'1px solid #bfdbfe',borderRadius:'10px',padding:'12px 14px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px',gap:'12px'}}>
                    <span style={{fontSize:'13px',fontWeight:'700',color:'#0f172a',wordBreak:'break-word'}}>{key.replace(/_/g,' ')}</span>
                    {(val.count ?? 0) > 0 && <span style={{flexShrink:0,background:'#dbeafe',color:'#1d4ed8',padding:'2px 10px',borderRadius:'6px',fontSize:'12px',fontWeight:'700'}}>×{val.count}</span>}
                  </div>
                  {val.comment?.trim() && <p style={{fontSize:'13px',color:'#475569',margin:'6px 0 0',lineHeight:'1.6',background:'rgba(255,255,255,0.7)',padding:'8px 10px',borderRadius:'6px'}}>{val.comment}</p>}
                  {renderFiles(val.files)}
                </div>
              ))}
            </div>
          ) : (
            <div style={{background:'#f0f7ff',border:'1px solid #bfdbfe',borderRadius:'10px',padding:'12px 14px',fontSize:'13px',color:'#1d4ed8',fontWeight:'600'}}>✓ No issues reported</div>
          )}
        </div>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
            <div style={{width:'4px',height:'16px',background:'#16a34a',borderRadius:'2px'}} />
            <span style={{fontSize:'12px',fontWeight:'800',color:'#334155',textTransform:'uppercase',letterSpacing:'0.5px'}}>Positive Contributions</span>
          </div>
          {filledPos.length > 0 ? (
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {filledPos.map(([key, val]: any) => (
                <div key={key} style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'10px',padding:'12px 14px'}}>
                  <div style={{fontSize:'13px',fontWeight:'700',color:'#0f172a',marginBottom:'4px',wordBreak:'break-word'}}>{key.replace(/_/g,' ')}</div>
                  {val.description?.trim() && <p style={{fontSize:'13px',color:'#475569',margin:'6px 0 0',lineHeight:'1.6',background:'rgba(255,255,255,0.7)',padding:'8px 10px',borderRadius:'6px'}}>{val.description}</p>}
                  {renderFiles(val.files)}
                </div>
              ))}
            </div>
          ) : (
            <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'10px',padding:'12px 14px',fontSize:'13px',color:'#94a3b8'}}>No positive contributions noted</div>
          )}
        </div>
        {hasRemarks && (
          <div>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
              <div style={{width:'4px',height:'16px',background:'#1e3a5f',borderRadius:'2px'}} />
              <span style={{fontSize:'12px',fontWeight:'800',color:'#334155',textTransform:'uppercase',letterSpacing:'0.5px'}}>Overall Remarks</span>
            </div>
            <div style={{background:'#f0f7ff',border:'1px solid #bfdbfe',borderRadius:'10px',padding:'12px 14px'}}>
              {overallRemarks.remarks?.trim() && <p style={{fontSize:'13px',color:'#475569',margin:0,lineHeight:'1.6'}}>{overallRemarks.remarks}</p>}
              {renderFiles(overallRemarks.files)}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    if (status === 'Completed') return { bg: '#d1fae5', color: '#065f46' };
    if (status === 'Draft') return { bg: '#fef3c7', color: '#92400e' };
    return { bg: '#fee2e2', color: '#991b1b' };
  };

  return (
    <div style={{display: 'grid', gridTemplateColumns: isEmbedded ? '1fr' : (sidebarCollapsed ? '56px 1fr' : '260px 1fr'), minHeight: 'calc(100vh - 70px)', background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)', transition: 'grid-template-columns 0.25s ease'}}>
      {/* Navbar (above everything) */}
      {!isEmbedded && (
        <div style={{gridColumn: '1 / -1', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', borderBottom: '1px solid rgba(30, 58, 95, 0.08)', boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'}}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '1600px',
            margin: '0 auto',
            padding: '0 32px',
            height: '70px'
          }}>
            <Link href="/dashboard" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none'
            }}>
              <img src="/tassure-logo.png" alt="Tassure" style={{height: '32px', width: 'auto'}} />
              <div style={{fontSize: '14px', fontWeight: '800', color: '#1e3a5f'}}>Tassure Review System</div>
            </Link>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <span style={{fontSize: '14px', color: '#64748b'}}>{user.name}</span>
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1e3a5f',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '10px',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(30, 58, 95, 0.04)'}}
                onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent'}}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar — hidden when embedded (parent dashboard handles nav) */}
      {!isEmbedded && <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(30, 58, 95, 0.08)',
        padding: sidebarCollapsed ? '32px 8px' : '32px 24px',
        position: 'sticky',
        top: 70,
        height: 'calc(100vh - 70px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'padding 0.25s ease',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Toggle button */}
        <button
          onClick={() => setSidebarCollapsed(v => !v)}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            alignSelf: sidebarCollapsed ? 'center' : 'flex-end',
            marginBottom: '20px',
            width: '28px', height: '28px',
            borderRadius: '8px',
            border: '1.5px solid #e2e8f0',
            background: '#f8fafc',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '700',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(30,58,95,0.08)'; e.currentTarget.style.color = '#1e3a5f'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
        >
          {sidebarCollapsed ? '›' : '‹'}
        </button>

        {/* STATUS OVERVIEW section */}
        <div style={{marginBottom: '20px'}}>
          {!sidebarCollapsed && (
            <div style={{fontSize: '12px', fontWeight: '800', color: '#1e3a5f', letterSpacing: '0.4px', marginBottom: '14px', textTransform: 'uppercase'}}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',marginRight:'4px',verticalAlign:'middle'}}>
                <circle cx="6.5" cy="6.5" r="5.5"/>
                <path d="M4 6.5l1.5 1.5L9 4.5"/>
              </svg>
              Status
            </div>
          )}
          <div
            onClick={() => handleActiveMenuChange('status-overview')}
            title={sidebarCollapsed ? 'Status Overview' : undefined}
            style={{
              padding: sidebarCollapsed ? '10px' : '11px 14px',
              borderRadius: '10px', cursor: 'pointer',
              fontSize: '13px', fontWeight: '600',
              color: activeMenu === 'status-overview' ? '#1e3a5f' : '#64748b',
              transition: 'all 0.2s',
              boxShadow: !sidebarCollapsed && activeMenu === 'status-overview' ? 'inset 3px 0 0 #7eb8d4' : 'none',
              background: activeMenu === 'status-overview' ? 'rgba(126, 184, 212, 0.15)' : 'transparent',
              display: 'flex', alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: '10px',
              whiteSpace: 'nowrap', overflow: 'hidden'
            }}
            onMouseEnter={(e) => { if (activeMenu !== 'status-overview') { e.currentTarget.style.background = 'rgba(30,58,95,0.06)'; e.currentTarget.style.color = '#1e3a5f'; }}}
            onMouseLeave={(e) => { if (activeMenu !== 'status-overview') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}}
          >
            <span style={{flexShrink: 0, display: 'flex', alignItems: 'center'}}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="6"/>
                <path d="M5.5 8.5l2 2L11 6"/>
              </svg>
            </span>
            {!sidebarCollapsed && 'Status Overview'}
          </div>
        </div>

        {/* Divider */}
        <div style={{borderTop: '1.5px dashed #e2e8f0', margin: '4px 0 20px 0'}} />

        {/* DATA section */}
        <div style={{marginBottom: '20px'}}>
          {!sidebarCollapsed && (
            <div style={{fontSize: '12px', fontWeight: '800', color: '#1e3a5f', letterSpacing: '0.4px', marginBottom: '14px', textTransform: 'uppercase', display:'flex', alignItems:'center', gap:'5px'}}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="7" width="2.5" height="5" rx="0.5"/>
                <rect x="5" y="4" width="2.5" height="8" rx="0.5"/>
                <rect x="9.5" y="1" width="2.5" height="11" rx="0.5"/>
              </svg>
              Data
            </div>
          )}
          <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
            {(['self-reviews', 'leader-reviews'] as const).map(item => {
              const icon = item === 'self-reviews' ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="1.5" width="10" height="13" rx="1.5"/>
                  <line x1="5.5" y1="5.5" x2="10.5" y2="5.5"/>
                  <line x1="5.5" y1="8" x2="10.5" y2="8"/>
                  <line x1="5.5" y1="10.5" x2="9" y2="10.5"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="5" r="2.5"/>
                  <path d="M3 14c0-2.76 2.24-5 5-5s5 2.24 5 5"/>
                  <polyline points="10,8.5 11.5,10.5 14,7.5"/>
                </svg>
              );
              const label = item === 'self-reviews' ? 'Self Reviews' : 'Leader Reviews';
              return (
                <div
                  key={item}
                  onClick={() => handleActiveMenuChange(item)}
                  title={sidebarCollapsed ? label : undefined}
                  style={{
                    padding: sidebarCollapsed ? '10px' : '11px 14px',
                    borderRadius: '10px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: '600',
                    color: activeMenu === item ? '#1e3a5f' : '#64748b',
                    transition: 'all 0.2s',
                    boxShadow: !sidebarCollapsed && activeMenu === item ? 'inset 3px 0 0 #7eb8d4' : 'none',
                    background: activeMenu === item ? 'rgba(126, 184, 212, 0.15)' : 'transparent',
                    display: 'flex', alignItems: 'center',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    gap: '10px',
                    whiteSpace: 'nowrap', overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => { if (activeMenu !== item) { e.currentTarget.style.background = 'rgba(30,58,95,0.06)'; e.currentTarget.style.color = '#1e3a5f'; }}}
                  onMouseLeave={(e) => { if (activeMenu !== item) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}}
                >
                  <span style={{flexShrink: 0, display: 'flex', alignItems: 'center'}}>{icon}</span>
                  {!sidebarCollapsed && label}
                </div>
              );
            })}


            {/* Suggestion Box */}
            {(() => {
              const item = 'suggestions';
              const label = 'Suggestion Box';
              return (
                <div
                  key={item}
                  onClick={() => handleActiveMenuChange(item)}
                  title={sidebarCollapsed ? label : undefined}
                  style={{
                    padding: sidebarCollapsed ? '10px' : '11px 14px',
                    borderRadius: '10px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: '600',
                    color: activeMenu === item ? '#1e3a5f' : '#64748b',
                    transition: 'all 0.2s',
                    boxShadow: !sidebarCollapsed && activeMenu === item ? 'inset 3px 0 0 #7eb8d4' : 'none',
                    background: activeMenu === item ? 'rgba(126, 184, 212, 0.15)' : 'transparent',
                    display: 'flex', alignItems: 'center',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    gap: '10px',
                    whiteSpace: 'nowrap', overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => { if (activeMenu !== item) { e.currentTarget.style.background = 'rgba(30,58,95,0.06)'; e.currentTarget.style.color = '#1e3a5f'; }}}
                  onMouseLeave={(e) => { if (activeMenu !== item) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}}
                >
                  <span style={{flexShrink: 0, display: 'flex', alignItems: 'center'}}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4l2 2 2-2h4a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
                    </svg>
                  </span>
                  {!sidebarCollapsed && label}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Divider */}
        <div style={{borderTop: '1.5px dashed #e2e8f0', margin: '4px 0 20px 0'}} />

        {/* TABLE section */}
        <div>
          {!sidebarCollapsed && (
            <div style={{fontSize: '12px', fontWeight: '800', color: '#1e3a5f', letterSpacing: '0.4px', marginBottom: '14px', textTransform: 'uppercase', display:'flex', alignItems:'center', gap:'5px'}}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="1" width="11" height="11" rx="1.5"/>
                <line x1="1" y1="4.5" x2="12" y2="4.5"/>
                <line x1="5" y1="4.5" x2="5" y2="12"/>
              </svg>
              Table View
            </div>
          )}
          <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
            {(['table-by-year', 'table-by-person'] as const).map(item => {
              const icon = item === 'table-by-year' ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="12" height="11" rx="1.5"/>
                  <line x1="2" y1="7" x2="14" y2="7"/>
                  <line x1="5.5" y1="1.5" x2="5.5" y2="4.5"/>
                  <line x1="10.5" y1="1.5" x2="10.5" y2="4.5"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="5.5" r="2.5"/>
                  <path d="M3 14c0-2.76 2.24-5 5-5s5 2.24 5 5"/>
                </svg>
              );
              const label = item === 'table-by-year' ? 'By Year' : 'By Person';
              return (
                <div
                  key={item}
                  onClick={() => handleActiveMenuChange(item)}
                  title={sidebarCollapsed ? label : undefined}
                  style={{
                    padding: sidebarCollapsed ? '10px' : '11px 14px',
                    borderRadius: '10px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: '600',
                    color: activeMenu === item ? '#1e3a5f' : '#64748b',
                    transition: 'all 0.2s',
                    boxShadow: !sidebarCollapsed && activeMenu === item ? 'inset 3px 0 0 #7eb8d4' : 'none',
                    background: activeMenu === item ? 'rgba(126, 184, 212, 0.15)' : 'transparent',
                    display: 'flex', alignItems: 'center',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    gap: '10px',
                    whiteSpace: 'nowrap', overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => { if (activeMenu !== item) { e.currentTarget.style.background = 'rgba(30,58,95,0.06)'; e.currentTarget.style.color = '#1e3a5f'; }}}
                  onMouseLeave={(e) => { if (activeMenu !== item) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}}
                >
                  <span style={{flexShrink: 0, display: 'flex', alignItems: 'center'}}>{icon}</span>
                  {!sidebarCollapsed && label}
                </div>
              );
            })}
          </div>
        </div>

      </div>}

      {/* Main Content */}
      <div style={{padding: '40px', overflowY: 'auto'}}>

        {/* Demo mode banner */}
        {tableDemoMode && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
            border: '1px solid #fbbf24',
            borderRadius: '12px',
            padding: '12px 20px',
            marginBottom: '24px',
            gap: '12px',
          }}>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <span style={{fontSize:'16px'}}>👁</span>
              <div>
                <span style={{fontSize:'13px',fontWeight:'800',color:'#92400e'}}>Demo Preview Mode</span>
                <span style={{fontSize:'12px',color:'#92400e',marginLeft:'8px',opacity:'0.8'}}>— Showing sample data (10 employees × 12 months). No real records.</span>
              </div>
            </div>
            <button onClick={clearDemoData} style={{padding:'6px 14px',background:'#92400e',color:'white',border:'none',borderRadius:'8px',fontWeight:'700',fontSize:'12px',cursor:'pointer',flexShrink:0}}>
              ✕ Exit Demo
            </button>
          </div>
        )}

        <div style={{marginBottom: '32px'}}>
          <h1 style={{fontSize: '32px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px'}}>
            {activeMenu === 'self-reviews'      ? 'Self Review Submissions'
              : activeMenu === 'leader-reviews'    ? 'Leader Review Submissions'
              : activeMenu === 'hr-reviews'        ? 'HR Review Submissions'
              : activeMenu === 'finance-reviews'   ? 'Finance & Admin Review Submissions'
              : activeMenu === 'marketing-reviews' ? 'Marketing Review Submissions'
              : activeMenu === 'suggestions'       ? 'Suggestion Box'
              : activeMenu === 'table-by-year'     ? 'Table View · By Year'
              : activeMenu === 'table-by-person'   ? 'Table View · By Person'
              : 'Status Overview'}
          </h1>
          <p style={{color: '#64748b', fontSize: '14px'}}>
            {activeMenu === 'self-reviews'      ? 'Monitor employee self-review submissions and completion status'
              : activeMenu === 'leader-reviews'    ? 'Monitor leader review submissions and completion status'
              : activeMenu === 'hr-reviews'        ? 'HR department monthly review submissions (Esther)'
              : activeMenu === 'finance-reviews'   ? 'Finance & Admin monthly review submissions (Chelsea)'
              : activeMenu === 'marketing-reviews' ? 'Marketing monthly review submissions (Vincent)'
              : activeMenu === 'suggestions'       ? 'All suggestions submitted by team members'
              : activeMenu === 'table-by-year'     ? 'View all submissions organised by year and month'
              : activeMenu === 'table-by-person'   ? 'View all submissions organised by employee'
              : `Current review period — ${formatPeriodDisplay(getCurrentReviewPeriod())}`}
          </p>
        </div>

        {/* ───── TABLE BY YEAR (Google Sheets style) ───── */}
        {activeMenu === 'table-by-year' && (() => {
          const allRows = [...tableAllSelf, ...tableAllLeader];
          const years = [...new Set(allRows.map(r => r.review_period?.split('-')[0]).filter(Boolean))].sort().reverse();
          const selYear = tableYearSel || years[0] || '';
          const rowsInYear = allRows.filter(r => r.review_period?.startsWith(selYear));
          const months = [...new Set(rowsInYear.map(r => r.review_period?.split('-')[1]).filter(Boolean))].sort();
          // All unique employees across all months of this year (exclude internal-only reviewers)
          const emailSet = new Set(rowsInYear.map(r => r.employee_email));
          const employees = [...emailSet]
            .map(email => {
              const ref = rowsInYear.find(r => r.employee_email === email)!;
              return { email, name: ref.employee_name, dept: ref.department };
            }).sort((a,b) => a.dept.localeCompare(b.dept) || a.name.localeCompare(b.name));
          const monthNames = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          const fullMonthNames = ['','January','February','March','April','May','June','July','August','September','October','November','December'];

          const cellStyle = (row: SubmissionRow | undefined, onClick: ()=>void) => {
            const submitted = row?.status === 'submitted';
            const draft = row?.status === 'draft';
            return (
              <td key={Math.random()} onClick={row ? onClick : undefined}
                style={{border:'1px solid #e2e8f0', padding:'8px 10px', textAlign:'center', width:'80px', cursor: row ? 'pointer' : 'default',
                  background: submitted ? 'rgba(220,252,231,0.6)' : draft ? 'rgba(254,249,195,0.6)' : 'transparent',
                  transition:'background 0.15s'
                }}
                onMouseEnter={(e)=>{ if(row) e.currentTarget.style.opacity='0.7'; }}
                onMouseLeave={(e)=>{ e.currentTarget.style.opacity='1'; }}
              >
                {submitted ? <span style={{color:'#15803d',fontWeight:'700',fontSize:'13px'}}>✓</span>
                  : draft ? <span style={{color:'#92400e',fontWeight:'700',fontSize:'13px'}}>○</span>
                  : <span style={{color:'#cbd5e1',fontSize:'12px'}}>—</span>}
              </td>
            );
          };

          if (!tableDataLoaded) return <div style={{textAlign:'center',padding:'60px',color:'#64748b'}}>Loading...</div>;
          if (years.length === 0) return (
            <div style={{textAlign:'center',padding:'60px'}}>
              <div style={{color:'#94a3b8',fontSize:'14px',marginBottom:'20px'}}>No data yet</div>
              <button onClick={loadDemoData} style={{padding:'10px 24px',background:'linear-gradient(135deg,#7eb8d4,#1e3a5f)',color:'white',border:'none',borderRadius:'10px',fontWeight:'700',fontSize:'13px',cursor:'pointer'}}>
                👁 Preview with Demo Data (10 employees × 3 months)
              </button>
            </div>
          );

          return (
            <div>
              {/* Year dropdown + demo toggle */}
              <div style={{display:'flex',gap:'12px',marginBottom:'20px',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                  <span style={{fontSize:'12px',fontWeight:'700',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px'}}>Year:</span>
                  <select value={selYear} onChange={e=>setTableYearSel(e.target.value)}
                    style={{padding:'8px 14px',border:'1.5px solid #e2e8f0',borderRadius:'8px',fontWeight:'700',fontSize:'13px',cursor:'pointer',background:'white',color:'#1e3a5f',fontFamily:'inherit'}}>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                {tableDemoMode
                  ? <button onClick={clearDemoData} style={{padding:'6px 16px',background:'rgba(239,68,68,0.1)',color:'#dc2626',border:'none',borderRadius:'8px',fontWeight:'700',fontSize:'12px',cursor:'pointer'}}>✕ Exit Demo</button>
                  : <button onClick={loadDemoData} style={{padding:'6px 16px',background:'rgba(126,184,212,0.15)',color:'#1e3a5f',border:'none',borderRadius:'8px',fontWeight:'700',fontSize:'12px',cursor:'pointer'}}>👁 Demo Preview</button>
                }
              </div>

              {/* Spreadsheet */}
              <div style={{background:'white',borderRadius:'12px',boxShadow:'0 4px 24px rgba(0,0,0,0.08)',overflow:'hidden',border:'1px solid #e2e8f0'}}>
                {/* The spreadsheet table */}
                <div style={{overflowX:'auto'}}>
                  <table style={{borderCollapse:'collapse',fontSize:'12px',minWidth:'100%',tableLayout:'auto'}}>
                    {/* Header row 1: frozen columns + month group headers */}
                    <thead>
                      <tr style={{background:'#f8fafc'}}>
                        <th rowSpan={2} style={{border:'1px solid #e2e8f0',padding:'10px 14px',textAlign:'center',fontWeight:'700',color:'#94a3b8',width:'40px',background:'#f1f5f9'}}>#</th>
                        <th rowSpan={2} style={{border:'1px solid #e2e8f0',padding:'10px 16px',textAlign:'left',fontWeight:'700',color:'#334155',minWidth:'140px',background:'#f8fafc',position:'sticky',left:'40px',zIndex:2}}>Employee</th>
                        <th rowSpan={2} style={{border:'1px solid #e2e8f0',padding:'10px 14px',textAlign:'left',fontWeight:'700',color:'#334155',minWidth:'110px',background:'#f8fafc',position:'sticky',left:'180px',zIndex:2}}>Department</th>
                        {months.map(m => (
                          <th key={m} colSpan={2} style={{border:'1px solid #e2e8f0',padding:'8px 10px',textAlign:'center',fontWeight:'700',color:'#1e3a5f',background:'rgba(126,184,212,0.12)',letterSpacing:'0.3px'}}>
                            {fullMonthNames[parseInt(m)]}
                          </th>
                        ))}
                      </tr>
                      {/* Header row 2: Self / Leader sub-columns */}
                      <tr style={{background:'#f8fafc'}}>
                        {months.map(m => (
                          [
                            <th key={`${m}-s`} style={{border:'1px solid #e2e8f0',padding:'6px 8px',textAlign:'center',fontWeight:'600',color:'#3b82f6',fontSize:'11px',background:'rgba(219,234,254,0.3)',width:'72px'}}>📝 Self</th>,
                            <th key={`${m}-l`} style={{border:'1px solid #e2e8f0',padding:'6px 8px',textAlign:'center',fontWeight:'600',color:'#16a34a',fontSize:'11px',background:'rgba(220,252,231,0.3)',width:'72px'}}>👔 Leader</th>
                          ]
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {employees.length === 0 ? (
                        <tr><td colSpan={3 + months.length*2} style={{padding:'40px',textAlign:'center',color:'#94a3b8'}}>No submissions for {selYear}</td></tr>
                      ) : employees.map((emp, i) => (
                        <tr key={emp.email} style={{background: i%2===0?'white':'#fafafa'}}
                          onMouseEnter={(e)=>{e.currentTarget.style.background='rgba(126,184,212,0.06)'}}
                          onMouseLeave={(e)=>{e.currentTarget.style.background=i%2===0?'white':'#fafafa'}}
                        >
                          <td style={{border:'1px solid #e2e8f0',padding:'10px',textAlign:'center',color:'#94a3b8',fontWeight:'600',background:'#f9fafb'}}>{i+1}</td>
                          <td style={{border:'1px solid #e2e8f0',padding:'10px 16px',position:'sticky',left:'40px',background:'inherit',zIndex:1}}>
                            <div style={{fontWeight:'700',color:'#0f172a',fontSize:'13px'}}>{emp.name}</div>
                            <div style={{fontSize:'10px',color:'#94a3b8',marginTop:'1px'}}>{emp.email}</div>
                          </td>
                          <td style={{border:'1px solid #e2e8f0',padding:'10px 14px',color:'#475569',position:'sticky',left:'180px',background:'inherit',zIndex:1,fontSize:'12px'}}>{emp.dept}</td>
                          {months.map(m => {
                            const period = `${selYear}-${m}`;
                            const selfRow = tableAllSelf.find(r => r.employee_email===emp.email && r.review_period===period);
                            const leaderRow = tableAllLeader.find(r => r.employee_email===emp.email && r.review_period===period);
                            return [
                              cellStyle(selfRow, ()=>{ setTableDetailRow(selfRow!); window.parent.postMessage({type:'scrollToTop'}, '*'); }),
                              cellStyle(leaderRow, ()=>{ setTableDetailRow(leaderRow!); window.parent.postMessage({type:'scrollToTop'}, '*'); })
                            ];
                          })}
                        </tr>
                      ))}
                    </tbody>
                    {/* Legend footer */}
                    <tfoot>
                      <tr>
                        <td colSpan={3 + months.length*2} style={{padding:'10px 16px',background:'#f8fafc',borderTop:'2px solid #e2e8f0'}}>
                          <div style={{display:'flex',gap:'20px',fontSize:'11px',color:'#64748b',alignItems:'center'}}>
                            <span style={{fontWeight:'700',color:'#334155'}}>Legend:</span>
                            <span><span style={{color:'#15803d',fontWeight:'800'}}>✓</span> Submitted</span>
                            <span><span style={{color:'#92400e',fontWeight:'800'}}>○</span> Draft</span>
                            <span><span style={{color:'#cbd5e1'}}>—</span> Not submitted</span>
                            <span style={{marginLeft:'8px',fontStyle:'italic'}}>Click a cell to view details</span>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ───── TABLE BY PERSON (Google Sheets style) ───── */}
        {activeMenu === 'table-by-person' && (() => {
          const personMap = new Map<string, {name:string;email:string;dept:string;isLeader:boolean}>();
          tableAllSelf.forEach(r => { if (!personMap.has(r.employee_email)) personMap.set(r.employee_email, {name:r.employee_name,email:r.employee_email,dept:r.department,isLeader:false}); });
          tableAllLeader.forEach(r => { if (!personMap.has(r.employee_email)) personMap.set(r.employee_email, {name:r.employee_name,email:r.employee_email,dept:r.department,isLeader:true}); else personMap.get(r.employee_email)!.isLeader = true; });
          const people = [...personMap.values()].sort((a,b) => (b.isLeader?1:0)-(a.isLeader?1:0) || a.dept.localeCompare(b.dept) || a.name.localeCompare(b.name));
          const selEmail = tablePersonSel || people[0]?.email || '';
          const person = personMap.get(selEmail);
          const personSelf = tableAllSelf.filter(r => r.employee_email===selEmail).sort((a,b)=>(b.review_period||'').localeCompare(a.review_period||''));
          const personLeader = tableAllLeader.filter(r => r.employee_email===selEmail).sort((a,b)=>(b.review_period||'').localeCompare(a.review_period||''));
          // All unique years across all data
          const allYears = [...new Set([...tableAllSelf, ...tableAllLeader].map(r=>r.review_period?.split('-')[0]).filter(Boolean))].sort().reverse();
          const selPersonYear = tableYearSel || allYears[0] || '';
          // All unique periods for this person, filtered by year
          const allPeriods = [...new Set([...personSelf, ...personLeader].map(r=>r.review_period))].sort().reverse();
          const periods = selPersonYear ? allPeriods.filter(p => p.startsWith(selPersonYear)) : allPeriods;

          const statusCell = (row: SubmissionRow | undefined) => row
            ? <td style={{border:'1px solid #e2e8f0',padding:'10px 14px',textAlign:'center',background:row.status==='submitted'?'rgba(220,252,231,0.5)':'rgba(254,249,195,0.5)',cursor:'pointer'}}
                onClick={()=>{ setTableDetailRow(row); window.parent.postMessage({type:'scrollToTop'}, '*'); }}
                onMouseEnter={(e)=>{e.currentTarget.style.opacity='0.75'}} onMouseLeave={(e)=>{e.currentTarget.style.opacity='1'}}
              >
                <span style={{fontWeight:'700',fontSize:'12px',color:row.status==='submitted'?'#15803d':'#92400e'}}>{row.status==='submitted'?'✓ Submitted':'○ Draft'}</span>
                <div style={{fontSize:'10px',color:'#94a3b8',marginTop:'2px'}}>{row.submitted_at ? new Date(row.submitted_at).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'}</div>
              </td>
            : <td style={{border:'1px solid #e2e8f0',padding:'10px 14px',textAlign:'center',background:'transparent'}}>
                <span style={{color:'#e2e8f0',fontSize:'14px'}}>—</span>
              </td>;

          if (!tableDataLoaded) return <div style={{textAlign:'center',padding:'60px',color:'#64748b'}}>Loading...</div>;
          if (people.length === 0) return (
            <div style={{textAlign:'center',padding:'60px'}}>
              <div style={{color:'#94a3b8',fontSize:'14px',marginBottom:'20px'}}>No data yet</div>
              <button onClick={loadDemoData} style={{padding:'10px 24px',background:'linear-gradient(135deg,#7eb8d4,#1e3a5f)',color:'white',border:'none',borderRadius:'10px',fontWeight:'700',fontSize:'13px',cursor:'pointer'}}>
                👁 Preview with Demo Data (10 employees × 3 months)
              </button>
            </div>
          );

          return (
            <div>
              {/* Person + Year dropdowns + Demo toggle */}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',gap:'12px',flexWrap:'wrap'}}>
                <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
                  <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                    <span style={{fontSize:'12px',fontWeight:'700',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px'}}>Employee:</span>
                    <select value={selEmail} onChange={e=>setTablePersonSel(e.target.value)}
                      style={{padding:'8px 14px',border:'1.5px solid #e2e8f0',borderRadius:'8px',fontWeight:'700',fontSize:'13px',cursor:'pointer',background:'white',color:'#1e3a5f',fontFamily:'inherit',minWidth:'160px'}}>
                      {people.map(p => <option key={p.email} value={p.email}>{p.isLeader?'👔':'👤'} {p.name} ({p.dept})</option>)}
                    </select>
                  </div>
                  <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                    <span style={{fontSize:'12px',fontWeight:'700',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px'}}>Year:</span>
                    <select value={selPersonYear} onChange={e=>setTableYearSel(e.target.value)}
                      style={{padding:'8px 14px',border:'1.5px solid #e2e8f0',borderRadius:'8px',fontWeight:'700',fontSize:'13px',cursor:'pointer',background:'white',color:'#1e3a5f',fontFamily:'inherit'}}>
                      {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                {tableDemoMode
                  ? <button onClick={clearDemoData} style={{padding:'6px 16px',background:'rgba(239,68,68,0.1)',color:'#dc2626',border:'none',borderRadius:'8px',fontWeight:'700',fontSize:'12px',cursor:'pointer'}}>✕ Exit Demo</button>
                  : <button onClick={loadDemoData} style={{padding:'6px 16px',background:'rgba(126,184,212,0.15)',color:'#1e3a5f',border:'none',borderRadius:'8px',fontWeight:'700',fontSize:'12px',cursor:'pointer'}}>👁 Demo Preview</button>
                }
              </div>
              {/* Spreadsheet card */}
              <div style={{background:'white',borderRadius:'12px',boxShadow:'0 4px 24px rgba(0,0,0,0.08)',overflow:'hidden',border:'1px solid #e2e8f0'}}>
                {/* Person info bar */}
                {person && (
                  <div style={{padding:'12px 20px',background:'white',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',gap:'16px'}}>
                    <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'linear-gradient(135deg,#1e3a5f,#162d4a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:'800',color:'white',flexShrink:0}}>
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontWeight:'800',fontSize:'14px',color:'#0f172a'}}>{person.name}</div>
                      <div style={{fontSize:'11px',color:'#94a3b8'}}>{person.dept} · {person.email}</div>
                    </div>
                    <div style={{marginLeft:'auto',display:'flex',gap:'24px'}}>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontWeight:'800',fontSize:'18px',color:'#1e3a5f'}}>{personSelf.filter(r=>r.status==='submitted').length}/{personSelf.length}</div>
                        <div style={{fontSize:'10px',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.4px'}}>Self Submitted</div>
                      </div>
                      {person.isLeader && (
                        <div style={{textAlign:'center'}}>
                          <div style={{fontWeight:'800',fontSize:'18px',color:'#1e3a5f'}}>{personLeader.filter(r=>r.status==='submitted').length}/{personLeader.length}</div>
                          <div style={{fontSize:'10px',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.4px'}}>Leader Submitted</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Spreadsheet */}
                <div style={{overflowX:'auto'}}>
                  <table style={{borderCollapse:'collapse',fontSize:'12px',width:'100%'}}>
                    <thead>
                      <tr style={{background:'#f8fafc'}}>
                        <th style={{border:'1px solid #e2e8f0',padding:'10px 10px',textAlign:'center',fontWeight:'700',color:'#94a3b8',width:'40px',background:'#f1f5f9'}}>#</th>
                        <th style={{border:'1px solid #e2e8f0',padding:'10px 16px',textAlign:'left',fontWeight:'700',color:'#334155',minWidth:'110px'}}>Period</th>
                        <th style={{border:'1px solid #e2e8f0',padding:'10px 16px',textAlign:'center',fontWeight:'700',color:'#3b82f6',minWidth:'200px',background:'rgba(219,234,254,0.2)'}}>📝 Self Review</th>
                        {person?.isLeader && <th style={{border:'1px solid #e2e8f0',padding:'10px 16px',textAlign:'center',fontWeight:'700',color:'#16a34a',minWidth:'200px',background:'rgba(220,252,231,0.2)'}}>👔 Leader Review</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {periods.length === 0 ? (
                        <tr><td colSpan={person?.isLeader?4:3} style={{padding:'40px',textAlign:'center',color:'#94a3b8'}}>No submissions yet</td></tr>
                      ) : periods.map((period, i) => {
                        const selfRow = personSelf.find(r=>r.review_period===period);
                        const leaderRow = personLeader.find(r=>r.review_period===period);
                        return (
                          <tr key={period} style={{background: i%2===0?'white':'#fafafa'}}
                            onMouseEnter={(e)=>{e.currentTarget.style.background='rgba(126,184,212,0.05)'}}
                            onMouseLeave={(e)=>{e.currentTarget.style.background=i%2===0?'white':'#fafafa'}}
                          >
                            <td style={{border:'1px solid #e2e8f0',padding:'10px',textAlign:'center',color:'#94a3b8',fontWeight:'600',background:'#f9fafb'}}>{i+1}</td>
                            <td style={{border:'1px solid #e2e8f0',padding:'10px 16px',fontWeight:'700',color:'#1e3a5f',fontSize:'13px'}}>{period}</td>
                            {statusCell(selfRow)}
                            {person?.isLeader && statusCell(leaderRow)}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={person?.isLeader?4:3} style={{padding:'10px 16px',background:'#f8fafc',borderTop:'2px solid #e2e8f0'}}>
                          <div style={{display:'flex',gap:'20px',fontSize:'11px',color:'#64748b',alignItems:'center'}}>
                            <span style={{fontWeight:'700',color:'#334155'}}>Legend:</span>
                            <span><span style={{color:'#15803d',fontWeight:'800'}}>✓ Submitted</span></span>
                            <span><span style={{color:'#92400e',fontWeight:'800'}}>○ Draft</span></span>
                            <span style={{fontStyle:'italic'}}>Click a cell to view details</span>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ───── STATUS OVERVIEW ───── */}
        {activeMenu === 'status-overview' && (() => {
          const period = getCurrentReviewPeriod();
          const selfMap  = new Map(overviewSelf.map(r  => [r.employee_email, r]));
          const leaderMap = new Map(overviewLeader.map(r => [r.employee_email, r]));

          // Group users by department
          const byDept = new Map<string, typeof ALL_REVIEWABLE_USERS>();
          for (const u of ALL_REVIEWABLE_USERS) {
            const d = u.department || 'Other';
            if (!byDept.has(d)) byDept.set(d, []);
            byDept.get(d)!.push(u);
          }

          const statusBadge = (row: SubmissionRow | undefined, type: 'self'|'leader') => {
            if (!row) return (
              <span style={{padding:'3px 10px',borderRadius:'12px',fontSize:'11px',fontWeight:'700',background:'#f1f5f9',color:'#94a3b8'}}>— Pending</span>
            );
            if (row.status === 'submitted') return (
              <span style={{padding:'3px 10px',borderRadius:'12px',fontSize:'11px',fontWeight:'700',background:'#dcfce7',color:'#15803d'}}>✓ Submitted</span>
            );
            return (
              <span style={{padding:'3px 10px',borderRadius:'12px',fontSize:'11px',fontWeight:'700',background:'#fef3c7',color:'#92400e'}}>○ Draft</span>
            );
          };

          const submittedCount = ALL_REVIEWABLE_USERS.filter(u => selfMap.get(u.email)?.status === 'submitted').length;
          const draftCount     = ALL_REVIEWABLE_USERS.filter(u => selfMap.get(u.email)?.status === 'draft').length;
          const pendingCount   = ALL_REVIEWABLE_USERS.length - submittedCount - draftCount;

          if (!overviewLoaded) return <div style={{textAlign:'center',padding:'60px',color:'#64748b'}}>Loading…</div>;

          return (
            <div>
              {/* Summary cards */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginBottom:'24px'}}>
                {[
                  { label:'Submitted', count:submittedCount, bg:'#dcfce7', color:'#15803d', border:'#bbf7d0' },
                  { label:'Draft',     count:draftCount,     bg:'#fef3c7', color:'#92400e', border:'#fde68a' },
                  { label:'Pending',   count:pendingCount,   bg:'#f1f5f9', color:'#64748b', border:'#e2e8f0' },
                ].map(c => (
                  <div key={c.label} style={{background:c.bg,border:`1.5px solid ${c.border}`,borderRadius:'12px',padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{fontSize:'13px',fontWeight:'700',color:c.color}}>{c.label}</div>
                    <div style={{fontSize:'24px',fontWeight:'800',color:c.color}}>{c.count}</div>
                  </div>
                ))}
              </div>

              <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'16px'}}>
                <button onClick={()=>{setOverviewLoaded(false);fetchOverviewData();}}
                  style={{padding:'8px 16px',border:'none',borderRadius:'10px',fontSize:'13px',fontWeight:'700',cursor:'pointer',background:'linear-gradient(135deg,#1e3a5f,#162d4a)',color:'white'}}>
                  🔄 Refresh
                </button>
              </div>

              {/* Per-department tables */}
              {[...byDept.entries()].map(([dept, users]) => (
                <div key={dept} style={{marginBottom:'24px',background:'rgba(255,255,255,0.95)',border:'1.5px solid #e2e8f0',borderRadius:'14px',overflow:'hidden',boxShadow:'0 4px 12px rgba(0,0,0,0.04)'}}>
                  <div style={{padding:'12px 20px',background:'linear-gradient(135deg,#f8fafc,#f1f5f9)',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{fontWeight:'800',fontSize:'14px',color:'#1e3a5f'}}>{dept}</span>
                    <span style={{fontSize:'11px',color:'#94a3b8',fontWeight:'600'}}>{users.length} member{users.length!==1?'s':''}</span>
                  </div>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px',tableLayout:'fixed'}}>
                    <colgroup>
                      <col style={{width:'38%'}} />
                      <col style={{width:'14%'}} />
                      <col style={{width:'24%'}} />
                      <col style={{width:'24%'}} />
                    </colgroup>
                    <thead>
                      <tr style={{background:'#fafafa',borderBottom:'1px solid #e2e8f0'}}>
                        <th style={{padding:'10px 16px',textAlign:'left',fontWeight:'700',color:'#334155',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.4px'}}>Name</th>
                        <th style={{padding:'10px 16px',textAlign:'left',fontWeight:'700',color:'#334155',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.4px'}}>Role</th>
                        <th style={{padding:'10px 16px',textAlign:'center',fontWeight:'700',color:'#3b82f6',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.4px'}}>Self Review</th>
                        <th style={{padding:'10px 16px',textAlign:'center',fontWeight:'700',color:'#16a34a',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.4px'}}>Leader Review</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, i) => {
                        const selfRow   = selfMap.get(u.email);
                        const leaderRow = leaderMap.get(u.email);
                        return (
                          <tr key={u.email} style={{borderBottom: i < users.length-1 ? '1px solid #f1f5f9' : 'none', transition:'background 0.15s'}}
                            onMouseEnter={(e)=>{e.currentTarget.style.background='rgba(126,184,212,0.05)'}}
                            onMouseLeave={(e)=>{e.currentTarget.style.background='transparent'}}
                          >
                            <td style={{padding:'12px 16px'}}>
                              <div style={{fontWeight:'700',color:'#0f172a'}}>{u.name}</div>
                              <div style={{fontSize:'11px',color:'#94a3b8',marginTop:'1px'}}>{u.email}</div>
                            </td>
                            <td style={{padding:'12px 16px'}}>
                              <span style={{padding:'2px 8px',borderRadius:'6px',fontSize:'11px',fontWeight:'700',
                                background: u.role==='leader' ? 'rgba(16,185,129,0.1)' : '#f1f5f9',
                                color: u.role==='leader' ? '#065f46' : '#64748b'}}>
                                {u.role === 'leader' ? 'Leader' : 'Employee'}
                              </span>
                            </td>
                            <td style={{padding:'12px 16px',textAlign:'center'}}>
                              {statusBadge(selfRow, 'self')}
                              {selfRow?.submitted_at && (
                                <div style={{fontSize:'10px',color:'#94a3b8',marginTop:'3px'}}>{new Date(selfRow.submitted_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</div>
                              )}
                            </td>
                            <td style={{padding:'12px 16px',textAlign:'center'}}>
                              {u.role === 'leader' ? (
                                <>
                                  {statusBadge(leaderRow, 'leader')}
                                  {leaderRow?.submitted_at && (
                                    <div style={{fontSize:'10px',color:'#94a3b8',marginTop:'3px'}}>{new Date(leaderRow.submitted_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</div>
                                  )}
                                </>
                              ) : (
                                <span style={{fontSize:'11px',color:'#e2e8f0',fontStyle:'italic'}}>N/A</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Suggestion Box View */}
        {activeMenu === 'suggestions' && (
          <div>
            <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '10px'}}>
              <button onClick={() => fetchSuggestions(currentPage)} style={{padding: '10px 16px', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', background: 'linear-gradient(135deg, #1e3a5f, #162d4a)', color: 'white'}}>🔄 Refresh</button>
              <button onClick={handleExportAll} style={{padding: '10px 16px', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white'}}>⬇ Export All</button>
            </div>
            <div style={{background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.8)'}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead style={{background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderBottom: '2px solid #e2e8f0'}}>
                  <tr>
                    <th style={{padding: '16px 18px', textAlign: 'left', fontWeight: '700', fontSize: '12px', color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase'}}>Submitted</th>
                    <th style={{padding: '16px 18px', textAlign: 'left', fontWeight: '700', fontSize: '12px', color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase'}}>Name</th>
                    <th style={{padding: '16px 18px', textAlign: 'left', fontWeight: '700', fontSize: '12px', color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase'}}>Department</th>
                    <th style={{padding: '16px 18px', textAlign: 'left', fontWeight: '700', fontSize: '12px', color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase'}}>Suggestion Preview</th>
                    <th style={{padding: '16px 18px', textAlign: 'left', fontWeight: '700', fontSize: '12px', color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase'}}>Files</th>
                    <th style={{padding: '16px 18px', textAlign: 'left', fontWeight: '700', fontSize: '12px', color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase'}}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.length > 0 ? suggestions.map((row, idx) => (
                    <tr key={row.id} style={{borderBottom: idx < suggestions.length - 1 ? '1px solid #e2e8f0' : 'none', transition: 'all 0.3s'}}
                      onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(126,184,212,0.06)'}}
                      onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent'}}
                    >
                      <td style={{padding: '16px 18px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap'}}>
                        {row.submitted_at ? new Date(row.submitted_at).toLocaleString() : '-'}
                      </td>
                      <td style={{padding: '16px 18px', fontSize: '13px', color: '#475569'}}>
                        <div style={{fontWeight: '700', color: '#0f172a'}}>{row.user_name}</div>
                        <div style={{fontSize: '11px', color: '#94a3b8'}}>{row.user_email}</div>
                      </td>
                      <td style={{padding: '16px 18px', fontSize: '13px', color: '#475569'}}>{row.department}</td>
                      <td style={{padding: '16px 18px', fontSize: '13px', color: '#475569', maxWidth: '260px'}}>
                        <span style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
                          {row.suggestion}
                        </span>
                      </td>
                      <td style={{padding: '16px 18px', fontSize: '13px', color: '#475569'}}>
                        {row.files?.length > 0 ? (
                          <span style={{background: 'rgba(126,184,212,0.15)', color: '#1e3a5f', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700'}}>
                            📁 {row.files.length}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={{padding: '16px 18px'}}>
                        <div style={{display: 'flex', gap: '8px'}}>
                          <button onClick={() => { setSelectedSuggestion(row); window.parent.postMessage({type:'scrollToTop'}, '*'); }} style={{padding: '6px 12px', border: 'none', borderRadius: '8px', background: 'rgba(126,184,212,0.15)', color: '#1e3a5f', cursor: 'pointer', fontSize: '12px', fontWeight: '600'}}
                            onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(126,184,212,0.3)'}}
                            onMouseLeave={(e) => {e.currentTarget.style.background = 'rgba(126,184,212,0.15)'}}
                          >View</button>
                          <button onClick={() => handleDeleteSuggestion(row)} style={{padding: '6px 12px', border: 'none', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#dc2626', cursor: 'pointer', fontSize: '12px', fontWeight: '600'}}
                            onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}}
                            onMouseLeave={(e) => {e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}}
                          >Delete</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} style={{padding: '40px 18px', textAlign: 'center', color: '#64748b', fontSize: '14px'}}>No suggestions yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Toolbar + Table + Pagination (reviews only) */}
        {['self-reviews','leader-reviews','hr-reviews','finance-reviews','marketing-reviews'].includes(activeMenu) && <>
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{flex: 1, minWidth: '280px', position: 'relative'}}>
            <input
              type="text"
              placeholder="Search name, email, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 36px',
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '13px',
                background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                fontFamily: 'inherit'
              }}
            />
            <div style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px'}}>🔍</div>
          </div>

          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            style={{
              padding: '10px 14px',
              border: '1.5px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '13px',
              background: 'white',
              fontFamily: 'inherit',
              cursor: 'pointer'
            }}
          >
            <option value="">All Departments</option>
            <option value="Corporate Secretarial">Corporate Secretarial</option>
            <option value="Accounting">Accounting</option>
            <option value="Tax">Tax</option>
            <option value="Internal-HR">Internal-HR</option>
            <option value="Internal-Finance">Internal-Finance</option>
            <option value="Internal-Marketing">Internal-Marketing</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '10px 14px',
              border: '1.5px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '13px',
              background: 'white',
              fontFamily: 'inherit',
              cursor: 'pointer'
            }}
          >
            <option value="">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="draft">Draft</option>
          </select>

          <select
            value={filterYear}
            onChange={(e) => { setFilterYear(e.target.value); setFilterMonth(''); }}
            style={{
              padding: '10px 14px',
              border: '1.5px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '13px',
              background: 'white',
              fontFamily: 'inherit',
              cursor: 'pointer'
            }}
          >
            <option value="">All Years</option>
            {[2026, 2027, 2028, 2029, 2030].map(y => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>

          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            disabled={!filterYear}
            style={{
              padding: '10px 14px',
              border: '1.5px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '13px',
              background: filterYear ? 'white' : '#f8fafc',
              fontFamily: 'inherit',
              cursor: filterYear ? 'pointer' : 'not-allowed',
              opacity: filterYear ? 1 : 0.5
            }}
          >
            <option value="">All Months</option>
            {[
              ['01','January'],['02','February'],['03','March'],['04','April'],
              ['05','May'],['06','June'],['07','July'],['08','August'],
              ['09','September'],['10','October'],['11','November'],['12','December']
            ].map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <button onClick={() => { fetchAllReviews(currentPage); fetchSuggestions(currentPage); }} style={{
            padding: '10px 16px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #1e3a5f, #162d4a)',
            color: 'white',
            whiteSpace: 'nowrap'
          }}>
            🔄 Refresh
          </button>

          {tableDemoMode
            ? <button onClick={clearDemoData} style={{padding:'10px 16px',border:'none',borderRadius:'10px',fontSize:'13px',fontWeight:'700',cursor:'pointer',background:'rgba(239,68,68,0.1)',color:'#dc2626',whiteSpace:'nowrap'}}>✕ Exit Demo</button>
            : <button onClick={loadDemoData} style={{padding:'10px 16px',border:'1.5px dashed #7eb8d4',borderRadius:'10px',fontSize:'13px',fontWeight:'700',cursor:'pointer',background:'rgba(126,184,212,0.08)',color:'#1e3a5f',whiteSpace:'nowrap'}}>👁 Demo Preview</button>
          }

          <button onClick={handleExportAll} style={{
            padding: '10px 16px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            color: 'white',
            whiteSpace: 'nowrap'
          }}>
            ⬇ Export All
          </button>
        </div>

        {/* Data Table */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.8)'
        }}>
          <table style={{width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed'}}>
            <colgroup>
              <col style={{width: '13%'}} />
              <col style={{width: '13%'}} />
              <col style={{width: '9%'}} />
              <col style={{width: '17%'}} />
              <col style={{width: '7%'}} />
              <col style={{width: '10%'}} />
              <col style={{width: '18%'}} />
              <col style={{width: '13%'}} />
            </colgroup>
            <thead style={{background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderBottom: '2px solid #e2e8f0'}}>
              <tr>
                <th style={{padding: '12px 14px', textAlign: 'left', fontWeight: '700', fontSize: '10px', color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase'}}>Submitted</th>
                <th style={{padding: '12px 14px', textAlign: 'left', fontWeight: '700', fontSize: '10px', color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase'}}>Department</th>
                <th style={{padding: '12px 14px', textAlign: 'left', fontWeight: '700', fontSize: '10px', color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase'}}>Name</th>
                <th style={{padding: '12px 14px', textAlign: 'left', fontWeight: '700', fontSize: '10px', color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase'}}>Email</th>
                <th style={{padding: '12px 14px', textAlign: 'left', fontWeight: '700', fontSize: '10px', color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase'}}>Period</th>
                <th style={{padding: '12px 14px', textAlign: 'left', fontWeight: '700', fontSize: '10px', color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase'}}>Status</th>
                <th style={{padding: '12px 14px', textAlign: 'left', fontWeight: '700', fontSize: '10px', color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase'}}>Director Comment</th>
                <th style={{padding: '12px 14px', textAlign: 'left', fontWeight: '700', fontSize: '10px', color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? filteredData.map((row, idx) => {
                const statusColor = getStatusColor(row.status === 'submitted' ? 'Completed' : 'Draft');
                const submittedDate = row.submitted_at ? new Date(row.submitted_at).toLocaleString() : '-';
                const canEditComment = user && (DIRECTOR_EMAILS.includes(user.email) || user.email === 'vincent@tassure.com');
                const isEditingThis = editingComment?.id === row.id;
                return (
                  <tr
                    key={row.id}
                    style={{borderBottom: idx < filteredData.length - 1 ? '1px solid #e2e8f0' : 'none', transition: 'all 0.3s'}}
                    onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(126, 184, 212, 0.06)'}}
                    onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent'}}
                  >
                    <td style={{padding: '11px 14px', fontSize: '11px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{submittedDate}</td>
                    <td style={{padding: '11px 14px', fontSize: '11px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{row.department}</td>
                    <td style={{padding: '11px 14px', fontSize: '11px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{row.employee_name}</td>
                    <td style={{padding: '11px 14px', fontSize: '11px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{row.employee_email}</td>
                    <td style={{padding: '11px 14px', fontSize: '11px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{row.review_period}</td>
                    <td style={{padding: '11px 14px', fontSize: '11px'}}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: statusColor.bg,
                        color: statusColor.color
                      }}>
                        {row.status === 'submitted' ? '✓ Submitted' : '⏱ Draft'}
                      </span>
                    </td>
                    <td style={{padding: '11px 14px', fontSize: '11px', minWidth: '200px', maxWidth: '300px'}}>
                      {isEditingThis ? (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                          <textarea
                            value={editingComment.value}
                            onChange={(e) => setEditingComment({id: row.id, value: e.target.value})}
                            rows={3}
                            style={{
                              width: '100%', padding: '8px', fontSize: '13px',
                              border: '1px solid #7eb8d4', borderRadius: '6px',
                              resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                              color: '#1e3a5f', background: '#f0f7fb'
                            }}
                            autoFocus
                          />
                          <div style={{display: 'flex', gap: '6px'}}>
                            <button
                              onClick={() => handleSaveComment(row, editingComment.value)}
                              style={{padding: '4px 10px', border: 'none', borderRadius: '6px', background: '#1e3a5f', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600'}}
                            >Save</button>
                            <button
                              onClick={() => setEditingComment(null)}
                              style={{padding: '4px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: '12px'}}
                            >Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px'}}>
                          <span style={{
                            color: row.director_comment ? '#1e3a5f' : '#94a3b8',
                            fontSize: '12px',
                            lineHeight: '1.5',
                            flex: 1,
                            wordBreak: 'break-word'
                          }}>
                            {row.director_comment || '—'}
                          </span>
                          {canEditComment && (
                            <button
                              onClick={() => setEditingComment({id: row.id, value: row.director_comment || ''})}
                              title="Edit comment"
                              style={{
                                flexShrink: 0, padding: '3px 7px', border: '1px solid #e2e8f0',
                                borderRadius: '6px', background: 'rgba(126,184,212,0.12)',
                                color: '#7eb8d4', cursor: 'pointer', fontSize: '12px', lineHeight: 1
                              }}
                            >✎</button>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{padding: '11px 14px'}}>
                      <div style={{display: 'flex', gap: '8px'}}>
                        <button onClick={() => { setSelectedDetail(row); window.parent.postMessage({type:'scrollToTop'}, '*'); }} style={{
                          padding: '5px 10px',
                          border: 'none',
                          borderRadius: '8px',
                          background: 'rgba(126, 184, 212, 0.15)',
                          color: '#1e3a5f',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: '600',
                          transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(126, 184, 212, 0.3)'}}
                        onMouseLeave={(e) => {e.currentTarget.style.background = 'rgba(126, 184, 212, 0.15)'}}
                        >
                          View Details
                        </button>
                        <button onClick={() => handleDelete(row)} style={{
                          padding: '5px 10px',
                          border: 'none',
                          borderRadius: '8px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#dc2626',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: '600',
                          transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}}
                        onMouseLeave={(e) => {e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} style={{padding: '40px 18px', textAlign: 'center', color: '#64748b', fontSize: '14px'}}>
                    No submissions yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(() => {
          const totalCount =
            activeMenu === 'self-reviews'   ? totalSelfReviews :
            activeMenu === 'leader-reviews' ? totalLeaderReviews : 0;
          const totalPages = Math.ceil(totalCount / pageSize);
          const hasPrev = currentPage > 0;
          const hasNext = currentPage < totalPages - 1;

          return (
            <div style={{display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0'}}>
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={!hasPrev}
                style={{
                  padding: '8px 12px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '8px',
                  background: 'white',
                  color: hasPrev ? '#64748b' : '#cbd5e1',
                  fontWeight: '600',
                  fontSize: '12px',
                  cursor: hasPrev ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s',
                  opacity: hasPrev ? 1 : 0.5
                }}
                onMouseEnter={(e) => {
                  if (hasPrev) {
                    e.currentTarget.style.borderColor = '#7eb8d4';
                    e.currentTarget.style.color = '#1e3a5f';
                  }
                }}
                onMouseLeave={(e) => {
                  if (hasPrev) {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.color = '#64748b';
                  }
                }}
              >
                ← Previous
              </button>

              <span style={{fontSize: '12px', color: '#64748b', fontWeight: '600', minWidth: '60px', textAlign: 'center'}}>
                Page {currentPage + 1} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={!hasNext}
                style={{
                  padding: '8px 12px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '8px',
                  background: 'white',
                  color: hasNext ? '#64748b' : '#cbd5e1',
                  fontWeight: '600',
                  fontSize: '12px',
                  cursor: hasNext ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s',
                  opacity: hasNext ? 1 : 0.5
                }}
                onMouseEnter={(e) => {
                  if (hasNext) {
                    e.currentTarget.style.borderColor = '#7eb8d4';
                    e.currentTarget.style.color = '#1e3a5f';
                  }
                }}
                onMouseLeave={(e) => {
                  if (hasNext) {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.color = '#64748b';
                  }
                }}
              >
                Next →
              </button>
            </div>
          );
        })()}
        </>}
      </div>

{/* Detail Modal */}
      {selectedDetail && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '40px 20px 20px',
          overflowY: 'auto'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '700px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
              <h2 style={{fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0}}>
                {selectedDetail.employee_name}
              </h2>
              <button onClick={() => setSelectedDetail(null)} style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#64748b'
              }}>
                ✕
              </button>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px'}}>
              <div>
                <label style={{fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase'}}>Email</label>
                <p style={{fontSize: '14px', color: '#0f172a', margin: '8px 0 0 0'}}>{selectedDetail.employee_email}</p>
              </div>
              <div>
                <label style={{fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase'}}>Department</label>
                <p style={{fontSize: '14px', color: '#0f172a', margin: '8px 0 0 0'}}>{selectedDetail.department}</p>
              </div>
              <div>
                <label style={{fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase'}}>Period</label>
                <p style={{fontSize: '14px', color: '#0f172a', margin: '8px 0 0 0'}}>{selectedDetail.review_period}</p>
              </div>
              <div>
                <label style={{fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase'}}>Status</label>
                <p style={{fontSize: '14px', color: '#0f172a', margin: '8px 0 0 0'}}>
                  {selectedDetail.status === 'submitted' ? '✓ Submitted' : '⏱ Draft'}
                </p>
              </div>
            </div>

            <div style={{borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '20px'}}>
              <h3 style={{fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px'}}>Review Details</h3>
              {selectedDetail.form_data ? (
                ['hr-reviews','finance-reviews','marketing-reviews'].includes(activeMenu)
                  ? renderDeptFormData(selectedDetail.form_data)
                  : renderFormData(selectedDetail.form_data, activeMenu)
              ) : <p style={{fontSize: '14px', color: '#64748b'}}>No data available</p>}
            </div>

            <div style={{display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0'}}>
              <button onClick={() => setSelectedDetail(null)} style={{
                flex: 1,
                padding: '12px 20px',
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px',
                background: 'white',
                color: '#64748b',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Detail Modal */}
      {tableDetailRow && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-start',justifyContent:'center',zIndex:1000,padding:'40px 20px 20px',overflowY:'auto'}}>
          <div style={{background:'white',borderRadius:'16px',padding:'40px',maxWidth:'700px',width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
              <h2 style={{fontSize:'22px',fontWeight:'800',color:'#0f172a',margin:0}}>{tableDetailRow.employee_name}</h2>
              <button onClick={()=>setTableDetailRow(null)} style={{background:'none',border:'none',fontSize:'24px',cursor:'pointer',color:'#64748b'}}>✕</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'14px',marginBottom:'20px'}}>
              <div><label style={{fontSize:'11px',fontWeight:'700',color:'#64748b',textTransform:'uppercase'}}>Email</label><p style={{fontSize:'14px',color:'#0f172a',margin:'6px 0 0'}}>{tableDetailRow.employee_email}</p></div>
              <div><label style={{fontSize:'11px',fontWeight:'700',color:'#64748b',textTransform:'uppercase'}}>Department</label><p style={{fontSize:'14px',color:'#0f172a',margin:'6px 0 0'}}>{tableDetailRow.department}</p></div>
              <div><label style={{fontSize:'11px',fontWeight:'700',color:'#64748b',textTransform:'uppercase'}}>Period</label><p style={{fontSize:'14px',color:'#0f172a',margin:'6px 0 0'}}>{tableDetailRow.review_period}</p></div>
              <div><label style={{fontSize:'11px',fontWeight:'700',color:'#64748b',textTransform:'uppercase'}}>Status</label><p style={{fontSize:'14px',color:'#0f172a',margin:'6px 0 0'}}>{tableDetailRow.status==='submitted'?'✓ Submitted':'⏱ Draft'}</p></div>
            </div>
            <div style={{borderTop:'1px solid #e2e8f0',paddingTop:'20px',marginTop:'4px'}}>
              <h3 style={{fontSize:'15px',fontWeight:'700',color:'#0f172a',marginBottom:'14px'}}>Review Details</h3>
              {tableDetailRow.form_data
                ? renderFormData(tableDetailRow.form_data, tableAllLeader.some(r=>r.id===tableDetailRow.id)?'leader-reviews':'self-reviews')
                : <p style={{fontSize:'14px',color:'#64748b'}}>No data</p>}
            </div>
            <div style={{marginTop:'20px',paddingTop:'16px',borderTop:'1px solid #e2e8f0'}}>
              <button onClick={()=>setTableDetailRow(null)} style={{width:'100%',padding:'11px',border:'1.5px solid #e2e8f0',borderRadius:'10px',background:'white',color:'#64748b',fontWeight:'600',cursor:'pointer'}}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Suggestion Detail Modal */}
      {selectedSuggestion && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '40px 20px 20px', overflowY: 'auto'}}>
          <div style={{background: 'white', borderRadius: '16px', padding: '40px', maxWidth: '600px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
              <h2 style={{fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0}}>💬 Suggestion</h2>
              <button onClick={() => setSelectedSuggestion(null)} style={{background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b'}}>✕</button>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '20px'}}>
              <div>
                <label style={{fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px'}}>From</label>
                <p style={{fontSize: '14px', color: '#0f172a', margin: '6px 0 0 0', fontWeight: '700'}}>{selectedSuggestion.user_name}</p>
                <p style={{fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0'}}>{selectedSuggestion.user_email}</p>
              </div>
              <div>
                <label style={{fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px'}}>Department</label>
                <p style={{fontSize: '14px', color: '#0f172a', margin: '6px 0 0 0'}}>{selectedSuggestion.department}</p>
              </div>
              <div style={{gridColumn: '1/-1'}}>
                <label style={{fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px'}}>Submitted</label>
                <p style={{fontSize: '13px', color: '#0f172a', margin: '6px 0 0 0'}}>{selectedSuggestion.submitted_at ? new Date(selectedSuggestion.submitted_at).toLocaleString() : '-'}</p>
              </div>
            </div>

            <div style={{borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginBottom: '20px'}}>
              <label style={{fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px'}}>Suggestion Content</label>
              <div style={{background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginTop: '10px', fontSize: '14px', color: '#0f172a', lineHeight: '1.7', whiteSpace: 'pre-wrap'}}>
                {selectedSuggestion.suggestion}
              </div>
            </div>

            {selectedSuggestion.files?.length > 0 && (
              <div style={{marginBottom: '20px'}}>
                <label style={{fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px'}}>Attachments</label>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px'}}>
                  {selectedSuggestion.files.map((f, i) => (
                    f.url && !f.url.startsWith('blob:') ? (
                      <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" style={{background: '#e0f2fe', color: '#0369a1', padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
                        📎 {f.name} ↗
                      </a>
                    ) : (
                      <span key={i} style={{background: '#f1f5f9', color: '#94a3b8', padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: '600'}}>📎 {f.name} (expired)</span>
                    )
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setSelectedSuggestion(null)} style={{width: '100%', padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: 'white', color: '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '14px'}}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
