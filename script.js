// ==========================================
// STATE MANAGEMENT & LOCAL STORAGE
// ==========================================
let state = {
    students: [],
    courses: [],
    enrollments: [],
    attendance: [],
    fees: [],
    activities: [],
    profile: { name: 'Administrator', email: 'admin@edumanage.com', phone: '+1 234 567 8900' },
    settings: { darkMode: false }
};

const defaultCourses = [
    { id: 'C001', name: 'Computer Science', code: 'CS101', fee: 5000, desc: 'Intro to programming and logic.' },
    { id: 'C002', name: 'Business Administration', code: 'BBA201', fee: 4500, desc: 'Core business principles.' }
];

function loadData() {
    const s = localStorage.getItem('students');
    state.students = s ? JSON.parse(s) : [];
    
    const c = localStorage.getItem('courses');
    state.courses = c ? JSON.parse(c) : defaultCourses;
    
    const e = localStorage.getItem('enrollments');
    state.enrollments = e ? JSON.parse(e) : [];
    
    const a = localStorage.getItem('attendance');
    state.attendance = a ? JSON.parse(a) : [];
    
    const f = localStorage.getItem('fees');
    state.fees = f ? JSON.parse(f) : [];
    
    const act = localStorage.getItem('activities');
    state.activities = act ? JSON.parse(act) : [];

    const prof = localStorage.getItem('profile');
    if (prof) state.profile = JSON.parse(prof);

    const set = localStorage.getItem('settings');
    if (set) state.settings = JSON.parse(set);
}

function saveData(key) {
    if(key) {
        localStorage.setItem(key, JSON.stringify(state[key]));
    } else {
        localStorage.setItem('students', JSON.stringify(state.students));
        localStorage.setItem('courses', JSON.stringify(state.courses));
        localStorage.setItem('enrollments', JSON.stringify(state.enrollments));
        localStorage.setItem('attendance', JSON.stringify(state.attendance));
        localStorage.setItem('fees', JSON.stringify(state.fees));
        localStorage.setItem('activities', JSON.stringify(state.activities));
        localStorage.setItem('profile', JSON.stringify(state.profile));
        localStorage.setItem('settings', JSON.stringify(state.settings));
    }
}

function logActivity(message, iconClass) {
    state.activities.unshift({
        message,
        icon: iconClass || 'fa-solid fa-circle-info',
        time: new Date().toISOString()
    });
    if (state.activities.length > 10) state.activities.pop();
    saveData('activities');
    renderActivities();
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function escapeHTML(str) {
    if(!str) return '';
    return str.toString().replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}

function getInitials(name) {
    if(!name) return 'U';
    const names = name.trim().split(' ');
    if (names.length >= 2) return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    return (names[0][0]).toUpperCase();
}

function formatDate(dateString) {
    if(!dateString) return '-';
    const opts = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', opts);
}

function generateId(prefix) {
    return prefix + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// ==========================================
// TOASTS & CONFIRM DIALOG
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-check-circle';
    if(type === 'error') icon = 'fa-circle-xmark';
    if(type === 'warning') icon = 'fa-triangle-exclamation';
    if(type === 'info') icon = 'fa-circle-info';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHTML(message)}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

let confirmActionCallback = null;
function confirmAction(title, message, btnText, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmActionBtn').textContent = btnText;
    confirmActionCallback = callback;
    document.getElementById('confirmDialog').classList.add('show');
}

// ==========================================
// DOM ELEMENTS & EVENT LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initTheme();
    initPlugins();
    setupNavigation();
    setupDropdowns();
    setupModals();
    setupForms();
    renderAll();
    
    // Auth logic
    const loginForm = document.getElementById('loginForm');
    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginBtn');
            btn.querySelector('.btn-text').style.display = 'none';
            btn.querySelector('.btn-spinner').style.display = 'inline-block';
            setTimeout(() => {
                document.getElementById('loginScreen').classList.add('hidden-app');
                document.getElementById('appLayout').classList.remove('hidden-app');
                initCharts(); // init charts once visible
                showToast('Logged in successfully', 'success');
            }, 800);
        });
    }

    const togglePw = document.getElementById('togglePasswordBtn');
    if (togglePw) {
        togglePw.addEventListener('click', () => {
            const pwInput = document.getElementById('loginPassword');
            if (pwInput.type === 'password') {
                pwInput.type = 'text';
                togglePw.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
            } else {
                pwInput.type = 'password';
                togglePw.innerHTML = '<i class="fa-solid fa-eye"></i>';
            }
        });
    }

    document.getElementById('dropdownLogoutBtn').addEventListener('click', () => {
        document.getElementById('appLayout').classList.add('hidden-app');
        document.getElementById('loginScreen').classList.remove('hidden-app');
        showToast('Logged out successfully', 'info');
    });

    // Profile sync
    updateProfileUI();

    // Confirm dialog actions
    document.getElementById('confirmCancelBtn').addEventListener('click', () => {
        document.getElementById('confirmDialog').classList.remove('show');
        confirmActionCallback = null;
    });
    document.getElementById('confirmActionBtn').addEventListener('click', () => {
        if(confirmActionCallback) confirmActionCallback();
        document.getElementById('confirmDialog').classList.remove('show');
    });
    
    // Clear data
    document.getElementById('clearDataBtn').addEventListener('click', () => {
        confirmAction('Clear All Data', 'This action will permanently delete all students, courses, fees, and records. Are you absolutely sure?', 'Yes, Clear All', () => {
            localStorage.clear();
            loadData();
            renderAll();
            showToast('All data cleared successfully', 'success');
        });
    });

    // Export Students
    document.getElementById('exportStudentsBtn').addEventListener('click', exportStudentsCSV);
    // Print Students
    document.getElementById('printStudentsBtn').addEventListener('click', () => window.print());
});

