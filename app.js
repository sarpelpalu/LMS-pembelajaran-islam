import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore, collection, getDocs, setDoc, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

// KONFIGURASI FIREBASE (Ganti dengan milikmu nanti jika ingin database sungguhan)
const firebaseConfig = {
  apiKey: "AIzaSyBKgoWQfbyIgA8BLa67MdD0eXbzTsvC-bM",
  authDomain: "pembelajaran-islam.firebaseapp.com",
  databaseURL: "https://pembelajaran-islam-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pembelajaran-islam",
  storageBucket: "pembelajaran-islam.firebasestorage.app",
  messagingSenderId: "571685080002",
  appId: "1:571685080002:web:3a22b6a7af911fef5a245b",
  measurementId: "G-0KVTX61PC3"
};

// Data Materi Pembelajaran
const defaultCourses = [
  { id: 'arabic-1', category: 'Bahasa Arab', title: 'Dasar Nahwu', description: 'Mengenal struktur kalimat dasar.', youtubeUrl: 'https://www.youtube.com/embed/4dTr7Vx9u6Q' },
  { id: 'fiqih-1', category: 'Fikih', title: 'Thaharah dan Shalat', description: 'Materi fikih ibadah dasar.', youtubeUrl: 'https://www.youtube.com/embed/cSLM2Q8x3f8' },
  { id: 'ushul-fiqih-1', category: 'Ushul Fikih', title: 'Pengantar Ushul Fikih', description: 'Sumber hukum Islam.', youtubeUrl: 'https://www.youtube.com/embed/S7I6lyzPUbo' },
];

// Hubungkan elemen HTML ke JS
const authSection = document.getElementById('auth-section');
const dashboard = document.getElementById('dashboard');
const authMessage = document.getElementById('auth-message');
const welcomeEl = document.getElementById('welcome');
const form = document.getElementById('auth-form');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const courseList = document.getElementById('course-list');
const template = document.getElementById('course-template');
const tabBtns = document.querySelectorAll('.tab-btn');

let currentUserData = null;
let allCoursesData = [];

// Deteksi Mode: Demo atau Firebase Asli
const isFirebaseConfigured = !Object.values(firebaseConfig).some(value => String(value).startsWith('YOUR_FIREBASE_'));
let auth = null, db = null, mode = 'demo';

if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  mode = 'firebase';
}

// Sistem Database Demo (Penyimpanan Sementara di Browser)
const demoDb = {
  users: JSON.parse(localStorage.getItem('demoUsers') || '{}'),
  progress: JSON.parse(localStorage.getItem('demoProgress') || '{}'),
  currentUser: JSON.parse(localStorage.getItem('demoCurrentUser') || 'null'),
};

function persistDemoData() {
  localStorage.setItem('demoUsers', JSON.stringify(demoDb.users));
  localStorage.setItem('demoProgress', JSON.stringify(demoDb.progress));
  localStorage.setItem('demoCurrentUser', JSON.stringify(demoDb.currentUser));
}

function showMessage(msg, isError = false) {
  authMessage.textContent = msg;
  authMessage.style.color = isError ? '#ef4444' : '#059669'; // Merah error, Hijau sukses
}

// FUNGSI RENDER MATERI (Berdasarkan Kategori)
function renderCourses(courses, uid, filterCategory = "Semua") {
  courseList.innerHTML = ''; // Kosongkan daftar sebelumnya

  // Saring materi berdasarkan kategori yang dipilih
  const filteredCourses = filterCategory === "Semua" 
    ? courses 
    : courses.filter(course => course.category === filterCategory);

  if (filteredCourses.length === 0) {
    courseList.innerHTML = '<p class="muted">Belum ada materi di kategori ini.</p>';
    return;
  }

  filteredCourses.forEach((course) => {
    const clone = template.content.cloneNode(true);
    const root = clone.querySelector('.course-item');
    clone.querySelector('.course-title').textContent = course.title;
    clone.querySelector('.course-description').textContent = course.description;
    clone.querySelector('.badge').textContent = course.category;
    clone.querySelector('.course-video').src = course.youtubeUrl;

    const completeBtn = clone.querySelector('.complete-btn');
    if (course.done) {
      completeBtn.textContent = 'Sudah Selesai ✅';
      completeBtn.style.backgroundColor = '#059669';
    }

    completeBtn.addEventListener('click', () => {
      completeBtn.textContent = 'Sudah Selesai ✅';
      completeBtn.style.backgroundColor = '#059669';
      if(mode === 'demo') {
        demoDb.progress[uid] = demoDb.progress[uid] || {};
        demoDb.progress[uid][course.id] = true;
        persistDemoData();
      }
    });

    courseList.append(clone);
  });
}

// LOGIKA TAB KATEGORI
tabBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    // Hilangkan warna aktif dari semua tombol
    tabBtns.forEach(b => b.classList.remove('active'));
    // Beri warna aktif pada tombol yang diklik
    e.target.classList.add('active');
    
    // Render ulang materi sesuai kategori
    const selectedCategory = e.target.getAttribute('data-category');
    renderCourses(allCoursesData, currentUserData.uid, selectedCategory);
  });
});

// FUNGSI DAFTAR (REGISTER)
registerBtn.addEventListener('click', async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (!username || !password) {
    showMessage('Username dan password wajib diisi.', true);
    return;
  }

  if (mode === 'demo') {
    const key = username.toLowerCase();
    demoDb.users[key] = { username, password, uid: `demo-${key}` };
    demoDb.currentUser = { uid: `demo-${key}`, displayName: username };
    persistDemoData();
    checkAuth(); // Langsung masuk
    return;
  }
  // Logika Firebase asli akan berjalan di sini jika config diubah
});

// FUNGSI MASUK (LOGIN)
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (mode === 'demo') {
    const key = username.toLowerCase();
    const record = demoDb.users[key];
    if (!record || record.password !== password) {
      showMessage('Username/password salah!', true);
      return;
    }
    demoDb.currentUser = { uid: record.uid, displayName: record.username };
    persistDemoData();
    checkAuth();
    return;
  }
});

// FUNGSI KELUAR (LOGOUT)
logoutBtn.addEventListener('click', () => {
  if (mode === 'demo') {
    demoDb.currentUser = null;
    persistDemoData();
    checkAuth();
  }
});

// CEK STATUS LOGIN
function checkAuth() {
  if (mode === 'demo') {
    const user = demoDb.currentUser;
    if (!user) {
      authSection.classList.remove('hidden');
      dashboard.classList.add('hidden');
      showMessage('Silakan masuk atau daftar (Mode Demo Aktif).', false);
    } else {
      authSection.classList.add('hidden');
      dashboard.classList.remove('hidden');
      welcomeEl.textContent = `Assalamu'alaikum, ${user.displayName} 👋`;
      
      currentUserData = user;
      // Beri status 'done' jika ada di progress
      allCoursesData = defaultCourses.map(course => ({
        ...course,
        done: Boolean(demoDb.progress?.[user.uid]?.[course.id])
      }));
      
      // Render semua materi secara default saat pertama masuk
      renderCourses(allCoursesData, user.uid, "Semua");
    }
  }
}

// Jalankan pengecekan saat halaman dimuat
checkAuth();
