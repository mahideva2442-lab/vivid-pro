// State Management
let currentUser = null;
let userRole = null;
let chartInstance = null;

// --- AUTH LOGIC ---
function signIn(role) {
    const email = document.getElementById('email-input').value;
    if (!email.includes('@')) return alert("Enter a valid email");

    currentUser = email;
    userRole = role;

    document.getElementById('auth-screen').classList.add('hidden');
    if (role === 'lecturer') {
        document.getElementById('lecturer-screen').classList.remove('hidden');
    } else {
        document.getElementById('student-screen').classList.remove('hidden');
        document.getElementById('welcome-student').innerText = `Logged in as: ${email}`;
        renderAnalytics();
    }
}

function logout() { location.reload(); }

// --- LECTURER LOGIC ---
function startSession() {
    const subject = document.getElementById('subject').value;
    const totalDays = document.getElementById('total-days').value;
    const mins = document.getElementById('session-mins').value;

    if (!subject) return alert("Please enter a subject");

    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const expiry = Date.now() + (mins * 60000);

    const session = { code, subject, totalDays, expiry };
    localStorage.setItem('vivid_active_session', JSON.stringify(session));

    // Update UI
    document.getElementById('active-code').innerText = code;
    const qrDiv = document.getElementById('qr-container');
    qrDiv.innerHTML = "";
    new QRCode(qrDiv, { text: code, width: 160, height: 160 });
}

// --- STUDENT LOGIC ---
function submitAttendance() {
    const inputCode = document.getElementById('stu-code-input').value.trim();
    const session = JSON.parse(localStorage.getItem('vivid_active_session'));

    if (!session || Date.now() > session.expiry) return alert("No active session or session expired!");
    if (inputCode !== session.code) return alert("Invalid Code!");

    // Save Attendance specifically for this Email
    let myRecords = JSON.parse(localStorage.getItem(`records_${currentUser}`)) || [];
    
    // Prevent double marking for the same code
    if (myRecords.includes(session.code)) return alert("Already marked for this session!");

    myRecords.push(session.code);
    localStorage.setItem(`records_${currentUser}`, JSON.stringify(myRecords));
    
    alert("Attendance Marked!");
    renderAnalytics();
}

function renderAnalytics() {
    const ctx = document.getElementById('analyticsChart').getContext('2d');
    const records = JSON.parse(localStorage.getItem(`records_${currentUser}`)) || [];
    const session = JSON.parse(localStorage.getItem('vivid_active_session')) || { totalDays: 30 };

    const attended = records.length;
    const total = parseInt(session.totalDays);
    const percentage = ((attended / total) * 100).toFixed(1);

    // 75% Risk Alert
    const alertDiv = document.getElementById('risk-alert');
    if (percentage < 75) {
        alertDiv.innerHTML = `<div class="danger-box">⚠️ DANGER: Your attendance is ${percentage}%. Below 75% Requirement!</div>`;
    } else {
        alertDiv.innerHTML = `<div class="success-box">Status: Safe (${percentage}%)</div>`;
    }

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Attended', 'Absent'],
            datasets: [{
                data: [attended, total - attended],
                backgroundColor: [percentage < 75 ? '#ef4444' : '#22c55e', '#1e293b'],
                borderWidth: 0
            }]
        },
        options: { cutout: '75%', plugins: { legend: { labels: { color: '#fff' } } } }
    });
}