function initTheme() {
    const toggle = document.getElementById('settingsDarkMode');
    if(state.settings.darkMode) {
        document.body.classList.add('dark-mode');
        if(toggle) toggle.checked = true;
    }
    if(toggle) {
        toggle.addEventListener('change', (e) => {
            state.settings.darkMode = e.target.checked;
            document.body.classList.toggle('dark-mode', state.settings.darkMode);
            saveData('settings');
            updateChartColors();
        });
    }
}

function initPlugins() {
    flatpickr("#dob", { dateFormat: "Y-m-d", maxDate: "today" });
    flatpickr("#date", { dateFormat: "Y-m-d", maxDate: "today", defaultDate: "today" });
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.page-section');
    const sidebar = document.getElementById('sidebar');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            const targetId = item.getAttribute('data-section');
            sections.forEach(s => s.classList.remove('active'));
            const target = document.getElementById(targetId);
            if(target) target.classList.add('active');
            
            if(window.innerWidth <= 768) sidebar.classList.remove('show');
        });
    });

    document.getElementById('mobileMenuBtn').addEventListener('click', () => sidebar.classList.add('show'));
    document.getElementById('closeSidebarBtn').addEventListener('click', () => sidebar.classList.remove('show'));

    document.getElementById('dropdownProfileBtn').addEventListener('click', () => navigateTo('profileSection'));
    document.getElementById('dropdownSettingsBtn').addEventListener('click', () => navigateTo('settingsSection'));
}

function navigateTo(sectionId) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    const sec = document.getElementById(sectionId);
    if(sec) sec.classList.add('active');
    document.getElementById('profileMenu').classList.remove('show');
}

function setupDropdowns() {
    const nBtn = document.getElementById('notificationBtn');
    const nMenu = document.getElementById('notificationMenu');
    const pBtn = document.getElementById('userProfileBtn');
    const pMenu = document.getElementById('profileMenu');

    nBtn.addEventListener('click', e => { e.stopPropagation(); nMenu.classList.toggle('show'); pMenu.classList.remove('show'); });
    pBtn.addEventListener('click', e => { e.stopPropagation(); pMenu.classList.toggle('show'); nMenu.classList.remove('show'); });

    window.addEventListener('click', () => {
        nMenu.classList.remove('show');
        pMenu.classList.remove('show');
    });
}

