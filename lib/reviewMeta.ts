// Canonical title + question metadata for every review form field.
// Used by read-only views (e.g. My Submissions → View Details) to render
// the same "Title / Question / Answer" structure as the live forms, since
// form_data only stores the answers, not the question text.

export interface FieldMeta { name: string; question: string }

// ─── KPI metadata (self + leader + finance) ─────────────────────────────────
export const KPI_META: Record<string, FieldMeta> = {
  // Self review
  client_complaints:    { name: 'Client Complaints / Issues / 客户抱怨／异常', question: 'Were there any client complaints, issues or controllable churn? / 有没有客户抱怨、异常和可控流失？' },
  client_attrition:     { name: 'Client Attrition / 客户流失', question: 'Was there client loss due to lack of follow-up or unresolved issues? / 因为没有及时跟进和解决问题，导致客户流失？' },
  minor_delays:         { name: 'Chased / Minor Delays / 被催、一般延误', question: 'Was the employee chased by clients or management? / 有没有被催、被客户或被管理？' },
  serious_delays:       { name: 'Serious Delays / 严重延误', question: 'Were there delays that affected client arrangements or led to cancellations? / 有没有延误影响客户安排，甚至导致客户取消服务？' },
  minor_errors:         { name: 'Minor Errors / 轻微错误', question: 'Were there any mistakes made? / 有没有出错？' },
  serious_errors:       { name: 'Serious Errors / Penalty Risk / 严重错误／罚款风险', question: 'Were there any filing issues, penalty risks or client impact? / 是否有申报、罚款和客户影响风险？' },
  communication_issues: { name: 'Communication / Handover Issues / 沟通／交接问题', question: 'Was collaboration with colleagues smooth? / 和员工和同事协作顺不顺？' },
  team_impact:          { name: 'Team Impact / 影响团队', question: 'Were there any communication or handover problems? / 有没有沟通和交接问题？' },
  learning_application: { name: 'Learning & Application / 学习并应用', question: 'Has new knowledge been applied to work? / 学到的东西有没有在工作里正用？' },

  // Leader review
  kpi_0_0: { name: 'Client Complaints / Issues / 客户抱怨／异常', question: 'Were there any client complaints, issues or controllable churn? / 有没有客户抱怨、异常和可控流失？' },
  kpi_0_1: { name: 'Client Attrition / 客户流失', question: 'Was there client loss due to lack of follow-up or unresolved issues? / 因为没有及时跟进和解决问题，导致客户流失？' },
  kpi_1_0: { name: 'Chased / Minor Delays / 被催、一般延误', question: 'Was the employee chased by clients or management? / 有没有被催、被客户或被管理？' },
  kpi_1_1: { name: 'Serious Delays / 严重延误', question: 'Were there delays that affected client arrangements or led to cancellations? / 有没有延误影响客户安排，甚至导致客户取消服务？' },
  kpi_2_0: { name: 'Minor Errors / 轻微错误', question: 'Were there any mistakes made? / 有没有出错？' },
  kpi_2_1: { name: 'Serious Errors / Penalty Risk / 严重错误／罚款风险', question: 'Were there any filing issues, penalty risks or client impact? / 是否有申报、罚款和客户影响风险？' },
  kpi_3_0: { name: 'Communication / Handover Issues / 沟通／交接问题', question: 'Was collaboration with colleagues smooth? / 和员工和同事协作顺不顺？' },
  kpi_3_1: { name: 'Team Impact / 影响团队', question: 'Were there any communication or handover problems? / 有没有沟通和交接问题？' },
  kpi_4_0: { name: 'Learning & Application / 学习并应用', question: 'Has the employee applied new knowledge to their work? / 学到的东西有没有在工作里正用？' },

  // Finance & Admin review
  fin_efficiency:    { name: 'Internal Work Efficiency Issues / 内部工作效率问题', question: 'Were there inefficiencies or bottlenecks in finance or admin tasks this period? / 本月财务或行政工作是否出现效率不足或瓶颈问题？' },
  fin_support_delay: { name: 'Delay or Weakness in Supporting Other Employees / 协助其他员工时的延误或不足', question: 'Were there delays or failures in responding to employee requests or supporting other departments? / 在回应员工请求或协助其他部门时，是否有延误或不足？' },
  fin_billing_errors:{ name: 'Billing / Invoice Errors or Delays / 开单 / 发票错误或延误', question: 'Were there any errors, duplications, or delays in billing and invoice processing? / 开单或发票处理是否出现错误、重复或延误？' },
  fin_filing_issues: { name: 'Filing, Record Keeping, or Document Accuracy Issues / 文件归档、记录保存或资料准确性问题', question: 'Were there issues with filing, document completeness, or data accuracy? / 是否有文件归档、资料完整性或数据准确性方面的问题？' },
};

