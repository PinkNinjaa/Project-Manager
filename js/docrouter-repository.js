import { CURRENT_USER, DIRECTORY, todayISO } from './domain.js';

const STORAGE_KEY = 'projectdesk.docrouter.v1';
const STATUS_KEYS = ['New', 'InProgress', 'Suspended', 'Completed'];
const ASSIGNMENT_STATUS = ['NotStarted', 'InProgress', 'OnHold', 'Completed'];
const CATEGORY_KEYS = ['StandardApproval', 'ExpeditedReview', 'DocumentReview', 'ChangeRequest'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const TEMPLATES = {
  StandardApproval: [
    { title: 'Manager Review', assigneeEmail: 'carla.jensen@contoso.com', required: true, durationDays: 2 },
    { title: 'Department Approval', assigneeEmail: 'ben.okafor@contoso.com', required: true, durationDays: 1 }
  ],
  ExpeditedReview: [
    { title: 'Expedited Review', assigneeEmail: 'grace.lin@contoso.com', required: true, durationDays: 0 }
  ],
  DocumentReview: [
    { title: 'Document Check', assigneeEmail: 'devin.aluko@contoso.com', required: true, durationDays: 2 },
    { title: 'Legal Review', assigneeEmail: 'alicia.moreau@contoso.com', required: true, durationDays: 3 }
  ],
  ChangeRequest: [
    { title: 'Operations Review', assigneeEmail: 'farid.haddad@contoso.com', required: true, durationDays: 2 },
    { title: 'Finance Approval', assigneeEmail: 'ben.okafor@contoso.com', required: true, durationDays: 2 }
  ]
};

function isoDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function copy(value) {
  return structuredClone(value);
}

function fail(message) {
  throw new Error(message);
}

function validISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function readState() {
  let raw;
  try {
    raw = globalThis.localStorage?.getItem(STORAGE_KEY);
  } catch (error) {
    throw new Error(`Could not read local request data: ${error.message}`);
  }
  if (!raw) return createSeed();
  try {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.requests) || !Array.isArray(data.audit)) {
      throw new Error('Stored request data has an invalid shape.');
    }
    return data;
  } catch (error) {
    throw new Error(`Could not parse local request data: ${error.message}`);
  }
}

function createSeed() {
  const now = new Date().toISOString();
  return {
    requests: [
      {
        id: 'REQ-2026-000201',
        title: 'Contract review for supplier renewal',
        description: 'Review updated commercial terms and record approval.',
        links: '',
        category: 'StandardApproval',
        department: 'PROC',
        priority: 'High',
        processingType: 'Standard',
        dueDate: isoDays(3),
        status: 'InProgress',
        pocName: CURRENT_USER.name,
        pocEmail: CURRENT_USER.email,
        createdBy: CURRENT_USER.email,
        createdAt: now,
        updatedAt: now,
        phases: [
          {
            id: 'P1',
            title: 'Manager Review',
            goal: 'Review the supplier request',
            required: true,
            durationDays: 2,
            status: 'Completed',
            assignments: [{
              id: 'ASN-201-1',
              assigneeName: 'Carla Jensen',
              assigneeEmail: 'carla.jensen@contoso.com',
              status: 'Completed',
              rerouteHistory: []
            }]
          },
          {
            id: 'P2',
            title: 'Department Approval',
            goal: 'Approve the updated terms',
            required: true,
            durationDays: 1,
            status: 'InProgress',
            assignments: [{
              id: 'ASN-201-2',
              assigneeName: 'Ben Okafor',
              assigneeEmail: 'ben.okafor@contoso.com',
              status: 'InProgress',
              rerouteHistory: []
            }]
          }
        ],
        comments: []
      },
      {
        id: 'REQ-2026-000202',
        title: 'New supplier onboarding',
        description: 'Validate compliance documents before activating the supplier.',
        links: '',
        category: 'DocumentReview',
        department: 'LEG',
        priority: 'Medium',
        processingType: 'Standard',
        dueDate: isoDays(7),
        status: 'New',
        pocName: CURRENT_USER.name,
        pocEmail: CURRENT_USER.email,
        createdBy: CURRENT_USER.email,
        createdAt: now,
        updatedAt: now,
        phases: [
          {
            id: 'P1',
            title: 'Document Check',
            goal: 'Check the submitted documents',
            required: true,
            durationDays: 2,
            status: 'NotStarted',
            assignments: [{
              id: 'ASN-202-1',
              assigneeName: 'Devin Aluko',
              assigneeEmail: 'devin.aluko@contoso.com',
              status: 'NotStarted',
              rerouteHistory: []
            }]
          },
          {
            id: 'P2',
            title: 'Legal Review',
            goal: 'Complete legal review',
            required: true,
            durationDays: 3,
            status: 'NotStarted',
            assignments: [{
              id: 'ASN-202-2',
              assigneeName: 'Alicia Moreau',
              assigneeEmail: 'alicia.moreau@contoso.com',
              status: 'NotStarted',
              rerouteHistory: []
            }]
          }
        ],
        comments: []
      }
    ],
    audit: []
  };
}

