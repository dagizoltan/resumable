// Tabs functionality
const tabs = document.querySelectorAll('.tab');
const tabPanes = document.querySelectorAll('.tab__pane');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = document.querySelector('#' + tab.dataset.tab);

        tabs.forEach(t => t.classList.remove('tab--active'));
        tab.classList.add('tab--active');

        tabPanes.forEach(pane => pane.classList.remove('tab__pane--active'));
        target.classList.add('tab__pane--active');
    });
});

// Expandable table functionality
document.querySelectorAll('[data-expandable]').forEach(table => {
    table.querySelectorAll('.table-row--expandable').forEach(row => {
        row.addEventListener('click', () => {
            row.classList.toggle('table-row--expanded');
            const contentRow = row.nextElementSibling;
            if (contentRow && contentRow.classList.contains('table-row--expanded-content')) {
                contentRow.classList.toggle('table-row--visible');
            }
        });
    });
});

// Carousel functionality
document.querySelectorAll('.carousel').forEach(carousel => {
    const track = carousel.querySelector('.carousel__track');
    if (!track) return;

    const slides = Array.from(track.children);
    const nextButton = carousel.querySelector('.carousel__btn.next');
    const prevButton = carousel.querySelector('.carousel__btn.prev');
    const pagination = carousel.querySelector('.carousel__pagination');
    let index = 0;

    function updateCarousel() {
        const targetSlide = slides[index];
        if (!targetSlide) return;
        track.style.transform = `translateX(-${targetSlide.offsetLeft}px)`;

        if (pagination) {
            Array.from(pagination.children).forEach((dot, dotIndex) => {
                dot.classList.toggle('carousel__dot--active', dotIndex === index);
            });
        }
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            index = (index + 1) % slides.length;
            updateCarousel();
        });
    }

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            index = (index - 1 + slides.length) % slides.length;
            updateCarousel();
        });
    }

    if (pagination) {
        // Clear existing dots
        pagination.innerHTML = '';
        // Create dots
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.classList.add('carousel__dot');
            dot.addEventListener('click', () => {
                index = i;
                updateCarousel();
            });
            pagination.appendChild(dot);
        });
    }

    // Set initial state
    updateCarousel();

    // Recalculate on resize
    window.addEventListener('resize', updateCarousel);
});

// Lightbox functionality
document.addEventListener('click', (e) => {
    // Use closest to handle clicks on children of triggers
    const openTrigger = e.target.closest('[data-lightbox-open]');
    if (openTrigger) {
        const lightboxId = openTrigger.dataset.lightboxOpen;
        const lightbox = document.getElementById(lightboxId);
        if (lightbox) {
            lightbox.classList.add('lightbox--active');
        }
    }

    const closeTrigger = e.target.closest('[data-lightbox-close]');
    if (closeTrigger || e.target.classList.contains('lightbox')) {
        const lightbox = e.target.closest('.lightbox') || e.target;
        if (lightbox && lightbox.classList.contains('lightbox')) {
            lightbox.classList.remove('lightbox--active');
        }
    }
});

// Tooltip Functionality
document.addEventListener('mouseover', (e) => {
    const trigger = e.target.closest('[data-tooltip]');
    if (!trigger) return;

    let tooltip = document.getElementById('global-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'global-tooltip';
        tooltip.className = 'tooltip';
        document.body.appendChild(tooltip);
    }

    tooltip.textContent = trigger.dataset.tooltip;
    tooltip.classList.add('tooltip--active');

    const rect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    // Position above center by default
    let top = rect.top - tooltipRect.height - 8;
    let left = rect.left + (rect.width - tooltipRect.width) / 2;

    // Boundary check (simple)
    if (top < 0) top = rect.bottom + 8; // Flip to bottom
    if (left < 0) left = 8; // Left edge
    if (left + tooltipRect.width > window.innerWidth) left = window.innerWidth - tooltipRect.width - 8; // Right edge

    tooltip.style.top = `${top + window.scrollY}px`;
    tooltip.style.left = `${left + window.scrollX}px`;
});

document.addEventListener('mouseout', (e) => {
    const trigger = e.target.closest('[data-tooltip]');
    if (trigger) {
        const tooltip = document.getElementById('global-tooltip');
        if (tooltip) {
            tooltip.classList.remove('tooltip--active');
        }
    }
});

// Dropdown/Details "Click Outside to Close"
document.addEventListener('click', (e) => {
    // Select all open details elements
    const openDetails = document.querySelectorAll('details[open]');

    openDetails.forEach(details => {
        // If the click is NOT inside the details element, close it
        if (!details.contains(e.target)) {
            details.removeAttribute('open');
        }
    });
});

