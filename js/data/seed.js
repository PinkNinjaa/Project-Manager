import { CURRENT_USER, isoAt, isoDate } from '../domain.js';

/**
 * Fictional sample data for the mockup.
 *
 * Dates are relative to the day the page loads so the demo never goes stale.
 * Everything is invented: there is no company data, backend, or authentication
 * behind these records.
 */
export function createSeedData() {
  const projects = [
    {
      id: 'PRJ-2026-101',
      name: 'Website Redesign',
      description:
        'Refresh the public marketing site with a new design system, clearer navigation, and an accessible launch-ready build.',
      status: 'in_progress',
      priority: 'high',
      type: 'client_delivery',
      ownerName: 'Jordan Mitchell',
      ownerEmail: 'jordan.mitchell@contoso.com',
      startDate: isoDate(-24),
      dueDate: isoDate(12),
      budget: 45000,
      team: ['Jordan Mitchell', 'Alicia Moreau', 'Mike Chen'],
      tags: ['Design', 'Launch'],
      createdAt: isoAt(-24, 9),
      updatedAt: isoAt(-1, 15)
    },
    {
      id: 'PRJ-2026-102',
      name: 'ERP Data Migration',
      description:
        'Move finance and procurement master data into the new ERP platform, including field mapping, dry runs, and a tested rollback plan.',
      status: 'in_progress',
      priority: 'high',
      type: 'infrastructure',
      ownerName: 'Carla Jensen',
      ownerEmail: 'carla.jensen@contoso.com',
      startDate: isoDate(-38),
      dueDate: isoDate(30),
      budget: 120000,
      team: ['Carla Jensen', 'Hugo Marsh', 'Ben Okafor'],
      tags: ['Data', 'ERP'],
      createdAt: isoAt(-38, 8),
      updatedAt: isoAt(-1, 11)
    },
    {
      id: 'PRJ-2026-103',
      name: 'Q3 Compliance Review',
      description:
        'Collect evidence, review vendor agreements, and publish the quarterly compliance report for the audit committee.',
      status: 'on_hold',
      priority: 'medium',
      type: 'compliance',
      ownerName: 'Elena Petrova',
      ownerEmail: 'elena.petrova@contoso.com',
      startDate: isoDate(-32),
      dueDate: isoDate(-2),
      budget: 18000,
      team: ['Elena Petrova', 'Alicia Moreau', 'Priya Raman'],
      tags: ['Audit', 'Policy'],
      createdAt: isoAt(-32, 10),
      updatedAt: isoAt(-2, 16)
    },
    {
      id: 'PRJ-2026-104',
      name: 'Employee Portal Launch',
      description:
        'Stand up a single employee portal for announcements, requests, and people services, with SSO and a managed content model.',
      status: 'not_started',
      priority: 'medium',
      type: 'internal_tools',
      ownerName: 'Ben Okafor',
      ownerEmail: 'ben.okafor@contoso.com',
      startDate: isoDate(5),
      dueDate: isoDate(45),
      budget: 65000,
      team: ['Ben Okafor', 'Hugo Marsh', 'Alicia Moreau'],
      tags: ['Portal', 'Intranet'],
      createdAt: isoAt(-20, 13),
      updatedAt: isoAt(-3, 9)
    },
    {
      id: 'PRJ-2026-105',
      name: 'Vendor Consolidation',
      description:
        'Reduce the active vendor list, renegotiate the top contracts, and document a repeatable procurement decision model.',
      status: 'in_progress',
      priority: 'low',
      type: 'operations',
      ownerName: 'Farid Haddad',
      ownerEmail: 'farid.haddad@contoso.com',
      startDate: isoDate(-14),
      dueDate: isoDate(18),
      budget: 30000,
      team: ['Farid Haddad', 'Carla Jensen', 'Jordan Mitchell'],
      tags: ['Procurement', 'Vendors'],
      createdAt: isoAt(-14, 9),
      updatedAt: isoAt(-1, 14)
    },
    {
      id: 'PRJ-2026-106',
      name: 'Security Awareness Campaign',
      description:
        'Run a company-wide phishing simulation and training campaign, then publish the results and follow-up actions.',
      status: 'completed',
      priority: 'low',
      type: 'compliance',
      ownerName: 'Hugo Marsh',
      ownerEmail: 'hugo.marsh@contoso.com',
      startDate: isoDate(-55),
      dueDate: isoDate(-10),
      completedAt: isoDate(-10),
      budget: 12000,
      team: ['Hugo Marsh', 'Priya Raman'],
      tags: ['Security', 'Training'],
      createdAt: isoAt(-55, 9),
      updatedAt: isoAt(-10, 17)
    },
    {
      id: 'PRJ-2026-107',
      name: 'Mobile App Discovery',
      description:
        'Validate the mobile product opportunity through interviews, competitive research, and a short concept sprint.',
      status: 'in_progress',
      priority: 'medium',
      type: 'product',
      ownerName: 'Grace Lin',
      ownerEmail: 'grace.lin@contoso.com',
      startDate: isoDate(-12),
      dueDate: isoDate(25),
      budget: 25000,
      team: ['Grace Lin', 'Mike Chen', 'Jordan Mitchell'],
      tags: ['Discovery', 'Mobile'],
      createdAt: isoAt(-12, 10),
      updatedAt: isoAt(-1, 10)
    },
    {
      id: 'PRJ-2026-108',
      name: 'Office Move Coordination',
      description:
        'Plan the move to the new floor: space planning, vendor quotes, communications, and a cutover checklist.',
      status: 'not_started',
      priority: 'high',
      type: 'operations',
      ownerName: 'Devin Aluko',
      ownerEmail: 'devin.aluko@contoso.com',
      startDate: isoDate(10),
      dueDate: isoDate(60),
      budget: 90000,
      team: ['Devin Aluko', 'Farid Haddad', 'Alicia Moreau'],
      tags: ['Facilities', 'Move'],
      createdAt: isoAt(-8, 11),
      updatedAt: isoAt(-4, 15)
    },
    {
      id: 'PRJ-2026-109',
      name: 'Data Retention Policy Refresh',
      description:
        'Superseded by the new records programme. The draft and review tasks are kept for reference only.',
      status: 'cancelled',
      priority: 'low',
      type: 'compliance',
      ownerName: 'Elena Petrova',
      ownerEmail: 'elena.petrova@contoso.com',
      startDate: isoDate(-22),
      dueDate: isoDate(5),
      budget: 5000,
      team: ['Elena Petrova', 'Alicia Moreau'],
      tags: ['Policy', 'Retention'],
      createdAt: isoAt(-22, 9),
      updatedAt: isoAt(-6, 12)
    }
  ];

  const tasks = [
    {
      id: 'TSK-1001',
      projectId: 'PRJ-2026-101',
      title: 'Review homepage wireframes',
      description: 'Walk through the new hero and navigation with the design team and capture decisions.',
      assigneeName: 'Jordan Mitchell',
      assigneeEmail: 'jordan.mitchell@contoso.com',
      status: 'in_progress',
      priority: 'high',
      dueDate: isoDate(0),
      createdAt: isoAt(-6, 9),
      completedAt: null
    },
    {
      id: 'TSK-1002',
      projectId: 'PRJ-2026-101',
      title: 'Accessibility audit',
      description: 'Run the keyboard, contrast, and screen-reader checks on the staging build.',
      assigneeName: 'Jordan Mitchell',
      assigneeEmail: 'jordan.mitchell@contoso.com',
      status: 'in_progress',
      priority: 'medium',
      dueDate: isoDate(-1),
      createdAt: isoAt(-8, 10),
      completedAt: null
    },
    {
      id: 'TSK-1003',
      projectId: 'PRJ-2026-101',
      title: 'Finalize design system tokens',
      description: 'Lock colour, type, spacing, and radius tokens for the first release.',
      assigneeName: 'Alicia Moreau',
      assigneeEmail: 'alicia.moreau@contoso.com',
      status: 'completed',
      priority: 'medium',
      dueDate: isoDate(-3),
      createdAt: isoAt(-18, 9),
      completedAt: isoDate(-3)
    },
    {
      id: 'TSK-1004',
      projectId: 'PRJ-2026-101',
      title: 'Stakeholder sign-off on navigation',
      description: 'Confirm the top-level information architecture with the executive sponsor.',
      assigneeName: 'Mike Chen',
      assigneeEmail: 'mike.chen@contoso.com',
      status: 'not_started',
      priority: 'high',
      dueDate: isoDate(4),
      createdAt: isoAt(-4, 14),
      completedAt: null
    },
    {
      id: 'TSK-1005',
      projectId: 'PRJ-2026-101',
      title: 'Prepare launch checklist',
      description: 'Bring together content, analytics, redirects, and support handover items.',
      assigneeName: 'Jordan Mitchell',
      assigneeEmail: 'jordan.mitchell@contoso.com',
      status: 'not_started',
      priority: 'medium',
      dueDate: isoDate(9),
      createdAt: isoAt(-3, 9),
      completedAt: null
    },
    {
      id: 'TSK-1006',
      projectId: 'PRJ-2026-101',
      title: 'Migrate legacy content',
      description: 'Move the remaining case studies and resource pages into the new structure.',
      assigneeName: 'Alicia Moreau',
      assigneeEmail: 'alicia.moreau@contoso.com',
      status: 'in_progress',
      priority: 'low',
      dueDate: isoDate(6),
      createdAt: isoAt(-9, 11),
      completedAt: null
    },
    {
      id: 'TSK-1007',
      projectId: 'PRJ-2026-101',
      title: 'QA responsive layouts',
      description: 'Check the primary templates at mobile, tablet, and desktop widths.',
      assigneeName: 'Jordan Mitchell',
      assigneeEmail: 'jordan.mitchell@contoso.com',
      status: 'completed',
      priority: 'high',
      dueDate: isoDate(-2),
      createdAt: isoAt(-7, 10),
      completedAt: isoDate(-2)
    },
    {
      id: 'TSK-1008',
      projectId: 'PRJ-2026-102',
      title: 'Map ERP stakeholders',
      description: 'Confirm process owners and approvers for each finance and procurement workstream.',
      assigneeName: 'Jordan Mitchell',
      assigneeEmail: 'jordan.mitchell@contoso.com',
      status: 'in_progress',
      priority: 'medium',
      dueDate: isoDate(3),
      createdAt: isoAt(-5, 9),
      completedAt: null
    },
    {
      id: 'TSK-1009',
      projectId: 'PRJ-2026-102',
      title: 'Define field mapping rules',
      description: 'Document source-to-target mappings and exception handling for the first migration wave.',
      assigneeName: 'Hugo Marsh',
      assigneeEmail: 'hugo.marsh@contoso.com',
      status: 'in_progress',
      priority: 'high',
      dueDate: isoDate(5),
      createdAt: isoAt(-12, 14),
      completedAt: null
    },
    {
      id: 'TSK-1010',
      projectId: 'PRJ-2026-102',
      title: 'Clean vendor master data',
      description: 'Resolve duplicates and missing tax identifiers before the dry run.',
      assigneeName: 'Ben Okafor',
      assigneeEmail: 'ben.okafor@contoso.com',
      status: 'not_started',
      priority: 'medium',
      dueDate: isoDate(10),
      createdAt: isoAt(-10, 9),
      completedAt: null
    },
    {
      id: 'TSK-1011',
      projectId: 'PRJ-2026-102',
      title: 'Run migration dry run',
      description: 'Execute the full load in the test environment and capture reconciliation results.',
      assigneeName: 'Hugo Marsh',
      assigneeEmail: 'hugo.marsh@contoso.com',
      status: 'not_started',
      priority: 'high',
      dueDate: isoDate(18),
      createdAt: isoAt(-6, 9),
      completedAt: null
    },
    {
      id: 'TSK-1012',
      projectId: 'PRJ-2026-102',
      title: 'Write rollback plan',
      description: 'Document the cutover checkpoints and the steps to restore the previous state.',
      assigneeName: 'Carla Jensen',
      assigneeEmail: 'carla.jensen@contoso.com',
      status: 'completed',
      priority: 'medium',
      dueDate: isoDate(-4),
      createdAt: isoAt(-16, 11),
      completedAt: isoDate(-4)
    },
    {
      id: 'TSK-1013',
      projectId: 'PRJ-2026-102',
      title: 'Produce data quality report',
      description: 'Summarize the duplicate, completeness, and formatting findings from the first pass.',
      assigneeName: 'Ben Okafor',
      assigneeEmail: 'ben.okafor@contoso.com',
      status: 'completed',
      priority: 'low',
      dueDate: isoDate(-7),
      createdAt: isoAt(-18, 9),
      completedAt: isoDate(-7)
    },
    {
      id: 'TSK-1014',
      projectId: 'PRJ-2026-103',
      title: 'Collect policy evidence',
      description: 'Gather the signed policy acknowledgements and retention records for the audit sample.',
      assigneeName: 'Jordan Mitchell',
      assigneeEmail: 'jordan.mitchell@contoso.com',
      status: 'in_progress',
      priority: 'high',
      dueDate: isoDate(-1),
      createdAt: isoAt(-11, 9),
      completedAt: null
    },
    {
      id: 'TSK-1015',
      projectId: 'PRJ-2026-103',
      title: 'Update retention schedule',
      description: 'Align the schedule with the new records classification and legal hold rules.',
      assigneeName: 'Elena Petrova',
      assigneeEmail: 'elena.petrova@contoso.com',
      status: 'not_started',
      priority: 'medium',
      dueDate: isoDate(6),
      createdAt: isoAt(-9, 10),
      completedAt: null
    },
    {
      id: 'TSK-1016',
      projectId: 'PRJ-2026-103',
      title: 'Review vendor agreements',
      description: 'Check data-processing terms and retention clauses for the top ten vendors.',
      assigneeName: 'Priya Raman',
      assigneeEmail: 'priya.raman@contoso.com',
      status: 'in_progress',
      priority: 'medium',
      dueDate: isoDate(2),
      createdAt: isoAt(-8, 13),
      completedAt: null
    },
    {
      id: 'TSK-1017',
      projectId: 'PRJ-2026-103',
      title: 'Draft final compliance report',
      description: 'Bring the evidence, findings, and remediation actions into the audit committee pack.',
      assigneeName: 'Elena Petrova',
      assigneeEmail: 'elena.petrova@contoso.com',
      status: 'not_started',
      priority: 'high',
      dueDate: isoDate(12),
      createdAt: isoAt(-7, 9),
      completedAt: null
    },
    {
      id: 'TSK-1018',
      projectId: 'PRJ-2026-103',
      title: 'Circulate kickoff notes',
      description: 'Share the scope, owners, and evidence request list with the review team.',
      assigneeName: 'Priya Raman',
      assigneeEmail: 'priya.raman@contoso.com',
      status: 'completed',
      priority: 'low',
      dueDate: isoDate(-20),
      createdAt: isoAt(-25, 9),
      completedAt: isoDate(-20)
    },
    {
      id: 'TSK-1019',
      projectId: 'PRJ-2026-104',
      title: 'Draft portal requirements',
      description: 'Capture the must-have employee journeys and the content ownership model.',
      assigneeName: 'Ben Okafor',
      assigneeEmail: 'ben.okafor@contoso.com',
      status: 'not_started',
      priority: 'high',
      dueDate: isoDate(8),
      createdAt: isoAt(-6, 9),
      completedAt: null
    },
    {
      id: 'TSK-1020',
      projectId: 'PRJ-2026-104',
      title: 'Review SSO options',
      description: 'Compare the identity provider options and document the recommended approach.',
      assigneeName: 'Hugo Marsh',
      assigneeEmail: 'hugo.marsh@contoso.com',
      status: 'not_started',
      priority: 'medium',
      dueDate: isoDate(12),
      createdAt: isoAt(-5, 14),
      completedAt: null
    },
    {
      id: 'TSK-1021',
      projectId: 'PRJ-2026-104',
      title: 'Complete content inventory',
      description: 'List the intranet pages worth migrating and mark each for keep, merge, or retire.',
      assigneeName: 'Alicia Moreau',
      assigneeEmail: 'alicia.moreau@contoso.com',
      status: 'not_started',
      priority: 'low',
      dueDate: isoDate(15),
      createdAt: isoAt(-5, 9),
      completedAt: null
    },
    {
      id: 'TSK-1022',
      projectId: 'PRJ-2026-104',
      title: 'Run stakeholder kickoff',
      description: 'Agree the launch scope and confirm the product owner and content leads.',
      assigneeName: 'Jordan Mitchell',
      assigneeEmail: 'jordan.mitchell@contoso.com',
      status: 'not_started',
      priority: 'medium',
      dueDate: isoDate(6),
      createdAt: isoAt(-4, 10),
      completedAt: null
    },
    {
      id: 'TSK-1023',
      projectId: 'PRJ-2026-105',
      title: 'Review contract redlines',
      description: 'Check the legal changes on the three highest-spend renewals before negotiation.',
      assigneeName: 'Jordan Mitchell',
      assigneeEmail: 'jordan.mitchell@contoso.com',
      status: 'in_progress',
      priority: 'medium',
      dueDate: isoDate(5),
      createdAt: isoAt(-7, 9),
      completedAt: null
    },
    {
      id: 'TSK-1024',
      projectId: 'PRJ-2026-105',
      title: 'Complete spend analysis',
      description: 'Break down the last twelve months of spend by category and vendor.',
      assigneeName: 'Farid Haddad',
      assigneeEmail: 'farid.haddad@contoso.com',
      status: 'in_progress',
      priority: 'low',
      dueDate: isoDate(4),
      createdAt: isoAt(-10, 13),
      completedAt: null
    },
    {
      id: 'TSK-1025',
      projectId: 'PRJ-2026-105',
      title: 'Build vendor shortlist',
      description: 'Agree the evaluation criteria and select the vendors entering the next round.',
      assigneeName: 'Farid Haddad',
      assigneeEmail: 'farid.haddad@contoso.com',
      status: 'completed',
      priority: 'medium',
      dueDate: isoDate(-5),
      createdAt: isoAt(-12, 9),
      completedAt: isoDate(-5)
    },
    {
      id: 'TSK-1026',
      projectId: 'PRJ-2026-105',
      title: 'Draft negotiation plan',
      description: 'Set the target outcomes, fallback positions, and negotiation owners.',
      assigneeName: 'Carla Jensen',
      assigneeEmail: 'carla.jensen@contoso.com',
      status: 'not_started',
      priority: 'high',
      dueDate: isoDate(8),
      createdAt: isoAt(-4, 9),
      completedAt: null
    },
    {
      id: 'TSK-1027',
      projectId: 'PRJ-2026-106',
      title: 'Publish phishing simulation results',
      description: 'Share the click-rate trend and the top three follow-up actions.',
      assigneeName: 'Hugo Marsh',
      assigneeEmail: 'hugo.marsh@contoso.com',
      status: 'completed',
      priority: 'medium',
      dueDate: isoDate(-12),
      createdAt: isoAt(-35, 9),
      completedAt: isoDate(-12)
    },
    {
      id: 'TSK-1028',
      projectId: 'PRJ-2026-106',
      title: 'Deliver security training sessions',
      description: 'Run the four live sessions and publish the recording for new starters.',
      assigneeName: 'Priya Raman',
      assigneeEmail: 'priya.raman@contoso.com',
      status: 'completed',
      priority: 'low',
      dueDate: isoDate(-14),
      createdAt: isoAt(-40, 10),
      completedAt: isoDate(-14)
    },
    {
      id: 'TSK-1029',
      projectId: 'PRJ-2026-106',
      title: 'Update awareness intranet page',
      description: 'Refresh the guidance, reporting route, and contact details.',
      assigneeName: 'Hugo Marsh',
      assigneeEmail: 'hugo.marsh@contoso.com',
      status: 'completed',
      priority: 'low',
      dueDate: isoDate(-11),
      createdAt: isoAt(-30, 9),
      completedAt: isoDate(-11)
    },
    {
      id: 'TSK-1030',
      projectId: 'PRJ-2026-106',
      title: 'Close campaign feedback loop',
      description: 'Capture lessons learned and hand the repeatable plan to the security team.',
      assigneeName: 'Priya Raman',
      assigneeEmail: 'priya.raman@contoso.com',
      status: 'completed',
      priority: 'low',
      dueDate: isoDate(-10),
      createdAt: isoAt(-25, 9),
      completedAt: isoDate(-10)
    },
    {
      id: 'TSK-1031',
      projectId: 'PRJ-2026-107',
      title: 'Synthesize user interviews',
      description: 'Pull the recurring needs and objections from the twelve discovery interviews.',
      assigneeName: 'Jordan Mitchell',
      assigneeEmail: 'jordan.mitchell@contoso.com',
      status: 'in_progress',
      priority: 'medium',
      dueDate: isoDate(2),
      createdAt: isoAt(-7, 9),
      completedAt: null
    },
    {
      id: 'TSK-1032',
      projectId: 'PRJ-2026-107',
      title: 'Define success metrics',
      description: 'Agree the adoption, retention, and support-cost measures for the concept test.',
      assigneeName: 'Grace Lin',
      assigneeEmail: 'grace.lin@contoso.com',
      status: 'in_progress',
      priority: 'high',
      dueDate: isoDate(4),
      createdAt: isoAt(-6, 14),
      completedAt: null
    },
    {
      id: 'TSK-1033',
      projectId: 'PRJ-2026-107',
      title: 'Complete competitive scan',
      description: 'Summarize the three closest products and the gaps worth testing.',
      assigneeName: 'Mike Chen',
      assigneeEmail: 'mike.chen@contoso.com',
      status: 'completed',
      priority: 'low',
      dueDate: isoDate(-2),
      createdAt: isoAt(-10, 9),
      completedAt: isoDate(-2)
    },
    {
      id: 'TSK-1034',
      projectId: 'PRJ-2026-107',
      title: 'Review concept directions',
      description: 'Choose two directions for the concept sprint and confirm the test audience.',
      assigneeName: 'Grace Lin',
      assigneeEmail: 'grace.lin@contoso.com',
      status: 'not_started',
      priority: 'medium',
      dueDate: isoDate(12),
      createdAt: isoAt(-3, 9),
      completedAt: null
    },
    {
      id: 'TSK-1035',
      projectId: 'PRJ-2026-107',
      title: 'Build user journey map',
      description: 'Map the end-to-end mobile journey, including the handoff to the desktop app.',
      assigneeName: 'Jordan Mitchell',
      assigneeEmail: 'jordan.mitchell@contoso.com',
      status: 'not_started',
      priority: 'medium',
      dueDate: isoDate(8),
      createdAt: isoAt(-2, 10),
      completedAt: null
    },
    {
      id: 'TSK-1036',
      projectId: 'PRJ-2026-108',
      title: 'Complete space planning',
      description: 'Confirm seat counts, meeting rooms, and the zoning plan for the new floor.',
      assigneeName: 'Devin Aluko',
      assigneeEmail: 'devin.aluko@contoso.com',
      status: 'not_started',
      priority: 'high',
      dueDate: isoDate(15),
      createdAt: isoAt(-7, 9),
      completedAt: null
    },
    {
      id: 'TSK-1037',
      projectId: 'PRJ-2026-108',
      title: 'Collect vendor quotes',
      description: 'Obtain comparable quotes for furniture, movers, and IT decommissioning.',
      assigneeName: 'Farid Haddad',
      assigneeEmail: 'farid.haddad@contoso.com',
      status: 'not_started',
      priority: 'medium',
      dueDate: isoDate(20),
      createdAt: isoAt(-6, 11),
      completedAt: null
    },
    {
      id: 'TSK-1038',
      projectId: 'PRJ-2026-108',
      title: 'Draft move communications',
      description: 'Prepare the timeline, floor plans, and packing guidance for each team.',
      assigneeName: 'Alicia Moreau',
      assigneeEmail: 'alicia.moreau@contoso.com',
      status: 'not_started',
      priority: 'low',
      dueDate: isoDate(30),
      createdAt: isoAt(-4, 9),
      completedAt: null
    },
    {
      id: 'TSK-1039',
      projectId: 'PRJ-2026-109',
      title: 'Draft retention policy update',
      description: 'Draft the refreshed schedule and classification guidance.',
      assigneeName: 'Elena Petrova',
      assigneeEmail: 'elena.petrova@contoso.com',
      status: 'not_started',
      priority: 'medium',
      dueDate: isoDate(5),
      createdAt: isoAt(-20, 9),
      completedAt: null
    },
    {
      id: 'TSK-1040',
      projectId: 'PRJ-2026-109',
      title: 'Schedule legal review',
      description: 'Book the review slot and circulate the draft.',
      assigneeName: 'Alicia Moreau',
      assigneeEmail: 'alicia.moreau@contoso.com',
      status: 'not_started',
      priority: 'medium',
      dueDate: isoDate(8),
      createdAt: isoAt(-19, 9),
      completedAt: null
    }
  ];

  const activity = [
    {
      id: 'ACT-2001',
      projectId: 'PRJ-2026-101',
      type: 'created',
      message: 'Project created',
      actor: 'Jordan Mitchell',
      createdAt: isoAt(-24, 9)
    },
    {
      id: 'ACT-2002',
      projectId: 'PRJ-2026-101',
      type: 'task',
      message: 'Completed “Finalize design system tokens”',
      actor: 'Alicia Moreau',
      createdAt: isoAt(-3, 15)
    },
    {
      id: 'ACT-2003',
      projectId: 'PRJ-2026-101',
      type: 'comment',
      message: 'Added a note about the launch content handover',
      actor: 'Mike Chen',
      createdAt: isoAt(-2, 11)
    },
    {
      id: 'ACT-2004',
      projectId: 'PRJ-2026-101',
      type: 'task',
      message: 'Completed “QA responsive layouts”',
      actor: 'Jordan Mitchell',
      createdAt: isoAt(-2, 16)
    },
    {
      id: 'ACT-2005',
      projectId: 'PRJ-2026-101',
      type: 'updated',
      message: 'Updated the target launch date',
      actor: 'Jordan Mitchell',
      createdAt: isoAt(-1, 15)
    },
    {
      id: 'ACT-2006',
      projectId: 'PRJ-2026-102',
      type: 'created',
      message: 'Project created',
      actor: 'Carla Jensen',
      createdAt: isoAt(-38, 8)
    },
    {
      id: 'ACT-2007',
      projectId: 'PRJ-2026-102',
      type: 'task',
      message: 'Completed “Produce data quality report”',
      actor: 'Ben Okafor',
      createdAt: isoAt(-7, 14)
    },
    {
      id: 'ACT-2008',
      projectId: 'PRJ-2026-102',
      type: 'task',
      message: 'Completed “Write rollback plan”',
      actor: 'Carla Jensen',
      createdAt: isoAt(-4, 10)
    },
    {
      id: 'ACT-2009',
      projectId: 'PRJ-2026-102',
      type: 'comment',
      message: 'Shared the first field mapping workshop notes',
      actor: 'Hugo Marsh',
      createdAt: isoAt(-3, 16)
    },
    {
      id: 'ACT-2010',
      projectId: 'PRJ-2026-102',
      type: 'updated',
      message: 'Moved the dry run checkpoint by one week',
      actor: 'Carla Jensen',
      createdAt: isoAt(-1, 11)
    },
    {
      id: 'ACT-2011',
      projectId: 'PRJ-2026-103',
      type: 'created',
      message: 'Project created',
      actor: 'Elena Petrova',
      createdAt: isoAt(-32, 10)
    },
    {
      id: 'ACT-2012',
      projectId: 'PRJ-2026-103',
      type: 'task',
      message: 'Completed “Circulate kickoff notes”',
      actor: 'Priya Raman',
      createdAt: isoAt(-20, 9)
    },
    {
      id: 'ACT-2013',
      projectId: 'PRJ-2026-103',
      type: 'status',
      message: 'Status changed to On Hold',
      actor: 'Elena Petrova',
      createdAt: isoAt(-2, 16)
    },
    {
      id: 'ACT-2014',
      projectId: 'PRJ-2026-104',
      type: 'created',
      message: 'Project created',
      actor: 'Ben Okafor',
      createdAt: isoAt(-20, 13)
    },
    {
      id: 'ACT-2015',
      projectId: 'PRJ-2026-104',
      type: 'updated',
      message: 'Added the SSO review to the plan',
      actor: 'Hugo Marsh',
      createdAt: isoAt(-3, 9)
    },
    {
      id: 'ACT-2016',
      projectId: 'PRJ-2026-105',
      type: 'created',
      message: 'Project created',
      actor: 'Farid Haddad',
      createdAt: isoAt(-14, 9)
    },
    {
      id: 'ACT-2017',
      projectId: 'PRJ-2026-105',
      type: 'task',
      message: 'Completed “Build vendor shortlist”',
      actor: 'Farid Haddad',
      createdAt: isoAt(-5, 13)
    },
    {
      id: 'ACT-2018',
      projectId: 'PRJ-2026-105',
      type: 'updated',
      message: 'Added contract redlines to the review queue',
      actor: 'Jordan Mitchell',
      createdAt: isoAt(-1, 14)
    },
    {
      id: 'ACT-2019',
      projectId: 'PRJ-2026-106',
      type: 'created',
      message: 'Project created',
      actor: 'Hugo Marsh',
      createdAt: isoAt(-55, 9)
    },
    {
      id: 'ACT-2020',
      projectId: 'PRJ-2026-106',
      type: 'task',
      message: 'Completed “Deliver security training sessions”',
      actor: 'Priya Raman',
      createdAt: isoAt(-14, 16)
    },
    {
      id: 'ACT-2021',
      projectId: 'PRJ-2026-106',
      type: 'task',
      message: 'Completed “Publish phishing simulation results”',
      actor: 'Hugo Marsh',
      createdAt: isoAt(-12, 11)
    },
    {
      id: 'ACT-2022',
      projectId: 'PRJ-2026-106',
      type: 'status',
      message: 'Status changed to Completed',
      actor: 'Hugo Marsh',
      createdAt: isoAt(-10, 17)
    },
    {
      id: 'ACT-2023',
      projectId: 'PRJ-2026-107',
      type: 'created',
      message: 'Project created',
      actor: 'Grace Lin',
      createdAt: isoAt(-12, 10)
    },
    {
      id: 'ACT-2024',
      projectId: 'PRJ-2026-107',
      type: 'task',
      message: 'Completed “Complete competitive scan”',
      actor: 'Mike Chen',
      createdAt: isoAt(-2, 15)
    },
    {
      id: 'ACT-2025',
      projectId: 'PRJ-2026-107',
      type: 'comment',
      message: 'Added interview synthesis notes',
      actor: 'Jordan Mitchell',
      createdAt: isoAt(-1, 10)
    },
    {
      id: 'ACT-2026',
      projectId: 'PRJ-2026-108',
      type: 'created',
      message: 'Project created',
      actor: 'Devin Aluko',
      createdAt: isoAt(-8, 11)
    },
    {
      id: 'ACT-2027',
      projectId: 'PRJ-2026-108',
      type: 'updated',
      message: 'Added the move communications workstream',
      actor: 'Alicia Moreau',
      createdAt: isoAt(-4, 15)
    },
    {
      id: 'ACT-2028',
      projectId: 'PRJ-2026-109',
      type: 'created',
      message: 'Project created',
      actor: 'Elena Petrova',
      createdAt: isoAt(-22, 9)
    },
    {
      id: 'ACT-2029',
      projectId: 'PRJ-2026-109',
      type: 'status',
      message: 'Status changed to Cancelled',
      actor: 'Elena Petrova',
      createdAt: isoAt(-6, 12)
    }
  ];

  return { projects, tasks, activity };
}

export const DEMO_USER = CURRENT_USER;
