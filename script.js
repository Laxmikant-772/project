// State
let students = [];

// DOM Elements
const addStudentBtn = document.getElementById('addStudentBtn');
const studentModal = document.getElementById('studentModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const studentForm = document.getElementById('studentForm');
const studentsTableBody = document.getElementById('studentsTableBody');
const searchInput = document.getElementById('searchInput');
const emptyState = document.getElementById('emptyState');
const tableContainer = document.querySelector('.table-container');
const modalTitle = document.getElementById('modalTitle');
const editIndex = document.getElementById('editIndex');
const toast = document.getElementById('toast');
const statusFilter = document.getElementById('statusFilter');

// Mobile Menu Elements
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const sidebar = document.getElementById('sidebar');

// Navigation Elements
const loginScreen = document.getElementById('loginScreen');
const appLayout = document.getElementById('appLayout');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-section]');
const pageSections = document.querySelectorAll('.page-section');
const sharedTableContainer = document.getElementById('sharedTableContainer');

// Helpers
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}

function getInitials(name) {
    const names = name.trim().split(' ');
    if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    } else if (names.length === 1 && names[0].length > 0) {
        return (names[0][0]).toUpperCase();
    }
    return '';
}

// Initialize app
function init() {
    // Check dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        const darkModeIcon = document.querySelector('#darkModeBtn i');
        if (darkModeIcon) {
            darkModeIcon.classList.remove('fa-moon');
            darkModeIcon.classList.add('fa-sun');
        }
    }

    // Load profile data
    const savedName = localStorage.getItem('profileName');
    const savedEmail = localStorage.getItem('profileEmail');
    if (savedName && savedEmail) {
        updateProfileUI(savedName, savedEmail);
        const nameInput = document.getElementById('profileNameInput');
        const emailInput = document.getElementById('profileEmailInput');
        if (nameInput) nameInput.value = savedName;
        if (emailInput) emailInput.value = savedEmail;
    }

    // Initialize flatpickr on date input, restrict to past/today dates
    flatpickr("#date", {
        maxDate: "today",
        dateFormat: "Y-m-d", // Format saved to the script
        altInput: true,      // Creates a visible input for the user
        altFormat: "d-m-Y",  // The dd-mm-yyyy format the user sees
        allowInput: true
    });

    // Load data from LocalStorage
    const storedData = localStorage.getItem('students');
    if (storedData) {
        students = JSON.parse(storedData);
    }

    renderTable();
    setupEventListeners();
}

// Setup Event Listeners
function setupEventListeners() {
    addStudentBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Mobile menu toggles
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.add('show');
        });
    }

    if (closeSidebarBtn && sidebar) {
        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('show');
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === studentModal) {
            closeModal();
        }
    });

    studentForm.addEventListener('submit', handleFormSubmit);
    searchInput.addEventListener('input', handleSearch);
    
    const profileForm = document.getElementById('profileUpdateForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', handleSearch);
    }

    // Login/Logout Handlers
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loginScreen.classList.add('hidden-app');
            appLayout.classList.remove('hidden-app');
            showToast('Logged in successfully!');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            appLayout.classList.add('hidden-app');
            loginScreen.classList.remove('hidden-app');
            showToast('Logged out successfully!');
        });
    }

    // Navigation Handlers
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));

            // Add active class to clicked item
            item.classList.add('active');

            // Get target section
            const targetId = item.getAttribute('data-section');

            // Hide all sections
            pageSections.forEach(section => section.classList.remove('active'));

            // Show target section
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
            }

            // Show shared table container if dashboard or students is active
            if (targetId === 'dashboardSection' || targetId === 'studentsSection') {
                if (sharedTableContainer) {
                    sharedTableContainer.classList.add('active');
                }
            }

            // On mobile, close sidebar after navigation
            if (window.innerWidth <= 768 && sidebar) {
                sidebar.classList.remove('show');
            }
        });
    });

    // Dropdown Handlers
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationMenu = document.getElementById('notificationMenu');
    const userProfileBtn = document.getElementById('userProfileBtn');
    const profileMenu = document.getElementById('profileMenu');
    const dropdownLogoutBtn = document.getElementById('dropdownLogoutBtn');
    const dropdownProfileBtn = document.getElementById('dropdownProfileBtn');
    const dropdownSettingsBtn = document.getElementById('dropdownSettingsBtn');

    function toggleDropdown(menu) {
        if (menu.classList.contains('show')) {
            menu.classList.remove('show');
        } else {
            // Close others
            if (notificationMenu) notificationMenu.classList.remove('show');
            if (profileMenu) profileMenu.classList.remove('show');
            menu.classList.add('show');
        }
    }

    if (notificationBtn && notificationMenu) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(notificationMenu);
        });
    }

    if (userProfileBtn && profileMenu) {
        userProfileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(profileMenu);
        });
    }

    // Close dropdowns on outside click
    window.addEventListener('click', () => {
        if (notificationMenu) notificationMenu.classList.remove('show');
        if (profileMenu) profileMenu.classList.remove('show');
    });

    if (dropdownProfileBtn) {
        dropdownProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            pageSections.forEach(section => section.classList.remove('active'));
            const target = document.getElementById('profileSection');
            if (target) target.classList.add('active');
            if (profileMenu) profileMenu.classList.remove('show');
        });
    }

    if (dropdownSettingsBtn) {
        dropdownSettingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            pageSections.forEach(section => section.classList.remove('active'));
            const target = document.getElementById('settingsSection');
            if (target) target.classList.add('active');
            if (profileMenu) profileMenu.classList.remove('show');
        });
    }

    if (dropdownLogoutBtn) {
        dropdownLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            appLayout.classList.add('hidden-app');
            loginScreen.classList.remove('hidden-app');
            showToast('Logged out successfully!');
            if (profileMenu) profileMenu.classList.remove('show');
        });
    }
    
    // Dark Mode Toggle
    const darkModeBtn = document.getElementById('darkModeBtn');
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDark);
            
            const icon = darkModeBtn.querySelector('i');
            if (isDark) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        });
    }
}