let state = readState();

function persist() {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    throw new Error(`Could not save local request data: ${error.message}`);
  }
}

function audit(request, action, detail, actor = CURRENT_USER.email) {
  state.audit.unshift({
    id: `AUD-${Date.now()}-${state.audit.length + 1}`,
    requestId: request.id,
    action,
    detail,
    actor,
    createdAt: new Date().toISOString()
  });
  request.updatedAt = new Date().toISOString();
}

function requestById(id) {
  const request = state.requests.find((item) => item.id === id);
  if (!request) fail('Request could not be found.');
  return request;
}

function canManage(request) {
  return (
    request.createdBy.toLowerCase() === CURRENT_USER.email.toLowerCase() ||
    request.pocEmail.toLowerCase() === CURRENT_USER.email.toLowerCase()
  );
}

function personFor(email) {
  const emailKey = String(email || '').trim().toLowerCase();
  const person = DIRECTORY.find((item) => item.email.toLowerCase() === emailKey);
  if (!person) fail('Choose an assignee from the local directory.');
  return person;
}

function validateLinks(value) {
  const links = String(value || '').trim();
  for (const line of links.split(/\r?\n/).filter(Boolean)) {
    let url;
    try {
      url = new URL(line);
    } catch {
      fail('Each related link must be a valid HTTP or HTTPS URL.');
    }
    if (!['http:', 'https:'].includes(url.protocol)) {
      fail('Related links must use HTTP or HTTPS.');
    }
  }
  return links;
}

function makePhases(category, overrides = []) {
  const template = TEMPLATES[category] || TEMPLATES.StandardApproval;
  const source = overrides.length ? overrides : template;
  return source.map((phase, index) => {
    const person = personFor(phase.assigneeEmail);
    return {
      id: `P${index + 1}`,
      title: String(phase.title || '').trim(),
      goal: String(phase.goal || '').trim(),
      required: phase.required !== false,
      durationDays: Math.max(0, Number(phase.durationDays) || 0),
      status: index === 0 ? 'InProgress' : 'NotStarted',
      assignments: [{
        id: `ASN-${Date.now()}-${index + 1}`,
        assigneeName: person.name,
        assigneeEmail: person.email,
        status: index === 0 ? 'InProgress' : 'NotStarted',
        rerouteHistory: []
      }]
    };
  });
}

export async function listRequests() {
  return copy(state.requests);
}

export async function getRequest(id) {
  const request = state.requests.find((item) => item.id === id);
  return request ? copy(request) : null;
}

