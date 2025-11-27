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
    if (e.target.matches('[data-lightbox-open]')) {
        const lightboxId = e.target.dataset.lightboxOpen;
        const lightbox = document.getElementById(lightboxId);
        if (lightbox) {
            lightbox.classList.add('lightbox--active');
        }
    }

    if (e.target.matches('[data-lightbox-close]') || e.target.classList.contains('lightbox')) {
        const lightbox = e.target.closest('.lightbox');
        if (lightbox) {
            lightbox.classList.remove('lightbox--active');
        }
    }
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
