/**
 * StudyBuddy Core Frontend Application Logic
 * Theme management, modals, toasts, bookmarks, and UI helpers
 */

(function () {
  'use strict';

  // --- Theme Management ---
  const THEME_KEY = 'studybuddy_theme';

  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'system';
    applyTheme(savedTheme, false);
  }

  function applyTheme(theme, save = true) {
    if (save) localStorage.setItem(THEME_KEY, theme);

    let effectiveTheme = theme;
    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = systemDark ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', effectiveTheme);

    // Update icons on toggle buttons
    const toggles = document.querySelectorAll('.theme-toggle-btn');
    toggles.forEach(btn => {
      const icon = btn.querySelector('i');
      if (icon) {
        if (effectiveTheme === 'dark') {
          icon.className = 'fas fa-sun';
          btn.setAttribute('title', 'Switch to light mode');
        } else {
          icon.className = 'fas fa-moon';
          btn.setAttribute('title', 'Switch to dark mode');
        }
      }
    });
  }

  window.toggleTheme = function () {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
    window.showToast(`Switched to ${next} theme`, 'info');
  };

  // Listen for OS theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem(THEME_KEY) === 'system') {
      applyTheme('system', false);
    }
  });

  // --- Mobile Drawer ---
  window.toggleSidebar = function () {
    const sidebar = document.getElementById('appSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
  };

  // --- Toast Notifications ---
  window.showToast = function (message, type = 'info', duration = 3500) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-info-circle text-info';
    if (type === 'success') iconClass = 'fa-check-circle text-success';
    if (type === 'error' || type === 'danger') iconClass = 'fa-exclamation-circle text-danger';
    if (type === 'warning') iconClass = 'fa-exclamation-triangle text-warning';

    toast.innerHTML = `
      <i class="fas ${iconClass} mt-1"></i>
      <div style="flex: 1; font-size: 0.875rem; font-weight: 500;">${message}</div>
      <button type="button" style="background:none; border:none; cursor:pointer; color:var(--text-light);" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  };

  // --- Dropdown Management ---
  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-dropdown-toggle]');
    const allDropdowns = document.querySelectorAll('.dropdown-menu');

    if (toggle) {
      e.preventDefault();
      const targetId = toggle.getAttribute('data-dropdown-toggle');
      const targetMenu = document.getElementById(targetId);
      
      allDropdowns.forEach(menu => {
        if (menu !== targetMenu) menu.classList.remove('show');
      });

      if (targetMenu) targetMenu.classList.toggle('show');
    } else {
      if (!e.target.closest('.dropdown-menu')) {
        allDropdowns.forEach(menu => menu.classList.remove('show'));
      }
    }
  });

  // --- Password Visibility Toggle ---
  window.togglePasswordVisibility = function (inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
    }
  };

  // --- Bookmark Toggle API ---
  window.toggleBookmark = async function (resourceId, buttonElement) {
    try {
      const response = await fetch(`/api/bookmarks/${resourceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();

      if (response.ok) {
        const isBookmarked = data.bookmarked;
        const icon = buttonElement.querySelector('i');
        if (icon) {
          icon.className = isBookmarked ? 'fas fa-bookmark text-primary' : 'far fa-bookmark';
        }
        buttonElement.classList.toggle('active', isBookmarked);
        window.showToast(data.message || (isBookmarked ? 'Saved to Library' : 'Removed from Library'), 'success');

        // Optional update badge count if library count element exists
        const countEl = document.getElementById('userSavedCount');
        if (countEl && typeof data.savedCount === 'number') {
          countEl.textContent = data.savedCount;
        }
      } else {
        window.showToast(data.error || 'Failed to update bookmark', 'error');
      }
    } catch (err) {
      console.error('Bookmark error:', err);
      window.showToast('Network error while saving bookmark', 'error');
    }
  };

  // Run on DOM load
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
  });
})();