function setupModals() {
    const closeBtns = document.querySelectorAll('[data-close]');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-close');
            document.getElementById(modalId).classList.remove('show');
        });
    });

    window.addEventListener('click', (e) => {
        if(e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
        }
    });

    // Add Student btn
    document.getElementById('addStudentBtn').addEventListener('click', () => {
        document.getElementById('studentForm').reset();
        document.getElementById('editStudentId').value = '';
        document.getElementById('modalTitle').textContent = 'Add New Student';
        
        // Populate course dropdown
        const courseSelect = document.getElementById('course');
        courseSelect.innerHTML = '<option value="">Select a course</option>';
        state.courses.forEach(c => {
            courseSelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
        });
        
        document.getElementById('studentModal').classList.add('show');
    });

    // Add Course btn
    document.getElementById('addCourseBtn').addEventListener('click', () => {
        document.getElementById('courseForm').reset();
        document.getElementById('editCourseId').value = '';
        document.getElementById('courseModalTitle').textContent = 'Add Course';
        document.getElementById('courseModal').classList.add('show');
    });
}

function setupForms() {
    document.getElementById('studentForm').addEventListener('submit', handleStudentSubmit);
    document.getElementById('courseForm').addEventListener('submit', handleCourseSubmit);
    document.getElementById('profileUpdateForm').addEventListener('submit', handleProfileSubmit);

    // Student Filters & Search
    document.getElementById('searchInput').addEventListener('input', renderStudentsTable);
    document.getElementById('filterCourse').addEventListener('change', renderStudentsTable);
    document.getElementById('filterSemester').addEventListener('change', renderStudentsTable);
    document.getElementById('filterStatus').addEventListener('change', renderStudentsTable);
    document.getElementById('clearFiltersBtn').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('filterCourse').value = '';
        document.getElementById('filterSemester').value = '';
        document.getElementById('filterStatus').value = '';
        renderStudentsTable();
    });
    document.getElementById('emptyClearFiltersBtn').addEventListener('click', () => {
        document.getElementById('clearFiltersBtn').click();
    });

    // Sorting
    document.querySelectorAll('#studentsTable th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const sortBy = th.getAttribute('data-sort');
            if(currentSort.column === sortBy) {
                currentSort.asc = !currentSort.asc;
            } else {
                currentSort.column = sortBy;
                currentSort.asc = true;
            }
            // Update icons
            document.querySelectorAll('#studentsTable th.sortable i').forEach(i => i.className = 'fa-solid fa-sort');
            th.querySelector('i').className = currentSort.asc ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down';
            renderStudentsTable();
        });
    });
}

// ==========================================
// RENDERERS
// ==========================================
let currentSort = { column: 'date', asc: false };
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

function renderAll() {
    populateDropdowns();
    updateDashboardStats();
    renderStudentsTable();
    renderDashboardStudents();
    renderActivities();
    renderCourses();
    // Dummy renders for uncompleted modules to show empty states
    document.getElementById('enrollmentTableBody').innerHTML = '';
    document.getElementById('enrollmentEmptyState').classList.remove('hidden');
    document.getElementById('attendanceTableBody').innerHTML = '';
    document.getElementById('attendanceEmptyState').classList.remove('hidden');
    document.getElementById('feesTableBody').innerHTML = '';
    document.getElementById('feesEmptyState').classList.remove('hidden');
    document.getElementById('recordsTableBody').innerHTML = '';
    document.getElementById('recordsEmptyState').classList.remove('hidden');
    updateCharts();
}

function updateProfileUI() {
    const initials = getInitials(state.profile.name);
    document.getElementById('headerProfileName').textContent = state.profile.name;
    document.getElementById('headerProfileEmail').textContent = state.profile.email;
    document.getElementById('headerProfileAvatar').textContent = initials;
    document.getElementById('menuProfileName').textContent = state.profile.name;
    document.getElementById('menuProfileEmail').textContent = state.profile.email;
    document.getElementById('profilePageAvatar').textContent = initials;
    
    document.getElementById('profileNameInput').value = state.profile.name;
    document.getElementById('profileEmailInput').value = state.profile.email;
    document.getElementById('profilePhoneInput').value = state.profile.phone || '';
}

function handleProfileSubmit(e) {
    e.preventDefault();
    state.profile.name = document.getElementById('profileNameInput').value;
    state.profile.email = document.getElementById('profileEmailInput').value;
    state.profile.phone = document.getElementById('profilePhoneInput').value;
    saveData('profile');
    updateProfileUI();
    showToast('Profile updated successfully');
}

function populateDropdowns() {
    const courseFilter = document.getElementById('filterCourse');
    if(courseFilter) {
        courseFilter.innerHTML = '<option value="">All Courses</option>';
        state.courses.forEach(c => {
            courseFilter.innerHTML += `<option value="${c.name}">${escapeHTML(c.name)}</option>`;
        });
    }
}