// ─── Positive item metadata (self + leader + finance) ───────────────────────
export const POS_META: Record<string, FieldMeta> = {
  // Self review
  pos_compliment: { name: 'Written Client Compliment / 客户书面表扬', question: 'Client proactively sent email/message with explicit praise (not routine thanks) / 客户主动发email/message有明确表扬，非常规感谢' },
  pos_requested:  { name: 'Client Requested Same Staff / 客户点名继续服务', question: 'Client explicitly requested the same employee or gave special recognition / 客户明确要求继续由该员工负责，有特别认可' },
  pos_prevented:  { name: 'Prevented Major Risk / Penalty / 避免重大风险／罚款', question: 'Identified issues outside scope and prevented significant losses / 超职责范围发现问题并避免重大损失' },
  pos_recovered:  { name: 'Recovered Client / 挽回客户', question: 'Successfully retained a client at risk of leaving / 已有流失风险客户被成功挽回' },
  pos_resolved:   { name: 'Resolved Legacy / Complex Issues / 解决遗留／复杂问题', question: 'Took over and resolved problems not caused by themselves / 接手非本人造成的问题并成功处理' },
  pos_business:   { name: 'Additional Business Opportunity / 额外业务机会', question: 'Referral / upsell / cross-sell (outside sales role) / 转介业务' },
  pos_special:    { name: 'Special Contribution / 特别贡献', question: 'Contribution clearly beyond job scope, requires manager explanation / 有明显超出岗位职责的贡献，需主管说明' },

  // Leader review
  pos_0: { name: 'Written Client Compliment / 客户书面表扬', question: 'Client proactively sent email/message with explicit praise (not routine thanks) / 客户主动发email/message有明确表扬，非常规感谢' },
  pos_1: { name: 'Client Requested Same Staff / 客户点名继续服务', question: 'Client explicitly requested the same employee or gave special recognition / 客户明确要求继续由该员工负责，有特别认可' },
  pos_2: { name: 'Prevented Major Risk / Penalty / 避免重大风险／罚款', question: 'Identified issues outside scope and prevented significant losses / 超职责范围发现问题并避免重大损失' },
  pos_3: { name: 'Recovered Client / 挽回客户', question: 'Successfully retained a client at risk of leaving / 已有流失风险客户被成功挽回' },
  pos_4: { name: 'Resolved Legacy / Complex Issues / 解决遗留／复杂问题', question: 'Took over and resolved problems not caused by themselves / 接手非本人造成的问题并成功处理' },
  pos_5: { name: 'Additional Business Opportunity / 额外业务机会', question: 'Referral / upsell / cross-sell (outside sales role) / 转介业务' },
  pos_6: { name: 'Special Contribution / 特别贡献', question: 'Contribution clearly beyond job scope, requires manager explanation / 有明显超出岗位职责的贡献，需主管说明' },

  // Finance & Admin review
  fin_efficiency_improve: { name: 'Improvement in Finance / Admin Work Efficiency / 财务 / 行政工作效率提升', question: 'Did you implement improvements that made finance or admin processes faster or more reliable? / 是否有改善措施让财务或行政流程更快速或更可靠？' },
  fin_employee_support:   { name: 'Support Provided to Employees and Departments / 对员工和部门提供的支持', question: 'Did you provide notable support to employees or other departments this period? / 本期是否为员工或其他部门提供了显著的支持？' },
  fin_billing_accuracy:   { name: 'Billing / Invoice Accuracy and Timely Completion / 开单 / 发票的准确性与及时完成情况', question: 'Was all billing and invoicing completed accurately and on time? / 所有开单和发票是否准确且及时完成？' },
  fin_office_operations:  { name: 'Contribution to Smooth Daily Office Operations / 对办公室日常顺利运作的贡献', question: 'Did you contribute to keeping daily office operations running smoothly? / 是否有贡献于确保办公室日常运作顺利进行？' },
};
