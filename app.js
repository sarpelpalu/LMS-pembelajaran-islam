// === 1. IMPORT FIREBASE ===
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore, collection, getDocs, setDoc, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

// === 2. KONFIGURASI FIREBASE ===
// 👇 TEMPELKAN KODE FIREBASE MILIKMU DI SINI 👇
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
// 👆 -------------------------------------- 👆

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Data Materi Pembelajaran Default
// Data Materi Pembelajaran (Silakan tambah sebanyak apapun di sini)
const defaultCourses = [
  // --- KATEGORI BAHASA ARAB ---
  { 
    id: 'arabic-1', 
    category: 'Bahasa Arab', 
    title: 'Pelajaran 1: Dasar Nahwu', 
    description: 'Mengenal struktur kalimat dasar.', 
    youtubeUrl: 'https://www.youtube.com/embed/nmu6o9c_2iA' // Ganti dengan link embed videomu
  },
  { 
    id: 'arabic-2', 
    category: 'Bahasa Arab', 
    title: 'Pelajaran 2: Isim, Fiil, Huruf', 
    description: 'Mengenal pembagian kata dalam bahasa arab.', 
    youtubeUrl: 'https://www.youtube.com/embed/nmu6o9c_2iA' 
  },

  // --- KATEGORI FIKIH ---
  { 
    id: 'fiqih-1', 
    category: 'Fikih', 
    title: 'Fikih 1: Thaharah (Bersuci)', 
    description: 'Tata cara wudhu dan mandi wajib.', 
    youtubeUrl: 'https://www.youtube.com/embed/nmu6o9c_2iA' 
  },
  { 
    id: 'fiqih-2', 
    category: 'Fikih', 
    title: 'Fikih 2: Rukun Shalat', 
    description: 'Memahami rukun dan syarat sah shalat.', 
    youtubeUrl: 'https://www.youtube.com/embed/nmu6o9c_2iA' 
  },

  // --- KATEGORI USHUL FIKIH ---
  { 
    id: 'ushul-1', 
    category: 'Ushul Fikih', 
    title: 'Pengantar Ushul Fikih', 
    description: 'Memahami sejarah dan sumber hukum Islam.', 
    youtubeUrl: 'https://www.youtube.com/embed/nmu6o9c_2iA' 
  }
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

// Fungsi untuk menampilkan pesan sukses/error
function showMessage(msg, isError = false) {
  authMessage.textContent = msg;
  authMessage.style.color = isError ? '#ef4444' : '#059669'; // Merah error, Hijau sukses
}

// Fungsi mengubah username jadi email palsu (karena Firebase wajib pakai email)
function usernameToEmail(username) {
  return `${username.toLowerCase().trim()}@lms-islam.local`;
}

// FUNGSI RENDER MATERI & TAB
function renderCourses(courses, uid, filterCategory = "Semua") {
  courseList.innerHTML = ''; 
  const filteredCourses = filterCategory === "Semua" ? courses : courses.filter(course => course.category === filterCategory);

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

    // Tombol simpan progress ke database
    completeBtn.addEventListener('click', async () => {
      completeBtn.textContent = 'Menyimpan...';
      try {
        await setDoc(doc(db, 'users', uid, 'progress', course.id), { done: true, updatedAt: new Date().toISOString() }, { merge: true });
        completeBtn.textContent = 'Sudah Selesai ✅';
        completeBtn.style.backgroundColor = '#059669';
        course.done = true;
      } catch (e) {
        alert('Gagal menyimpan progress: ' + e.message);
        completeBtn.textContent = 'Tandai Selesai';
      }
    });

    courseList.append(clone);
  });
}

// Logika Tab Navigasi Kategori
tabBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    tabBtns.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    const selectedCategory = e.target.getAttribute('data-category');
    renderCourses(allCoursesData, currentUserData.uid, selectedCategory);
  });
});

// FUNGSI DAFTAR (REGISTER)
registerBtn.addEventListener('click', async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  if (!username || !password) return showMessage('Username dan password wajib diisi.', true);

  try {
    showMessage('Sedang mendaftarkan...');
    const email = usernameToEmail(username);
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCred.user, { displayName: username });
    await setDoc(doc(db, 'users', userCred.user.uid), { username, createdAt: new Date().toISOString() }, { merge: true });
    showMessage('Pendaftaran berhasil! Mengalihkan...');
  } catch (error) {
    showMessage(`Gagal daftar: ${error.message}`, true);
  }
});

// FUNGSI MASUK (LOGIN)
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  try {
    showMessage('Mencoba masuk...');
    await signInWithEmailAndPassword(auth, usernameToEmail(username), password);
  } catch (error) {
    showMessage(`Gagal masuk: Periksa kembali username/password.`, true);
  }
});

// FUNGSI KELUAR (LOGOUT)
logoutBtn.addEventListener('click', () => {
  signOut(auth);
});

// PANTAU STATUS LOGIN & AMBIL DATA (OTOMATIS)
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Jika belum login
    authSection.classList.remove('hidden');
    dashboard.classList.add('hidden');
    showMessage('');
    currentUserData = null;
  } else {
    // Jika sudah login
    authSection.classList.add('hidden');
    dashboard.classList.remove('hidden');
    welcomeEl.textContent = `Assalamu'alaikum, ${user.displayName || 'Peserta'} 👋`;
    currentUserData = user;

    // Ambil data progress dari Firestore
    allCoursesData = await Promise.all(defaultCourses.map(async (course) => {
      const snap = await getDoc(doc(db, 'users', user.uid, 'progress', course.id));
      return { ...course, done: snap.exists() ? snap.data().done : false };
    }));

    renderCourses(allCoursesData, user.uid, "Semua");
  }
});