function updateDashboardStats() {
    const total = state.students.length;
    const active = state.students.filter(s => s.status === 'Active').length;
    const grad = state.students.filter(s => s.status === 'Graduated').length;
    const inact = state.students.filter(s => s.status === 'Inactive').length;
    
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statActive').textContent = active;
    document.getElementById('statGraduated').textContent = grad;
    document.getElementById('statInactive').textContent = inact;
    document.getElementById('statCourses').textContent = state.courses.length;
    document.getElementById('statEnrollments').textContent = state.enrollments.length;
}

function renderDashboardStudents() {
    const tbody = document.getElementById('dashboardStudentsTableBody');
    tbody.innerHTML = '';
    const recent = [...state.students].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0,5);
    
    if(recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--text-muted)">No students found</td></tr>';
        return;
    }

    recent.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="student-profile">
                    <div class="avatar">${getInitials(s.name)}</div>
                    <span>${escapeHTML(s.name)}</span>
                </div>
            </td>
            <td>${escapeHTML(s.course)}</td>
            <td><span class="status-badge status-${s.status.toLowerCase()}">${s.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderStudentsTable(page = 1) {
    currentPage = typeof page === 'number' ? page : 1;
    
    const search = document.getElementById('searchInput').value.toLowerCase();
    const fCourse = document.getElementById('filterCourse').value;
    const fSem = document.getElementById('filterSemester').value;
    const fStatus = document.getElementById('filterStatus').value;

    let filtered = state.students.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search) || 
                            s.studentId.toLowerCase().includes(search) || 
                            s.email.toLowerCase().includes(search) ||
                            (s.phone && s.phone.includes(search));
        const matchCourse = fCourse ? s.course === fCourse : true;
        const matchSem = fSem ? s.semester === fSem : true;
        const matchStatus = fStatus ? s.status === fStatus : true;
        return matchSearch && matchCourse && matchSem && matchStatus;
    });

    document.getElementById('recordCount').textContent = filtered.length;

    // Sort
    filtered.sort((a, b) => {
        let valA = a[currentSort.column] || '';
        let valB = b[currentSort.column] || '';
        if(currentSort.column === 'date') {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
        } else {
            valA = valA.toString().toLowerCase();
            valB = valB.toString().toLowerCase();
        }
        if(valA < valB) return currentSort.asc ? -1 : 1;
        if(valA > valB) return currentSort.asc ? 1 : -1;
        return 0;
    });

    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = '';

    if(filtered.length === 0) {
        document.querySelector('.table-container').style.display = 'none';
        document.getElementById('studentsEmptyState').classList.remove('hidden');
        document.getElementById('paginationContainer').style.display = 'none';
        return;
    }

    document.querySelector('.table-container').style.display = 'block';
    document.getElementById('studentsEmptyState').classList.add('hidden');
    document.getElementById('paginationContainer').style.display = 'flex';

    // Paginate
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    if(currentPage > totalPages) currentPage = totalPages;
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    document.getElementById('pageStart').textContent = startIdx + 1;
    document.getElementById('pageEnd').textContent = startIdx + paginated.length;
    document.getElementById('pageTotal').textContent = filtered.length;

    paginated.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${escapeHTML(s.studentId)}</strong></td>
            <td>
                <div class="student-profile">
                    <div class="avatar">${getInitials(s.name)}</div>
                    <span>${escapeHTML(s.name)}</span>
                </div>
            </td>
            <td>${escapeHTML(s.email)}</td>
            <td>${escapeHTML(s.course)}</td>
            <td>Sem ${s.semester || '-'}</td>
            <td>${formatDate(s.date)}</td>
            <td><span class="status-badge status-${s.status.toLowerCase()}">${s.status}</span></td>
            <td>
                <button class="action-btn view-btn" onclick="viewStudent('${s.studentId}')" title="View"><i class="fa-solid fa-eye"></i></button>
                <button class="action-btn edit-btn" onclick="editStudent('${s.studentId}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn delete-btn" onclick="deleteStudent('${s.studentId}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
    const c = document.getElementById('paginationControls');
    c.innerHTML = '';
    
    const prev = document.createElement('button');
    prev.className = 'page-btn';
    prev.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    prev.disabled = currentPage === 1;
    prev.onclick = () => renderStudentsTable(currentPage - 1);
    c.appendChild(prev);

    for(let i = 1; i <= totalPages; i++) {
        if(i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.onclick = () => renderStudentsTable(i);
            c.appendChild(btn);
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.padding = '0.4rem';
            c.appendChild(ellipsis);
        }
    }

    const next = document.createElement('button');
    next.className = 'page-btn';
    next.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    next.disabled = currentPage === totalPages;
    next.onclick = () => renderStudentsTable(currentPage + 1);
    c.appendChild(next);
}

