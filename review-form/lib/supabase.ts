import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eoautxgdxjjphponmaua.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_rJkjvZ421AQeFQQOeQRWow_pWHekQSY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  // 获取用户角色信息
  if (data.user) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role, department')
      .eq('id', data.user.id)
      .single();

    if (userError) {
      throw new Error('Failed to fetch user info');
    }

    return userData;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// 保存自评表单（草稿或提交）
export async function saveSelfReview(
  userId: string,
  reviewData: any,
  status: 'draft' | 'submitted' = 'draft'
) {
  // 检查是否已存在
  const { data: existing } = await supabase
    .from('self_review_submissions')
    .select('id')
    .eq('user_id', userId)
    .eq('review_period', reviewData.period)
    .single();

  if (existing) {
    // 更新现有记录
    return await supabase
      .from('self_review_submissions')
      .update({
        client_complaints_count: reviewData.clientComplaints,
        client_complaints_comment: reviewData.clientComplaintsComment,
        client_attrition_count: reviewData.clientAttrition,
        client_attrition_comment: reviewData.clientAttritionComment,
        minor_delays_count: reviewData.minorDelays,
        minor_delays_comment: reviewData.minorDelaysComment,
        status,
        submitted_at: status === 'submitted' ? new Date() : null,
      })
      .eq('id', existing.id);
  } else {
    // 插入新记录
    return await supabase
      .from('self_review_submissions')
      .insert([
        {
          user_id: userId,
          department: reviewData.department,
          review_period: reviewData.period,
          client_complaints_count: reviewData.clientComplaints,
          client_complaints_comment: reviewData.clientComplaintsComment,
          client_attrition_count: reviewData.clientAttrition,
          client_attrition_comment: reviewData.clientAttritionComment,
          minor_delays_count: reviewData.minorDelays,
          minor_delays_comment: reviewData.minorDelaysComment,
          status,
          submitted_at: status === 'submitted' ? new Date() : null,
        },
      ]);
  }
}

// 获取用户的自评记录
export async function getSelfReviewSubmission(userId: string, period: string) {
  return await supabase
    .from('self_review_submissions')
    .select('*')
    .eq('user_id', userId)
    .eq('review_period', period)
    .single();
}

// 保存主管评估
export async function saveLeaderReview(
  leaderId: string,
  employeeId: string,
  reviewData: any,
  status: 'draft' | 'submitted' = 'draft'
) {
  const { data: existing } = await supabase
    .from('leader_review_submissions')
    .select('id')
    .eq('leader_id', leaderId)
    .eq('employee_id', employeeId)
    .eq('review_period', reviewData.period)
    .single();

  if (existing) {
    return await supabase
      .from('leader_review_submissions')
      .update({
        overall_remarks: reviewData.overallRemarks,
        status,
        submitted_at: status === 'submitted' ? new Date() : null,
      })
      .eq('id', existing.id);
  } else {
    return await supabase
      .from('leader_review_submissions')
      .insert([
        {
          leader_id: leaderId,
          employee_id: employeeId,
          department: reviewData.department,
          review_period: reviewData.period,
          overall_remarks: reviewData.overallRemarks,
          status,
          submitted_at: status === 'submitted' ? new Date() : null,
        },
      ]);
  }
}

// 获取所有自评提交（管理员）
export async function getAllSelfReviews(period?: string) {
  let query = supabase
    .from('self_review_submissions')
    .select('*, users(name, email, department)')
    .order('created_at', { ascending: false });

  if (period) {
    query = query.eq('review_period', period);
  }

  return await query;
}

// 获取所有主管评估（管理员）
export async function getAllLeaderReviews(period?: string) {
  let query = supabase
    .from('leader_review_submissions')
    .select('*, leader:leader_id(name, email), employee:employee_id(name, email)')
    .order('created_at', { ascending: false });

  if (period) {
    query = query.eq('review_period', period);
  }

  return await query;
}