// Popover functionality
document.addEventListener('click', e => {
    const popoverToggle = e.target.closest('[data-popover-open]');
    const activePopover = document.querySelector('.popover--active');

    // --- Handle Clicks Outside of active components ---
    if (!popoverToggle) {
        if (activePopover && !activePopover.closest('.popover-container').contains(e.target)) {
            activePopover.classList.remove('popover--active');
        }
        return;
    }

    if (popoverToggle) {
        const popoverId = popoverToggle.dataset.popoverOpen;
        const currentPopover = document.getElementById(popoverId);
        const wasActive = currentPopover?.classList.contains('popover--active');

        // First, close everything
        if (activePopover) activePopover.classList.remove('popover--active');

        // If the clicked one wasn't the one that was active, open it
        if (currentPopover && !wasActive) {
            currentPopover.classList.add('popover--active');
        }
    }
});

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', newTheme);
    });
}

// Sidebar (Drawer) functionality (for index.html)
document.addEventListener('click', (e) => {
    // Open Sidebar (Drawer Mode)
    const openTrigger = e.target.closest('[data-sidebar-open]');
    if (openTrigger) {
        const sidebarId = openTrigger.dataset.sidebarOpen;
        const sidebar = document.getElementById(sidebarId);
        if (sidebar) {
            sidebar.classList.add('sidebar--open');
            const overlay = document.querySelector(`[data-sidebar-overlay="${sidebarId}"]`) || document.querySelector('.sidebar-overlay');
            if (overlay) overlay.classList.add('sidebar-overlay--open');
        }
    }

    // Close Sidebar (Drawer Mode)
    const closeTrigger = e.target.closest('[data-sidebar-close]');
    if (closeTrigger || e.target.classList.contains('sidebar-overlay')) {
        const sidebar = document.querySelector('.sidebar--open');
        const overlay = document.querySelector('.sidebar-overlay--open');
        if (sidebar) sidebar.classList.remove('sidebar--open');
        if (overlay) overlay.classList.remove('sidebar-overlay--open');
    }
});

// Sidebar Collapse Functionality (App Mode)
const sidebarToggle = document.getElementById('sidebar-toggle');
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        const sidebar = document.getElementById('app-sidebar');
        const body = document.body;
        if (sidebar) {
            sidebar.classList.toggle('sidebar--collapsed');
            body.classList.toggle('sidebar-collapsed');
        }
    });
}


// Toast Functionality
window.toast = {
    show(message, type = 'info', title = null) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;

        // Icon mapping
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
        };

        const iconDiv = document.createElement('div');
        iconDiv.className = 'toast__icon';
        iconDiv.innerHTML = icons[type] || icons.info;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'toast__content';

        if (title) {
            const titleDiv = document.createElement('div');
            titleDiv.className = 'toast__title';
            titleDiv.textContent = title;
            contentDiv.appendChild(titleDiv);
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = 'toast__message';
        messageDiv.textContent = message;
        contentDiv.appendChild(messageDiv);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast__close';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

        toast.appendChild(iconDiv);
        toast.appendChild(contentDiv);
        toast.appendChild(closeBtn);

        const closeToast = () => {
             toast.classList.add('toast--hiding');
             toast.addEventListener('animationend', () => {
                 if (toast.parentNode) toast.parentNode.removeChild(toast);
             });
        };

        closeBtn.onclick = closeToast;

        setTimeout(() => {
            if (document.body.contains(toast)) {
                closeToast();
            }
        }, 5000);

        container.appendChild(toast);
    }
};

// Global Interactive Tag Dismissal
document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('.tag__close');
    if (closeBtn) {
        const tag = closeBtn.closest('.tag');
        if (tag) {
            tag.remove();
        }
    }
});

// Advanced Table Selection & Bulk Actions
document.addEventListener('change', (e) => {
    if (e.target.classList.contains('table-checkbox')) {
        const checkbox = e.target;
        const row = checkbox.closest('tr');

        if (row) {
            if (checkbox.checked) {
                row.classList.add('row--selected');
            } else {
                row.classList.remove('row--selected');
            }
        }

        updateBulkActions();
    }
});

function updateBulkActions() {
    const table = document.querySelector('.table'); // Scoped to first table for demo
    if (!table) return;

    const checkedCount = table.querySelectorAll('.table-checkbox:checked').length;
    const bulkBar = document.getElementById('bulk-actions');
    const countSpan = document.getElementById('bulk-actions-count');

    if (bulkBar && countSpan) {
        if (checkedCount > 0) {
            bulkBar.classList.add('bulk-actions-bar--visible');
            countSpan.textContent = `${checkedCount} Selected`;
        } else {
            bulkBar.classList.remove('bulk-actions-bar--visible');
        }
    }
}