export async function createRequest(input = {}) {
  const title = String(input.title || '').trim();
  if (!title) fail('Request title is required.');
  const category = String(input.category || '');
  if (!CATEGORY_KEYS.includes(category)) fail('Choose a valid request category.');
  const priority = String(input.priority || 'Medium');
  if (!PRIORITIES.includes(priority)) fail('Choose a valid priority.');
  const department = String(input.department || '').trim();
  if (!department) fail('Department is required.');
  const links = validateLinks(input.links);
  const dueDate = String(input.dueDate || '');
  if (dueDate && !validISODate(dueDate)) fail('Due date must be valid.');

  const request = {
    id: `REQ-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    title,
    description: String(input.description || '').trim(),
    links,
    category,
    department,
    priority,
    processingType: ['Standard', 'Expedited', 'Extended'].includes(input.processingType)
      ? input.processingType
      : 'Standard',
    dueDate: dueDate || isoDays(3),
    status: 'InProgress',
    pocName: CURRENT_USER.name,
    pocEmail: CURRENT_USER.email,
    createdBy: CURRENT_USER.email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    phases: makePhases(category, input.phases || []),
    comments: []
  };
  state.requests.unshift(request);
  audit(request, 'Created', `Request “${request.title}” created.`);
  persist();
  return copy(request);
}

export async function updateRequest(id, patch = {}) {
  const request = requestById(id);
  if (!canManage(request)) fail('You do not have permission to manage this request.');
  if (request.status === 'Completed') fail('Completed requests cannot be edited.');
  const nextTitle = patch.title === undefined ? request.title : String(patch.title).trim();
  if (!nextTitle) fail('Request title is required.');
  const nextCategory = patch.category === undefined ? request.category : String(patch.category);
  if (!CATEGORY_KEYS.includes(nextCategory)) fail('Choose a valid request category.');
  const nextPriority = patch.priority === undefined ? request.priority : String(patch.priority);
  if (!PRIORITIES.includes(nextPriority)) fail('Choose a valid priority.');
  const nextDueDate = patch.dueDate === undefined ? request.dueDate : String(patch.dueDate);
  if (nextDueDate && !validISODate(nextDueDate)) fail('Due date must be valid.');
  const nextDepartment =
    patch.department === undefined ? request.department : String(patch.department).trim();
  if (!nextDepartment) fail('Department is required.');
  const nextProcessingType =
    patch.processingType === undefined ? request.processingType : String(patch.processingType);
  if (!['Standard', 'Expedited', 'Extended'].includes(nextProcessingType)) {
    fail('Choose a valid processing type.');
  }
  Object.assign(request, {
    title: nextTitle,
    description: patch.description === undefined ? request.description : String(patch.description).trim(),
    links: patch.links === undefined ? request.links : validateLinks(patch.links),
    category: nextCategory,
    priority: nextPriority,
    dueDate: nextDueDate,
    department: nextDepartment,
    processingType: nextProcessingType,
    updatedAt: new Date().toISOString()
  });
  audit(request, 'Updated', 'Request details updated.');
  persist();
  return copy(request);
}

export async function addComment(id, text) {
  const request = requestById(id);
  if (!canManage(request)) fail('You do not have permission to comment on this request.');
  const comment = String(text || '').trim();
  if (!comment) fail('Comment cannot be empty.');
  request.comments.unshift({
    id: `CMT-${Date.now()}`,
    text: comment,
    author: CURRENT_USER.name,
    authorEmail: CURRENT_USER.email,
    createdAt: new Date().toISOString()
  });
  audit(request, 'Comment', 'Added a request comment.');
  persist();
  return copy(request.comments[0]);
}

export async function completeAssignment(requestId, assignmentId) {
  const request = requestById(requestId);
  if (!canManage(request)) fail('You do not have permission to update this request.');
  if (request.status === 'Suspended' || request.status === 'Completed') {
    fail('Assignments cannot be completed while the request is suspended or complete.');
  }
  let selectedPhase;
  let assignment;
  for (const phase of request.phases) {
    assignment = phase.assignments.find((item) => item.id === assignmentId);
    if (assignment) {
      selectedPhase = phase;
      break;
    }
  }
  if (!assignment || assignment.status !== 'InProgress' || selectedPhase.status !== 'InProgress') {
    fail('Only an assignment in the active phase can be completed.');
  }
  assignment.status = 'Completed';
  assignment.completedAt = new Date().toISOString();
  const temporary = [...(assignment.rerouteHistory || [])].reverse().find(
    (entry) => entry.mode === 'temporary' && !entry.returnedAt && !entry.endedAt
  );
  if (temporary) {
    const returnTo = assignment.rerouteReturnTo || temporary.from;
    assignment.assigneeName = returnTo.name;
    assignment.assigneeEmail = returnTo.email;
    temporary.returnedAt = new Date().toISOString();
    assignment.rerouteReturnTo = null;
  }
  selectedPhase.status = selectedPhase.assignments.every((item) => item.status === 'Completed') ? 'Completed' : 'InProgress';
  if (selectedPhase.status === 'Completed') {
    const nextPhase = request.phases.find((phase) => phase.status === 'NotStarted');
    if (nextPhase) {
      nextPhase.status = 'InProgress';
      for (const item of nextPhase.assignments) {
        if (item.status === 'NotStarted') item.status = 'InProgress';
      }
    } else if (request.phases.every((phase) => phase.status === 'Completed')) {
      request.status = 'Completed';
    }
  }
  audit(request, 'Assignment completed', `Completed phase “${selectedPhase.title}”.`);
  if (temporary) audit(request, 'Delegation returned', `Returned assignment to ${assignment.assigneeName}.`);
  persist();
  return copy(request);
}

export async function rerouteAssignments(requestId, assignmentIds, input = {}) {
  const request = requestById(requestId);
  if (!canManage(request)) fail('You do not have permission to reroute this request.');
  if (request.status === 'Suspended' || request.status === 'Completed') {
    fail('Assignments on suspended or completed requests cannot be rerouted.');
  }
  const ids = [...new Set((Array.isArray(assignmentIds) ? assignmentIds : [assignmentIds]).map(String))];
  if (!ids.length || ids.some((id) => !id)) fail('Select at least one active assignment.');
  const mode = input.mode || 'temporary';
  if (!['temporary', 'transfer'].includes(mode)) fail('Choose a valid reroute type.');
  const reason = String(input.reason || '').trim();
  if (!reason) fail('Reroute reason is required.');
  const person = personFor(input.assigneeEmail);
  const assignments = ids.map((id) => {
    const assignment = request.phases.flatMap((phase) => phase.assignments).find((item) => item.id === id);
    if (!assignment || assignment.status === 'Completed') fail('A selected assignment is no longer active.');
    if (assignment.assigneeEmail.toLowerCase() === person.email.toLowerCase()) {
      fail('The selected person already owns a selected assignment.');
    }
    return assignment;
  });

  const timestamp = new Date().toISOString();
  for (const assignment of assignments) {
    const history = assignment.rerouteHistory || [];
    for (const entry of history) {
      if (entry.mode === 'temporary' && !entry.returnedAt && !entry.endedAt) entry.endedAt = timestamp;
    }
    assignment.rerouteHistory = history;
    assignment.rerouteReturnTo =
      mode === 'temporary'
        ? assignment.rerouteReturnTo || { name: assignment.assigneeName, email: assignment.assigneeEmail }
        : null;
    assignment.rerouteHistory.push({
      mode,
      from: { name: assignment.assigneeName, email: assignment.assigneeEmail },
      to: { name: person.name, email: person.email },
      reason,
      createdAt: timestamp,
      returnedAt: null
    });
    assignment.assigneeName = person.name;
    assignment.assigneeEmail = person.email;
  }
  audit(request, mode === 'temporary' ? 'Temporary reroute' : 'Assignment transferred', `${assignments.length} assignment(s) reassigned to ${person.name}: ${reason}`);
  persist();
  return copy(request);
}

export async function saveWorkflow(requestId, phases) {
  const request = requestById(requestId);
  if (!canManage(request)) fail('You do not have permission to edit this workflow.');
  if (request.status === 'Suspended' || request.status === 'Completed') {
    fail('Workflow cannot be edited while suspended or complete.');
  }
  if (!Array.isArray(phases) || phases.length < 1 || phases.length > 20) {
    fail('A workflow must contain between 1 and 20 phases.');
  }
  const currentActive = request.phases.find((phase) => phase.status === 'InProgress');
  const normalized = phases.map((input, index) => {
    const title = String(input.title || '').trim();
    if (!title) fail(`Phase ${index + 1} needs a title.`);
    const person = personFor(input.assigneeEmail);
    const existing = request.phases.find((phase) => phase.id === input.id);
    if (existing?.status === 'Completed') {
      return { ...existing, title, goal: String(input.goal || '').trim(), durationDays: Math.max(0, Number(input.durationDays) || 0) };
    }
    if (existing && existing.status === 'InProgress' && currentActive?.id !== existing.id) {
      fail('Only the active phase can remain in progress.');
    }
    const assignment = existing?.assignments[0];
    return {
      id: existing?.id || `P${Date.now()}-${index}`,
      title,
      goal: String(input.goal || '').trim(),
      required: input.required !== false,
      durationDays: Math.max(0, Number(input.durationDays) || 0),
      status: existing?.status || 'NotStarted',
      assignments: [{
        ...(assignment || {}),
        id: assignment?.id || `ASN-${Date.now()}-${index}`,
        assigneeName: person.name,
        assigneeEmail: person.email,
        status: assignment?.status || 'NotStarted',
        rerouteHistory: assignment?.rerouteHistory || []
      }]
    };
  });
  if (currentActive && !normalized.some((phase) => phase.id === currentActive.id)) {
    fail('The active phase cannot be removed.');
  }
  const activeIndex = normalized.findIndex((phase) => phase.status === 'InProgress');
  if (activeIndex >= 0 && normalized.slice(activeIndex + 1).some((phase) => phase.status === 'Completed')) {
    fail('Completed phases must remain before the active phase.');
  }
  if (activeIndex >= 0 && normalized.slice(0, activeIndex).some((phase) => phase.status !== 'Completed')) {
    fail('Not-started phases must remain after the active phase.');
  }
  if (normalized.filter((phase) => phase.status === 'InProgress').length > 1) {
    fail('A workflow can have only one active phase.');
  }
  if (!normalized.some((phase) => phase.status === 'Completed' || phase.status === 'InProgress')) {
    normalized[0].status = 'InProgress';
    normalized[0].assignments[0].status = 'InProgress';
    request.status = 'InProgress';
  }
  request.phases = normalized;
  audit(request, 'Workflow updated', `Workflow saved with ${normalized.length} phases.`);
  persist();
  return copy(request);
}

export async function setWorkflowStatus(requestId, action) {
  const request = requestById(requestId);
  if (!canManage(request)) fail('You do not have permission to manage this workflow.');
  if (action === 'suspend') {
    if (request.status === 'Completed' || request.status === 'Suspended') fail('Request cannot be suspended in its current state.');
    request.statusBeforeSuspend = request.status;
    request.status = 'Suspended';
    const active = request.phases.find((phase) => phase.status === 'InProgress');
    active?.assignments.forEach((assignment) => {
      if (assignment.status === 'InProgress') assignment.status = 'OnHold';
    });
    audit(request, 'Workflow suspended', 'Workflow suspended by request owner.');
  } else if (action === 'resume') {
    if (request.status !== 'Suspended') fail('Only suspended requests can be resumed.');
    request.status = request.statusBeforeSuspend || 'InProgress';
    request.statusBeforeSuspend = null;
    const active = request.phases.find((phase) => phase.status === 'InProgress');
    if (active) {
      active.assignments.forEach((assignment) => {
        if (assignment.status === 'OnHold') assignment.status = 'InProgress';
      });
    }
    audit(request, 'Workflow resumed', 'Workflow resumed by request owner.');
  } else if (action === 'restart') {
    if (request.status !== 'Completed' && request.status !== 'Suspended') fail('Only completed or suspended requests can be restarted.');
    request.phases.forEach((phase, index) => {
      phase.status = index === 0 ? 'InProgress' : 'NotStarted';
      phase.assignments.forEach((assignment) => {
        assignment.status = index === 0 ? 'InProgress' : 'NotStarted';
        assignment.completedAt = null;
      });
    });
    request.status = 'InProgress';
    audit(request, 'Workflow restarted', 'Workflow restarted from the first phase.');
  } else {
    fail('Unsupported workflow action.');
  }
  persist();
  return copy(request);
}

export async function listMyAssignments(email = CURRENT_USER.email) {
  const normalizedEmail = String(email).toLowerCase();
  const result = [];
  for (const request of state.requests) {
    for (const phase of request.phases) {
      for (const assignment of phase.assignments) {
        if (assignment.assigneeEmail.toLowerCase() === normalizedEmail && assignment.status !== 'Completed') {
          result.push({
            requestId: request.id,
            requestTitle: request.title,
            requestStatus: request.status,
            phaseTitle: phase.title,
            ...copy(assignment)
          });
        }
      }
    }
  }
  return result;
}

export async function listAudit(requestId) {
  return copy(state.audit.filter((item) => item.requestId === requestId));
}

export function getWorkflowOptions() {
  return {
    categories: copy(CATEGORY_KEYS),
    priorities: copy(PRIORITIES),
    directory: copy(DIRECTORY),
    statusKeys: copy(STATUS_KEYS),
    assignmentStatus: copy(ASSIGNMENT_STATUS),
    currentDate: todayISO()
  };
}