// ==========================================
// STUDENT CRUD
// ==========================================
function handleStudentSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('editStudentId').value;
    
    const studentData = {
        studentId: document.getElementById('studentId').value,
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        gender: document.getElementById('gender').value,
        dob: document.getElementById('dob').value,
        course: document.getElementById('course').value,
        semester: document.getElementById('semester').value,
        date: document.getElementById('date').value,
        status: document.getElementById('status').value,
        address: document.getElementById('address').value
    };

    if(editId) {
        const idx = state.students.findIndex(s => s.studentId === editId);
        if(idx !== -1) {
            // Check ID uniqueness if changed
            if(studentData.studentId !== editId && state.students.some(s => s.studentId === studentData.studentId)) {
                showToast('Student ID already exists!', 'error'); return;
            }
            state.students[idx] = studentData;
            showToast('Student updated successfully');
            logActivity(`Updated record for ${studentData.name}`, 'fa-solid fa-user-pen');
        }
    } else {
        if(state.students.some(s => s.studentId === studentData.studentId)) {
            showToast('Student ID already exists!', 'error'); return;
        }
        state.students.push(studentData);
        showToast('Student added successfully');
        logActivity(`Added new student ${studentData.name}`, 'fa-solid fa-user-plus');
    }

    saveData('students');
    document.getElementById('studentModal').classList.remove('show');
    renderAll();
}

window.editStudent = function(studentId) {
    const student = state.students.find(s => s.studentId === studentId);
    if(!student) return;

    // Pop dropdown
    const courseSelect = document.getElementById('course');
    courseSelect.innerHTML = '<option value="">Select a course</option>';
    state.courses.forEach(c => {
        courseSelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
    });

    document.getElementById('editStudentId').value = student.studentId;
    document.getElementById('studentId').value = student.studentId;
    document.getElementById('name').value = student.name;
    document.getElementById('email').value = student.email;
    document.getElementById('phone').value = student.phone || '';
    document.getElementById('gender').value = student.gender || '';
    
    const dobInp = document.getElementById('dob');
    dobInp.value = student.dob || '';
    if(dobInp._flatpickr) dobInp._flatpickr.setDate(student.dob || '');

    document.getElementById('course').value = student.course;
    document.getElementById('semester').value = student.semester || '1';
    
    const dateInp = document.getElementById('date');
    dateInp.value = student.date;
    if(dateInp._flatpickr) dateInp._flatpickr.setDate(student.date);

    document.getElementById('status').value = student.status;
    document.getElementById('address').value = student.address || '';

    document.getElementById('modalTitle').textContent = 'Edit Student Details';
    document.getElementById('studentModal').classList.add('show');
}

window.deleteStudent = function(studentId) {
    const student = state.students.find(s => s.studentId === studentId);
    if(!student) return;

    confirmAction('Delete Student?', `Are you sure you want to delete ${student.name}'s record? This cannot be undone.`, 'Yes, Delete', () => {
        state.students = state.students.filter(s => s.studentId !== studentId);
        saveData('students');
        showToast('Student deleted successfully');
        logActivity(`Deleted student ${student.name}`, 'fa-solid fa-user-minus text-danger');
        renderAll();
    });
}

window.viewStudent = function(studentId) {
    const s = state.students.find(x => x.studentId === studentId);
    if(!s) return;

    document.getElementById('viewAvatar').textContent = getInitials(s.name);
    document.getElementById('viewName').textContent = s.name;
    document.getElementById('viewId').textContent = s.studentId;
    
    const badge = document.getElementById('viewStatusBadge');
    badge.textContent = s.status;
    badge.className = `status-badge status-${s.status.toLowerCase()}`;

    document.getElementById('viewEmail').textContent = s.email;
    document.getElementById('viewPhone').textContent = s.phone || '-';
    document.getElementById('viewCourse').textContent = s.course;
    document.getElementById('viewSemester').textContent = s.semester ? `Semester ${s.semester}` : '-';
    document.getElementById('viewGender').textContent = s.gender || '-';
    document.getElementById('viewDob').textContent = formatDate(s.dob);
    document.getElementById('viewJoined').textContent = formatDate(s.date);
    document.getElementById('viewAddress').textContent = s.address || '-';

    document.getElementById('viewStudentModal').classList.add('show');
}

