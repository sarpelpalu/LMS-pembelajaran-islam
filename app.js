import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore, collection, getDocs, setDoc, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

// === KONFIGURASI FIREBASE ===
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Data Materi Pembelajaran (Menggunakan link embed Youtube)
const defaultCourses = [
  { id: 'arabic-1', category: 'Bahasa Arab', title: 'Dasar Nahwu & Shorof', description: 'Mengenal struktur kalimat dasar dan perubahan kata.', youtubeUrl: 'https://www.youtube.com/embed/nmu6o9c_2iA' },
  { id: 'fiqih-1', category: 'Fikih', title: 'Thaharah (Bersuci)', description: 'Tata cara wudhu, mandi wajib, dan tayamum yang benar.', youtubeUrl: 'https://www.youtube.com/embed/nmu6o9c_2iA' },
  { id: 'fiqih-2', category: 'Fikih', title: 'Rukun & Syarat Shalat', description: 'Membahas hal-hal yang mensahkan dan membatalkan shalat.', youtubeUrl: 'https://www.youtube.com/embed/nmu6o9c_2iA' },
  { id: 'ushul-1', category: 'Ushul Fikih', title: 'Pengantar Ushul Fikih', description: 'Sumber hukum Islam dan metode pengambilan hukum.', youtubeUrl: 'https://www.youtube.com/embed/nmu6o9c_2iA' }
];

const authSection = document.getElementById('auth-section');
const dashboard = document.getElementById('dashboard');
const authMessage = document.getElementById('auth-message');
const displayNameEl = document.getElementById('display-name');
const avatarInitialEl = document.getElementById('avatar-initial');
const form = document.getElementById('auth-form');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const courseList = document.getElementById('course-list');
const template = document.getElementById('course-template');
const filterBtns = document.querySelectorAll('.filter-btn');

let currentUserData = null;
let allCoursesData = [];

function showMessage(msg, isError = false) {
  authMessage.textContent = msg;
  authMessage.style.color = isError ? '#ef4444' : '#059669'; 
}

function usernameToEmail(username) {
  return `${username.toLowerCase().trim()}@lms-islam.local`;
}

// 1. FUNGSI RENDER MATERI & IFRAME VIDEO
function renderCourses(courses, uid, filterCategory = "Semua") {
  courseList.innerHTML = ''; 
  const filteredCourses = filterCategory === "Semua" ? courses : courses.filter(course => course.category === filterCategory);

  if (filteredCourses.length === 0) {
    courseList.innerHTML = '<p style="color:#64748b; grid-column: 1 / -1;">Belum ada materi di kategori ini.</p>';
    return;
  }

  filteredCourses.forEach((course) => {
    const clone = template.content.cloneNode(true);
    
    clone.querySelector('.course-category').textContent = course.category;
    clone.querySelector('.course-title').textContent = course.title;
    clone.querySelector('.course-desc').textContent = course.description;
    
    // Memasukkan URL Video ke Iframe
    clone.querySelector('.course-video').src = course.youtubeUrl;

    const completeBtn = clone.querySelector('.complete-btn');
    if (course.done) {
      completeBtn.textContent = 'Selesai Dipelajari ✅';
      completeBtn.classList.add('selesai');
    }

    completeBtn.addEventListener('click', async () => {
      completeBtn.textContent = 'Menyimpan...';
      try {
        await setDoc(doc(db, 'users', uid, 'progress', course.id), { done: true, updatedAt: new Date().toISOString() }, { merge: true });
        completeBtn.textContent = 'Selesai Dipelajari ✅';
        completeBtn.classList.add('selesai');
        course.done = true;
      } catch (e) {
        alert('Gagal menyimpan progress: ' + e.message);
        completeBtn.textContent = 'Tandai Selesai';
      }
    });

    courseList.append(clone);
  });
}

// 2. LOGIKA TOMBOL FILTER KATEGORI (BERFUNGSI LANGSUNG)
filterBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    // Hapus warna aktif dari semua tombol
    filterBtns.forEach(b => b.classList.remove('active'));
    // Beri warna aktif ke tombol yang diklik
    e.target.classList.add('active');
    
    // Tampilkan materi sesuai kategori yang diklik
    const selectedCategory = e.target.getAttribute('data-category');
    renderCourses(allCoursesData, currentUserData.uid, selectedCategory);
  });
});

// 3. LOGIKA DAFTAR, LOGIN, & LOGOUT
registerBtn.addEventListener('click', async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  if (!username || !password) return showMessage('Username dan password wajib diisi.', true);

  try {
    showMessage('Mendaftarkan akun...');
    const userCred = await createUserWithEmailAndPassword(auth, usernameToEmail(username), password);
    await updateProfile(userCred.user, { displayName: username });
    await setDoc(doc(db, 'users', userCred.user.uid), { username, createdAt: new Date().toISOString() }, { merge: true });
    showMessage('Berhasil!');
  } catch (error) {
    showMessage(`Gagal daftar: ${error.message}`, true);
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  try {
    showMessage('Sedang masuk...');
    await signInWithEmailAndPassword(auth, usernameToEmail(username), password);
  } catch (error) {
    showMessage(`Gagal masuk: Username atau password salah.`, true);
  }
});

logoutBtn.addEventListener('click', () => signOut(auth));

// 4. PANTAU LOGIN DAN AMBIL DATABASE
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    authSection.classList.remove('hidden');
    dashboard.classList.add('hidden');
    showMessage('');
    currentUserData = null;
  } else {
    authSection.classList.add('hidden');
    dashboard.classList.remove('hidden');
    
    const uname = user.displayName || 'Peserta';
    displayNameEl.textContent = uname;
    avatarInitialEl.textContent = uname.charAt(0).toUpperCase(); // Huruf depan untuk Avatar
    
    currentUserData = user;

    // Ambil progress dari Firestore
    allCoursesData = await Promise.all(defaultCourses.map(async (course) => {
      const snap = await getDoc(doc(db, 'users', user.uid, 'progress', course.id));
      return { ...course, done: snap.exists() ? snap.data().done : false };
    }));

    // Tampilkan semua materi saat pertama kali masuk
    renderCourses(allCoursesData, user.uid, "Semua");
  }
});
