#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Supabase 配置
const SUPABASE_URL = 'https://eoautxgdxjjphponmaua.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYXV0eGdkeGpqcGhwb25tYXVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTA3MDcxMCwiZXhwIjoyMDk2NjQ2NzEwfQ.XHk3pURUSZG-r8uyuyvXCi3SbgnwaHWqx6S4VMtHaLQ';

// 用户列表
const USERS = [
  // Admin (Level 1)
  { email: 'cindyzhang@tassure.com', name: 'Cindy', role: 'admin', department: 'Management' },
  { email: 'samuellng@tassure.com', name: 'Samuell', role: 'admin', department: 'Management' },
  { email: 'yeesoon@tassure.com', name: 'Yee Soon', role: 'admin', department: 'Management' },
  { email: 'esther@tassure.com', name: 'Esther', role: 'admin', department: 'Internal' },
  { email: 'vincent@tassure.com', name: 'Vincent', role: 'admin', department: 'Internal' },

  // Leader (Level 2)
  { email: 'hoechyi@tassure.com', name: 'Hoe Chyi', role: 'leader', department: 'Corporate Secretarial' },
  { email: 'sengxin@tassure.com', name: 'Seng Xin', role: 'leader', department: 'Corporate Secretarial' },
  { email: 'clarencesaw@tassure.com', name: 'Clarence', role: 'leader', department: 'Tax' },
  { email: 'jaytay@tassure.com', name: 'Jay', role: 'leader', department: 'Accounting' },
  { email: 'jingfei@tassure.com', name: 'Jing Fei', role: 'leader', department: 'Accounting' },

  // Employee (Level 3)
  { email: 'jennylai@tassure.com', name: 'Jenny Lai', role: 'employee', department: 'Corporate Secretarial' },
  { email: 'kahye@tassure.com', name: 'Chin Kah Ye', role: 'employee', department: 'Corporate Secretarial' },
  { email: 'shiming@tassure.com', name: 'Ang Shi Ming', role: 'employee', department: 'Corporate Secretarial' },
  { email: 'shemin@tassure.com', name: 'Tey Shemin', role: 'employee', department: 'Corporate Secretarial' },
  { email: 'minquan@tassure.com', name: 'Tan Min Quan', role: 'employee', department: 'Corporate Secretarial' },
  { email: 'yuheng@tassure.com', name: 'Tee Yu Heng', role: 'employee', department: 'Accounting' },
  { email: 'vernice@tassure.com', name: 'Vernice Chai', role: 'employee', department: 'Accounting' },
  { email: 'weien@tassure.com', name: 'Chee Wei En', role: 'employee', department: 'Accounting' },
  { email: 'chelsea@tassure.com', name: 'Chelsea Ang', role: 'employee', department: 'Internal' },
  { email: 'quinnietan@tassure.com', name: 'Quinnie Tan', role: 'employee', department: 'Tax' },
  { email: 'victoriayap@tassure.com', name: 'Victoria Yap', role: 'employee', department: 'Tax' },
];

const PASSWORD = '123456';

async function createUsers() {
  console.log('🚀 开始创建用户...\n');

  // 创建 Supabase 管理客户端
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let successCount = 0;
  let failCount = 0;
  const createdUsers = [];

  for (const user of USERS) {
    try {
      console.log(`⏳ 创建用户: ${user.email}...`);

      // 1. 在 auth.users 中创建用户
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: PASSWORD,
        email_confirm: true,
      });

      if (authError) {
        console.error(`  ❌ 失败: ${authError.message}`);
        failCount++;
        continue;
      }

      const userId = authData.user.id;

      // 2. 在 public.users 中添加用户信息
      const { error: dbError } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email: user.email,
            name: user.name,
            role: user.role,
            department: user.department,
          },
        ]);

      if (dbError) {
        console.error(`  ❌ 数据库错误: ${dbError.message}`);
        failCount++;
        continue;
      }

      console.log(`  ✅ 成功创建`);
      successCount++;
      createdUsers.push({
        email: user.email,
        name: user.name,
        role: user.role,
        id: userId,
      });
    } catch (error) {
      console.error(`  ❌ 错误: ${error.message}`);
      failCount++;
    }
  }

  // 输出总结
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 创建结果:`);
  console.log(`✅ 成功: ${successCount}/${USERS.length}`);
  console.log(`❌ 失败: ${failCount}/${USERS.length}`);
  console.log(`${'='.repeat(50)}\n`);

  if (successCount > 0) {
    console.log('✨ 已创建的用户:');
    console.log('Role\t\tEmail\t\t\t\t\tName');
    console.log('-'.repeat(80));
    createdUsers.forEach((u) => {
      const role = u.role.padEnd(8);
      const email = u.email.padEnd(40);
      console.log(`${role}\t${email}\t${u.name}`);
    });
  }

  console.log('\n💡 提示:');
  console.log('- 所有用户的默认密码都是: 123456');
  console.log('- 现在可以使用这些账号登录系统');
  console.log('- 如果需要，你可以在 Supabase 中更改密码\n');
}

// 运行
createUsers().catch((error) => {
  console.error('❌ 创建用户失败:', error.message);
  process.exit(1);
});