// ==========================================
// COURSES CRUD
// ==========================================
function renderCourses() {
    const grid = document.getElementById('courseGrid');
    grid.innerHTML = '';
    if(state.courses.length === 0) {
        document.getElementById('coursesEmptyState').classList.remove('hidden');
        return;
    }
    document.getElementById('coursesEmptyState').classList.add('hidden');

    state.courses.forEach(c => {
        const studentCount = state.students.filter(s => s.course === c.name).length;
        const div = document.createElement('div');
        div.className = 'course-card';
        div.innerHTML = `
            <div class="course-header">
                <div class="course-icon"><i class="fa-solid fa-book-open"></i></div>
                <div>
                    <button class="action-btn edit-btn" onclick="editCourse('${c.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn delete-btn" onclick="deleteCourse('${c.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            <div class="course-title">
                <h3>${escapeHTML(c.name)}</h3>
                <p>${escapeHTML(c.code)} | $${c.fee}</p>
            </div>
            <p class="course-desc">${escapeHTML(c.desc)}</p>
            <div class="course-footer">
                <div class="course-students"><i class="fa-solid fa-users"></i> ${studentCount} Students Enrolled</div>
            </div>
        `;
        grid.appendChild(div);
    });
}

function handleCourseSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('editCourseId').value;
    const courseData = {
        name: document.getElementById('courseName').value,
        code: document.getElementById('courseCode').value,
        fee: document.getElementById('courseFee').value,
        desc: document.getElementById('courseDescription').value,
    };

    if(editId) {
        const idx = state.courses.findIndex(c => c.id === editId);
        courseData.id = editId;
        state.courses[idx] = courseData;
        showToast('Course updated successfully');
        logActivity(`Updated course ${courseData.name}`, 'fa-solid fa-book');
    } else {
        courseData.id = generateId('C');
        state.courses.push(courseData);
        showToast('Course added successfully');
        logActivity(`Added course ${courseData.name}`, 'fa-solid fa-book');
    }
    saveData('courses');
    document.getElementById('courseModal').classList.remove('show');
    renderAll();
}

window.editCourse = function(id) {
    const c = state.courses.find(x => x.id === id);
    if(!c) return;
    document.getElementById('editCourseId').value = c.id;
    document.getElementById('courseName').value = c.name;
    document.getElementById('courseCode').value = c.code;
    document.getElementById('courseFee').value = c.fee;
    document.getElementById('courseDescription').value = c.desc;
    document.getElementById('courseModalTitle').textContent = 'Edit Course';
    document.getElementById('courseModal').classList.add('show');
}

window.deleteCourse = function(id) {
    const c = state.courses.find(x => x.id === id);
    confirmAction('Delete Course?', `Are you sure you want to delete ${c.name}?`, 'Delete', () => {
        state.courses = state.courses.filter(x => x.id !== id);
        saveData('courses');
        showToast('Course deleted');
        renderAll();
    });
}

// ==========================================
// RECENT ACTIVITY & NOTIFICATIONS
// ==========================================
function renderActivities() {
    const list = document.getElementById('recentActivityList');
    if(!list) return;
    list.innerHTML = '';
    
    if(state.activities.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding: 1rem;">No recent activity.</p>';
        return;
    }

    state.activities.forEach(a => {
        const div = document.createElement('div');
        div.className = 'activity-item';
        // Time ago calculation
        const diff = Math.floor((new Date() - new Date(a.time)) / 60000);
        const timeAgo = diff < 1 ? 'Just now' : diff < 60 ? `${diff} mins ago` : diff < 1440 ? `${Math.floor(diff/60)} hrs ago` : `${Math.floor(diff/1440)} days ago`;
        
        div.innerHTML = `
            <div class="activity-icon"><i class="${a.icon}"></i></div>
            <div class="activity-details">
                <p>${escapeHTML(a.message)}</p>
                <span>${timeAgo}</span>
            </div>
        `;
        list.appendChild(div);
    });

    // Update notifications
    const count = state.activities.length;
    document.getElementById('notificationBadge').textContent = count;
    document.getElementById('notificationCount').textContent = count;
    
    const notifList = document.getElementById('notificationList');
    notifList.innerHTML = '';
    state.activities.slice(0,5).forEach(a => {
        notifList.innerHTML += `
            <div class="notification-item">
                <div class="notification-icon-wrapper bg-primary-light text-primary"><i class="${a.icon}"></i></div>
                <div class="notification-content">
                    <h4>${escapeHTML(a.message)}</h4>
                    <p>Just now</p>
                </div>
            </div>
        `;
    });
}

