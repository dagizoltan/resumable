// Accordion functionality
const accordionItems = document.querySelectorAll('.accordion__item');
accordionItems.forEach(item => {
    const header = item.querySelector('.accordion__header');
    header.addEventListener('click', () => {
        item.classList.toggle('accordion__item--active');
    });
});

// Dropdown functionality
const dropdowns = document.querySelectorAll('.dropdown');
dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown__toggle');
    toggle.addEventListener('click', () => {
        dropdown.classList.toggle('dropdown--active');
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
                if (contentRow.style.display === 'table-row') {
                    contentRow.style.display = 'none';
                } else {
                    contentRow.style.display = 'table-row';
                }
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
        // slides can be different widths, get the width of the current slide's container
        const slideWidth = carousel.offsetWidth;
        track.style.transform = `translateX(-${index * slideWidth}px)`;

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