// Update Dashboard Stats
function updateStats() {
    const total = students.length;
    const active = students.filter(s => s.status === 'Active').length;
    const graduated = students.filter(s => s.status === 'Graduated').length;
    const inactive = students.filter(s => s.status === 'Inactive').length;

    const elTotal = document.getElementById('statTotal');
    const elActive = document.getElementById('statActive');
    const elGraduated = document.getElementById('statGraduated');
    const elInactive = document.getElementById('statInactive');

    if (elTotal) elTotal.textContent = total;
    if (elActive) elActive.textContent = active;
    if (elGraduated) elGraduated.textContent = graduated;
    if (elInactive) elInactive.textContent = inactive;
}

// Render the students table
function renderTable(data = students) {
    updateStats();

    const recordCountEl = document.getElementById('recordCount');
    if (recordCountEl) recordCountEl.textContent = data.length;

    studentsTableBody.innerHTML = '';

    if (data.length === 0) {
        tableContainer.style.display = 'none';
        emptyState.classList.remove('hidden');
    } else {
        tableContainer.style.display = 'block';
        emptyState.classList.add('hidden');

        data.forEach((student, index) => {
            // Find the actual index in the main array for editing/deleting if we are filtering
            const actualIndex = students.findIndex(s => s.studentId === student.studentId);

            const tr = document.createElement('tr');

            // Format date
            const dateObj = new Date(student.date);
            const formattedDate = dateObj.toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });

            // Escape HTML for text fields
            const safeId = escapeHTML(student.studentId || '');
            const safeName = escapeHTML(student.name || '');
            const safeEmail = escapeHTML(student.email || '');
            const safeCourse = escapeHTML(student.course || '');

            const initials = getInitials(safeName);

            tr.innerHTML = `
                <td><strong>${safeId}</strong></td>
                <td>
                    <div class="student-profile">
                        <div class="avatar">${initials}</div>
                        <span>${safeName}</span>
                    </div>
                </td>
                <td>${safeEmail}</td>
                <td>${safeCourse}</td>
                <td>${formattedDate}</td>
                <td><span class="status-badge status-${student.status.toLowerCase()}">${student.status}</span></td>
                <td>
                    <button class="action-btn edit-btn" onclick="editStudent(${actualIndex})" title="Edit">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteStudent(${actualIndex})" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            studentsTableBody.appendChild(tr);
        });
    }
}

// Handle Form Submission
function handleFormSubmit(e) {
    e.preventDefault();

    const index = parseInt(editIndex.value);

    const studentData = {
        studentId: document.getElementById('studentId').value,
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        course: document.getElementById('course').value,
        date: document.getElementById('date').value,
        status: document.getElementById('status').value
    };

    // Validate that the date is not in the future
    const selectedDate = new Date(studentData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
        showToast('Date of Joining cannot be in the future!', 'error');
        return;
    }

    if (index === -1) {
        // Add new student
        // Check if ID already exists (case-insensitive)
        if (students.some(s => s.studentId.toLowerCase() === studentData.studentId.toLowerCase())) {
            showToast('Student ID already exists!', 'error');
            return;
        }
        students.push(studentData);
        showToast('Student added successfully!');
    } else {
        // Update existing student
        // Check if ID exists and is not the current student (case-insensitive)
        if (students.some((s, i) => s.studentId.toLowerCase() === studentData.studentId.toLowerCase() && i !== index)) {
            showToast('Student ID already exists!', 'error');
            return;
        }
        students[index] = studentData;
        showToast('Student updated successfully!');
    }

    saveData();
    renderTable();
    closeModal();
}

// Edit Student
window.editStudent = function (index) {
    const student = students[index];

    document.getElementById('studentId').value = student.studentId;
    document.getElementById('name').value = student.name;
    document.getElementById('email').value = student.email;
    document.getElementById('course').value = student.course;

    const dateInput = document.getElementById('date');
    dateInput.value = student.date;
    if (dateInput._flatpickr) {
        dateInput._flatpickr.setDate(student.date);
    }

    document.getElementById('status').value = student.status;

    editIndex.value = index;
    modalTitle.textContent = 'Edit Student Details';

    openModal();
}

// Delete Student
window.deleteStudent = function (index) {
    if (confirm(`Are you sure you want to delete ${students[index].name}'s record?`)) {
        students.splice(index, 1);
        saveData();

        // Re-apply search if exists
        handleSearch();

        showToast('Student deleted successfully!');
    }
}

