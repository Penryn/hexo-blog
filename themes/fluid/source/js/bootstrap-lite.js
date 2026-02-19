/* global window, document */

(function() {
  'use strict';

  function toArray(list) {
    return Array.prototype.slice.call(list || []);
  }

  function qsa(selector, root) {
    return toArray((root || document).querySelectorAll(selector));
  }

  function createEvent(name, detail) {
    try {
      return new window.CustomEvent(name, {
        bubbles   : true,
        cancelable: true,
        detail    : detail || {}
      });
    } catch (_) {
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent(name, true, true, detail || {});
      return event;
    }
  }

  function dispatchEvent(element, name, detail) {
    var event = createEvent(name, detail);
    element.dispatchEvent(event);
    return event;
  }

  function getTarget(trigger) {
    if (!trigger) return null;
    var selector = trigger.getAttribute('data-target') || trigger.getAttribute('href');
    if (!selector || selector === '#') return null;
    try {
      return document.querySelector(selector);
    } catch (_) {
      return null;
    }
  }

  function updateCollapseTrigger(target, isExpanded) {
    qsa('[data-toggle="collapse"]').forEach(function(trigger) {
      if (getTarget(trigger) !== target) return;
      trigger.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      trigger.classList.toggle('collapsed', !isExpanded);
    });
  }

  function setCollapseState(target, isExpanded) {
    if (!target) return;
    target.classList.toggle('show', !!isExpanded);
    updateCollapseTrigger(target, !!isExpanded);
  }

  function toggleCollapse(trigger) {
    var target = getTarget(trigger);
    if (!target) return;
    setCollapseState(target, !target.classList.contains('show'));
  }

  function closeDropdown(dropdown) {
    if (!dropdown) return;
    var menu = dropdown.querySelector('.dropdown-menu');
    var trigger = dropdown.querySelector('[data-toggle="dropdown"]');
    dropdown.classList.remove('show');
    if (menu) menu.classList.remove('show');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }

  function closeAllDropdowns(exceptDropdown) {
    qsa('.dropdown.show').forEach(function(dropdown) {
      if (exceptDropdown && dropdown === exceptDropdown) return;
      closeDropdown(dropdown);
    });
  }

  function toggleDropdown(trigger) {
    var dropdown = trigger.closest('.dropdown');
    if (!dropdown) return;
    var menu = dropdown.querySelector('.dropdown-menu');
    if (!menu) return;
    var isOpen = dropdown.classList.contains('show') || menu.classList.contains('show');
    closeAllDropdowns(dropdown);
    if (isOpen) {
      closeDropdown(dropdown);
      return;
    }
    dropdown.classList.add('show');
    menu.classList.add('show');
    trigger.setAttribute('aria-expanded', 'true');
  }

  function getOpenedModal() {
    return document.querySelector('.modal.show');
  }

  function getBackdrop() {
    return document.querySelector('.modal-backdrop');
  }

  function ensureBackdrop() {
    var backdrop = getBackdrop();
    if (backdrop) return backdrop;
    backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade show';
    document.body.appendChild(backdrop);
    return backdrop;
  }

  function cleanupBackdrop() {
    if (getOpenedModal()) return;
    var backdrop = getBackdrop();
    if (backdrop) backdrop.remove();
    document.body.classList.remove('modal-open');
  }

  function openModal(modal, trigger) {
    if (!modal || modal.classList.contains('show')) return;
    var showEvent = dispatchEvent(modal, 'show.bs.modal', { relatedTarget: trigger || null });
    if (showEvent.defaultPrevented) return;

    var current = getOpenedModal();
    if (current && current !== modal) {
      closeModal(current, null, true);
    }

    ensureBackdrop();
    document.body.classList.add('modal-open');
    modal.style.display = 'block';
    modal.classList.add('show');
    modal.setAttribute('aria-modal', 'true');
    modal.removeAttribute('aria-hidden');

    window.requestAnimationFrame(function() {
      dispatchEvent(modal, 'shown.bs.modal', { relatedTarget: trigger || null });
    });
  }

  function closeModal(modal, trigger, silent) {
    if (!modal || !modal.classList.contains('show')) return;

    if (!silent) {
      var hideEvent = dispatchEvent(modal, 'hide.bs.modal', { relatedTarget: trigger || null });
      if (hideEvent.defaultPrevented) return;
    }

    modal.classList.remove('show');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    modal.removeAttribute('aria-modal');
    cleanupBackdrop();

    if (!silent) {
      dispatchEvent(modal, 'hidden.bs.modal', { relatedTarget: trigger || null });
    }
  }

  function initCollapseState() {
    qsa('[data-toggle="collapse"]').forEach(function(trigger) {
      var target = getTarget(trigger);
      if (!target) return;
      var expanded = target.classList.contains('show');
      trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      trigger.classList.toggle('collapsed', !expanded);
    });
    qsa('.modal').forEach(function(modal) {
      if (!modal.classList.contains('show')) {
        modal.style.display = 'none';
      }
    });
  }

  document.addEventListener('click', function(event) {
    var dropdownTrigger = event.target.closest('[data-toggle="dropdown"]');
    if (dropdownTrigger) {
      event.preventDefault();
      toggleDropdown(dropdownTrigger);
      return;
    }

    var collapseTrigger = event.target.closest('[data-toggle="collapse"]');
    if (collapseTrigger) {
      event.preventDefault();
      toggleCollapse(collapseTrigger);
      return;
    }

    var modalTrigger = event.target.closest('[data-toggle="modal"]');
    if (modalTrigger) {
      event.preventDefault();
      var target = getTarget(modalTrigger);
      if (target && target.classList.contains('modal')) {
        openModal(target, modalTrigger);
      }
      return;
    }

    var dismissTrigger = event.target.closest('[data-dismiss="modal"]');
    if (dismissTrigger) {
      event.preventDefault();
      closeModal(dismissTrigger.closest('.modal'), dismissTrigger, false);
      return;
    }

    var modal = event.target.classList && event.target.classList.contains('modal')
      ? event.target
      : null;
    if (modal && modal.classList.contains('show')) {
      closeModal(modal, null, false);
      return;
    }

    if (event.target.closest('.dropdown-item')) {
      closeAllDropdowns();
      return;
    }
    if (!event.target.closest('.dropdown')) {
      closeAllDropdowns();
    }
  }, false);

  document.addEventListener('keydown', function(event) {
    if (event.key !== 'Escape' && event.keyCode !== 27) return;
    closeAllDropdowns();
    closeModal(getOpenedModal(), null, false);
  }, false);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCollapseState, { once: true });
  } else {
    initCollapseState();
  }
})();
