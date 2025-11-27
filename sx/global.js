// Accordion functionality
const accordionItems = document.querySelectorAll('.accordion__item');
accordionItems.forEach(item => {
    const header = item.querySelector('.accordion__header');
    header.addEventListener('click', () => {
        item.classList.toggle('accordion__item--active');
    });
});

// Modal functionality
const openModalButtons = document.querySelectorAll('[data-modal-open]');
const closeModalButtons = document.querySelectorAll('[data-modal-close]');

openModalButtons.forEach(button => {
    button.addEventListener('click', () => {
        const modal = document.querySelector('#' + button.dataset.modalOpen);
        openModal(modal);
    });
});

closeModalButtons.forEach(button => {
    button.addEventListener('click', () => {
        const modal = button.closest('.modal');
        closeModal(modal);
    });
});

function openModal(modal) {
    if (modal == null) return;
    modal.classList.add('modal--active');
}

function closeModal(modal) {
    if (modal == null) return;
    modal.classList.remove('modal--active');
}

// Tabs functionality
const tabs = document.querySelectorAll('.tab');
const tabPanes = document.querySelectorAll('.tab-pane');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = document.querySelector('#' + tab.dataset.tab);

        tabs.forEach(t => t.classList.remove('tab--active'));
        tab.classList.add('tab--active');

        tabPanes.forEach(pane => pane.classList.remove('tab-pane--active'));
        target.classList.add('tab-pane--active');
    });
});

// Expandable table functionality
document.querySelectorAll('[data-expandable]').forEach(table => {
    table.querySelectorAll('.table-row--expandable').forEach(row => {
        row.addEventListener('click', () => {
            row.classList.toggle('expanded');
            const contentRow = row.nextElementSibling;
            if (contentRow && contentRow.classList.contains('table-row--expanded-content')) {
                contentRow.classList.toggle('is-visible');
            }
        });
    });
});

// Theme toggle, color controls, etc.

// Carousel functionality
document.querySelectorAll('.carousel').forEach(carousel => {
    const track = carousel.querySelector('.carousel-track');
    if (!track) return;

    const slides = Array.from(track.children);
    const nextButton = carousel.querySelector('.carousel-btn.next');
    const prevButton = carousel.querySelector('.carousel-btn.prev');
    const pagination = carousel.querySelector('.carousel-pagination');
    let index = 0;

    function updateCarousel() {
        const targetSlide = slides[index];
        if (!targetSlide) return;
        track.style.transform = `translateX(-${targetSlide.offsetLeft}px)`;

        if (pagination) {
            Array.from(pagination.children).forEach((dot, dotIndex) => {
                dot.classList.toggle('active', dotIndex === index);
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
            dot.classList.add('carousel-dot');
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
    if (e.target.matches('[data-lightbox-open]')) {
        const lightboxId = e.target.dataset.lightboxOpen;
        const lightbox = document.getElementById(lightboxId);
        if (lightbox) {
            lightbox.classList.add('active');
        }
    }

    if (e.target.matches('[data-lightbox-close]') || e.target.classList.contains('lightbox-overlay')) {
        const lightbox = e.target.closest('.lightbox-overlay');
        if (lightbox) {
            lightbox.classList.remove('active');
        }
    }
});

// Simplified Popover and Dropdown functionality
document.addEventListener('click', e => {
    const dropdownToggle = e.target.closest('.dropdown__toggle');
    const popoverToggle = e.target.closest('[data-popover-open]');

    const activeDropdown = document.querySelector('.dropdown--active');
    const activePopover = document.querySelector('.popover.active');

    // --- Handle Clicks Outside of active components ---
    if (!dropdownToggle && !popoverToggle) {
        if (activeDropdown && !activeDropdown.contains(e.target)) {
            activeDropdown.classList.remove('dropdown--active');
        }
        if (activePopover && !activePopover.closest('.popover-container').contains(e.target)) {
            activePopover.classList.remove('active');
        }
        return;
    }

    // --- Handle Clicks on Toggles ---
    if (dropdownToggle) {
        const currentDropdown = dropdownToggle.closest('.dropdown');
        const wasActive = currentDropdown.classList.contains('dropdown--active');

        // First, close everything
        if (activeDropdown) activeDropdown.classList.remove('dropdown--active');
        if (activePopover) activePopover.classList.remove('active');

        // If the clicked one wasn't the one that was active, open it
        if (!wasActive) {
            currentDropdown.classList.add('dropdown--active');
        }
    }

    if (popoverToggle) {
        const popoverId = popoverToggle.dataset.popoverOpen;
        const currentPopover = document.getElementById(popoverId);
        const wasActive = currentPopover?.classList.contains('active');

        // First, close everything
        if (activeDropdown) activeDropdown.classList.remove('dropdown--active');
        if (activePopover) activePopover.classList.remove('active');

        // If the clicked one wasn't the one that was active, open it
        if (currentPopover && !wasActive) {
            currentPopover.classList.add('active');
        }
    }
});
