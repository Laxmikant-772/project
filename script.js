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

// Initialize app
function init() {
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
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === studentModal) {
            closeModal();
        }
    });

    studentForm.addEventListener('submit', handleFormSubmit);
    searchInput.addEventListener('input', handleSearch);
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
    
    if(elTotal) elTotal.textContent = total;
    if(elActive) elActive.textContent = active;
    if(elGraduated) elGraduated.textContent = graduated;
    if(elInactive) elInactive.textContent = inactive;
}

// Render the students table
function renderTable(data = students) {
    updateStats();
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
            
            tr.innerHTML = `
                <td><strong>${student.studentId}</strong></td>
                <td>${student.name}</td>
                <td>${student.email}</td>
                <td>${student.course}</td>
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
        // Check if ID already exists
        if (students.some(s => s.studentId === studentData.studentId)) {
            showToast('Student ID already exists!', 'error');
            return;
        }
        students.push(studentData);
        showToast('Student added successfully!');
    } else {
        // Update existing student
        // Check if ID exists and is not the current student
        if (students.some((s, i) => s.studentId === studentData.studentId && i !== index)) {
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
window.editStudent = function(index) {
    const student = students[index];
    
    document.getElementById('studentId').value = student.studentId;
    document.getElementById('name').value = student.name;
    document.getElementById('email').value = student.email;
    document.getElementById('course').value = student.course;
    document.getElementById('date').value = student.date;
    document.getElementById('status').value = student.status;
    
    editIndex.value = index;
    modalTitle.textContent = 'Edit Student Details';
    
    openModal();
}

// Delete Student
window.deleteStudent = function(index) {
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
    
    if (searchTerm === '') {
        renderTable(students);
        return;
    }
    
    const filteredStudents = students.filter(student => {
        return (
            student.name.toLowerCase().includes(searchTerm) ||
            student.studentId.toLowerCase().includes(searchTerm) ||
            student.course.toLowerCase().includes(searchTerm)
        );
    });
    
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

// Run app
document.addEventListener('DOMContentLoaded', init);