// Search functionality
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    const currentStatus = statusFilter ? statusFilter.value : '';

    let filteredStudents = students;

    if (searchTerm !== '') {
        filteredStudents = filteredStudents.filter(student => {
            return (
                student.name.toLowerCase().includes(searchTerm) ||
                student.studentId.toLowerCase().includes(searchTerm) ||
                student.email.toLowerCase().includes(searchTerm) ||
                student.course.toLowerCase().includes(searchTerm)
            );
        });
    }

    if (currentStatus !== '') {
        filteredStudents = filteredStudents.filter(student => student.status === currentStatus);
    }

    renderTable(filteredStudents);
}

// Modal controls
function openModal() {
    studentModal.classList.add('show');
}

function closeModal() {
    studentModal.classList.remove('show');
    studentForm.reset();
    editIndex.value = -1;
    modalTitle.textContent = 'Add New Student';
}

// Data persistence
function saveData() {
    localStorage.setItem('students', JSON.stringify(students));
}

// UI Feedback
function showToast(message, type = 'success') {
    toast.textContent = message;
    if (type === 'error') {
        toast.style.backgroundColor = '#ef4444';
    } else {
        toast.style.backgroundColor = '#10b981';
    }

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Profile Updates
function updateProfileUI(name, email) {
    const initials = getInitials(name);
    
    const hn = document.getElementById('headerProfileName');
    const he = document.getElementById('headerProfileEmail');
    const ha = document.getElementById('headerProfileAvatar');
    const mn = document.getElementById('menuProfileName');
    const me = document.getElementById('menuProfileEmail');
    const pa = document.getElementById('profilePageAvatar');
    
    if (hn) hn.textContent = name;
    if (he) he.textContent = email;
    if (ha) ha.textContent = initials;
    if (mn) mn.textContent = name;
    if (me) me.textContent = email;
    if (pa) pa.textContent = initials;
}

function handleProfileSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('profileNameInput');
    const emailInput = document.getElementById('profileEmailInput');
    const passInput = document.getElementById('profilePasswordInput');
    
    if (nameInput && emailInput) {
        const newName = nameInput.value;
        const newEmail = emailInput.value;
        
        localStorage.setItem('profileName', newName);
        localStorage.setItem('profileEmail', newEmail);
        
        if (passInput && passInput.value) {
            localStorage.setItem('profilePassword', passInput.value);
            passInput.value = ''; // clear after save
        }
        
        updateProfileUI(newName, newEmail);
        showToast('Profile updated successfully!');
    }
}

// Run app
document.addEventListener('DOMContentLoaded', init);
