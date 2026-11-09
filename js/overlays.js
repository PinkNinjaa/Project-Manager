/**
 * Modal, confirmation, and toast helpers.
 *
 * These own the small amount of global overlay state. Views use the versions
 * exposed on the app context instead of touching the DOM roots directly.
 */

import { icon } from './components/icons.js';
import { escapeHtml } from './components/ui.js';

let activeModal = null;
let toastCounter = 0;

function elements() {
  return {
    root: document.getElementById('modal-root'),
    backdrop: document.getElementById('backdrop')
  };
}

function focusFirst(container) {
  const target = container.querySelector(
    'input:not([type="hidden"]), select, textarea, button, [href], [tabindex]:not([tabindex="-1"])'
  );
  if (target) target.focus({ preventScroll: true });
}

export function openModal({
  title,
  subtitle = '',
  body,
  footer = '',
  size = '',
  footerSplit = false,
  onMount,
  onClose
}) {
  const { root, backdrop } = elements();
  if (!root || !backdrop) return () => {};

  closeModal({ restoreFocus: false });

  const previouslyFocused = document.activeElement;
  const sizeClass = size ? ` modal--${size}` : '';
  root.classList.add('modal-root');
  root.innerHTML = `<div class="modal${sizeClass}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="modal__head">
      <div>
        <h2 class="modal__title" id="modal-title">${escapeHtml(title)}</h2>
        ${subtitle ? `<p class="modal__sub">${escapeHtml(subtitle)}</p>` : ''}
      </div>
      <button class="icon-btn" type="button" data-modal-close aria-label="Close dialog">${icon('x')}</button>
    </div>
    <div class="modal__body">${body}</div>
    ${footer ? `<div class="modal__foot${footerSplit ? ' modal__foot--split' : ''}">${footer}</div>` : ''}
  </div>`;

  backdrop.hidden = false;
  document.body.classList.add('modal-open');

  const modal = root.querySelector('.modal');
  const close = (options = {}) => closeModal(options);

  activeModal = {
    close,
    previouslyFocused,
    onClose,
    root,
    backdrop
  };

  root.onclick = (event) => {
    if (event.target === root || event.target.closest('[data-modal-close]')) {
      event.preventDefault();
      close();
    }
  };

  backdrop.onclick = () => close();

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== 'Tab' || !modal) return;

    const focusable = [...modal.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter((element) => element.offsetParent !== null);

    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  document.addEventListener('keydown', onKeyDown);
  activeModal.onKeyDown = onKeyDown;

  if (modal) {
    onMount?.(modal, close);
    queueMicrotask(() => focusFirst(modal));
  }

  return close;
}

export function closeModal({ restoreFocus = true } = {}) {
  if (!activeModal) return;

  const current = activeModal;
  activeModal = null;
  document.removeEventListener('keydown', current.onKeyDown);
  current.root.onclick = null;
  current.root.innerHTML = '';
  current.backdrop.onclick = null;
  current.backdrop.hidden = true;
  document.body.classList.remove('modal-open');

  if (restoreFocus && current.previouslyFocused instanceof HTMLElement) {
    current.previouslyFocused.focus({ preventScroll: true });
  }

  current.onClose?.();
}

export function confirmDialog({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm
}) {
  const confirmClass = tone === 'danger' ? 'btn--danger-solid' : 'btn--primary';
  openModal({
    title,
    size: 'sm',
    body: `<p class="text-muted">${escapeHtml(message)}</p>`,
    footer: `<button class="btn btn--secondary" type="button" data-modal-close>${escapeHtml(
      cancelLabel
    )}</button>
      <button class="btn ${confirmClass}" type="button" data-confirm-action>${escapeHtml(
        confirmLabel
      )}</button>`,
    onMount(modal, close) {
      const button = modal.querySelector('[data-confirm-action]');
      button?.addEventListener('click', async () => {
        button.disabled = true;
        try {
          await onConfirm?.();
          close();
        } catch (error) {
          button.disabled = false;
          toast(error?.message || 'Something went wrong.', 'danger');
        }
      });
    }
  });
}

export function toast(message, tone = 'success', { duration = 4500 } = {}) {
  const stack = document.getElementById('toast-root');
  if (!stack) return;

  const iconName =
    tone === 'danger' || tone === 'warning' ? 'alert-triangle' : tone === 'success' ? 'check-circle' : 'info';
  const element = document.createElement('div');
  element.className = `toast toast--${tone}`;
  element.dataset.toastId = String(++toastCounter);
  element.innerHTML = `${icon(iconName)}<div class="toast__body">${escapeHtml(message)}</div>
    <button class="toast__close" type="button" aria-label="Dismiss notification">${icon('x')}</button>`;

  const remove = () => {
    element.remove();
  };

  element.querySelector('.toast__close')?.addEventListener('click', remove);
  stack.append(element);
  window.setTimeout(remove, duration);
}
