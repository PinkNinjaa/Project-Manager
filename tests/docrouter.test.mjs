import assert from 'node:assert/strict';
import { test } from 'node:test';

const storage = new Map();
globalThis.localStorage = {
  getItem(key) {
    return storage.get(key) ?? null;
  },
  setItem(key, value) {
    storage.set(key, value);
  }
};

const workflow = await import('../js/docrouter-repository.js');

test('local request workflows validate progress and return temporary reroutes', async () => {
  await workflow.setWorkflowStatus('REQ-2026-000201', 'suspend');
  let suspended = await workflow.getRequest('REQ-2026-000201');
  assert.equal(suspended.status, 'Suspended');
  assert.equal(suspended.phases[1].assignments[0].status, 'OnHold');
  await workflow.setWorkflowStatus('REQ-2026-000201', 'resume');
  let resumed = await workflow.getRequest('REQ-2026-000201');
  assert.equal(resumed.status, 'InProgress');
  assert.equal(resumed.phases[1].assignments[0].status, 'InProgress');

  await assert.rejects(
    () => workflow.completeAssignment('REQ-2026-000202', 'ASN-202-2'),
    /Only an assignment in the active phase can be completed/
  );

  const firstReroute = await workflow.rerouteAssignments(
    'REQ-2026-000201',
    ['ASN-201-2'],
    {
      assigneeEmail: 'alicia.moreau@contoso.com',
      mode: 'temporary',
      reason: 'Cover the active approval'
    }
  );
  assert.equal(firstReroute.phases[1].assignments[0].assigneeEmail, 'alicia.moreau@contoso.com');

  const secondReroute = await workflow.rerouteAssignments(
    'REQ-2026-000201',
    ['ASN-201-2'],
    {
      assigneeEmail: 'grace.lin@contoso.com',
      mode: 'temporary',
      reason: 'Escalate during leave'
    }
  );
  const active = secondReroute.phases[1].assignments[0];
  assert.deepEqual(active.rerouteReturnTo, {
    name: 'Ben Okafor',
    email: 'ben.okafor@contoso.com'
  });

  const completed = await workflow.completeAssignment('REQ-2026-000201', 'ASN-201-2');
  const finishedAssignment = completed.phases[1].assignments[0];
  assert.equal(finishedAssignment.status, 'Completed');
  assert.equal(finishedAssignment.assigneeEmail, 'ben.okafor@contoso.com');
  assert.equal(finishedAssignment.rerouteReturnTo, null);
  assert.ok(finishedAssignment.rerouteHistory.at(-1).returnedAt);
  assert.equal(completed.status, 'Completed');

  const audit = await workflow.listAudit('REQ-2026-000201');
  assert.ok(audit.some((entry) => entry.action === 'Delegation returned'));

  await workflow.setWorkflowStatus('REQ-2026-000202', 'suspend');
  await workflow.setWorkflowStatus('REQ-2026-000202', 'resume');
  assert.equal((await workflow.getRequest('REQ-2026-000202')).status, 'New');
});

test('request intake validates links and creates an editable ordered workflow', async () => {
  await assert.rejects(
    () => workflow.createRequest({
      title: 'Bad link',
      category: 'StandardApproval',
      department: 'PROC',
      links: 'javascript:alert(1)'
    }),
    /Related links must use HTTP or HTTPS/
  );
  await assert.rejects(
    () => workflow.createRequest({
      title: 'Bad date',
      category: 'StandardApproval',
      department: 'PROC',
      dueDate: '2026-02-31'
    }),
    /Due date must be valid/
  );

  const request = await workflow.createRequest({
    title: '  Local request  ',
    description: 'Created in tests.',
    category: 'StandardApproval',
    department: 'PROC',
    priority: 'High',
    processingType: 'Standard',
    dueDate: '2026-12-15',
    links: 'https://example.test/request'
  });
  assert.equal(request.title, 'Local request');
  assert.equal(request.status, 'InProgress');
  assert.equal(request.phases.length, 2);

  const updated = await workflow.saveWorkflow(request.id, [
    {
      id: request.phases[0].id,
      title: 'Updated first review',
      goal: 'Review the intake',
      required: true,
      durationDays: 2,
      assigneeEmail: 'carla.jensen@contoso.com'
    },
    {
      id: request.phases[1].id,
      title: 'Second review',
      goal: 'Approve',
      required: true,
      durationDays: 1,
      assigneeEmail: 'ben.okafor@contoso.com'
    }
  ]);
  assert.equal(updated.phases[0].title, 'Updated first review');
  assert.equal(updated.phases[0].status, 'InProgress');

  await workflow.addComment(request.id, 'Reviewed locally.');
  assert.equal((await workflow.getRequest(request.id)).comments[0].text, 'Reviewed locally.');
});
