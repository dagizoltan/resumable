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