// ==========================================
// EXPORT & PRINT
// ==========================================
function exportStudentsCSV() {
    if(state.students.length === 0) { showToast('No data to export', 'warning'); return; }
    
    const headers = ['Student ID', 'Name', 'Email', 'Phone', 'Course', 'Semester', 'Date Joined', 'Status'];
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n";
    
    state.students.forEach(s => {
        const row = [s.studentId, `"${s.name}"`, s.email, s.phone||'', `"${s.course}"`, s.semester||'', s.date, s.status];
        csvContent += row.join(',') + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "edumanage_students.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==========================================
// CHARTS
// ==========================================
let charts = {};
const chartColors = {
    primary: '#4f46e5',
    info: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    text: '#6b7280',
    grid: '#e5e7eb'
};

function initCharts() {
    Chart.defaults.color = chartColors.text;
    Chart.defaults.font.family = 'Inter';

    const ctx1 = document.getElementById('enrollmentChart');
    if(ctx1 && !charts.enroll) {
        charts.enroll = new Chart(ctx1, {
            type: 'line',
            data: { labels: [], datasets: [{ label: 'Enrollments', data: [], borderColor: chartColors.primary, backgroundColor: 'rgba(79, 70, 229, 0.1)', fill: true, tension: 0.4 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: chartColors.grid } }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } }
        });
    }

    const ctx2 = document.getElementById('courseChart');
    if(ctx2 && !charts.course) {
        charts.course = new Chart(ctx2, {
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Students', data: [], backgroundColor: chartColors.info, borderRadius: 6 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: chartColors.grid } }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } }
        });
    }

    const ctx3 = document.getElementById('statusChart');
    if(ctx3 && !charts.status) {
        charts.status = new Chart(ctx3, {
            type: 'doughnut',
            data: { labels: ['Active', 'Inactive', 'Graduated'], datasets: [{ data: [0,0,0], backgroundColor: [chartColors.success, chartColors.danger, chartColors.info], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom' } } }
        });
    }
    updateCharts();
}

function updateCharts() {
    if(!charts.enroll) return; // not initialized yet

    // Enrollment Chart (Group by month-year)
    const enrollMap = {};
    state.students.forEach(s => {
        const date = new Date(s.date);
        const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        enrollMap[key] = (enrollMap[key] || 0) + 1;
    });
    charts.enroll.data.labels = Object.keys(enrollMap).slice(-6);
    charts.enroll.data.datasets[0].data = Object.values(enrollMap).slice(-6);
    charts.enroll.update();

    // Course Chart
    const courseMap = {};
    state.courses.forEach(c => courseMap[c.name] = 0);
    state.students.forEach(s => { if(courseMap[s.course] !== undefined) courseMap[s.course]++; });
    charts.course.data.labels = Object.keys(courseMap);
    charts.course.data.datasets[0].data = Object.values(courseMap);
    charts.course.update();

    // Status Chart
    const a = state.students.filter(s => s.status === 'Active').length;
    const i = state.students.filter(s => s.status === 'Inactive').length;
    const g = state.students.filter(s => s.status === 'Graduated').length;
    charts.status.data.datasets[0].data = [a, i, g];
    charts.status.update();
}

function updateChartColors() {
    if(!charts.enroll) return;
    const isDark = document.body.classList.contains('dark-mode');
    const gridColor = isDark ? '#374151' : '#e5e7eb';
    const textColor = isDark ? '#9ca3af' : '#6b7280';
    
    Chart.defaults.color = textColor;
    
    charts.enroll.options.scales.y.grid.color = gridColor;
    charts.course.options.scales.y.grid.color = gridColor;
    
    charts.enroll.update();
    charts.course.update();
    charts.status.update();
}
