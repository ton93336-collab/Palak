// ================= 1. ระบบจัดการหน้าต่าง (SPA) =================
function openPage(pageId) {
    // ซ่อนทุกหน้า
    document.querySelectorAll('.view-panel').forEach(panel => {
        panel.classList.remove('active');
        panel.classList.add('hidden');
    });
    // แสดงหน้าที่กด
    const target = document.getElementById(pageId);
    target.classList.remove('hidden');
    void target.offsetWidth; // Force Reflow
    target.classList.add('active');

    // เลื่อนจอขึ้นบนสุด
    document.querySelector('.app-wrapper').scrollTo({ top: 0, behavior: 'smooth' });
}

// ================= 2. ฐานข้อมูล (Database Simulator) =================
// ใช้ LocalStorage เพื่อให้กดรีเฟรชแล้วข้อมูลไม่หาย
let db = {};
const defaultDB = {
    web: [
        { title: 'เว็บโอนเงิน 69.-', link: 'https://example.com', img: 'https://placehold.co/400x250/ffe4e1/ff69b4?text=Web+Design' }
    ],
    id: [
        { title: 'ป้ายลายอนิเมะ', img: 'https://placehold.co/400x400/ffe4e1/ff69b4?text=Anime+Banner' }
    ],
    decor: [], rov: [], idv: [], forms: [], course: []
};

function initDB() {
    const saved = localStorage.getItem('eoy_studio_db');
    if (saved) {
        db = JSON.parse(saved);
    } else {
        db = defaultDB;
        saveDB();
    }
    // โหลดทุกหมวดหมู่ขึ้นมาโชว์
    Object.keys(db).forEach(cat => renderGallery(cat));
    loadStaticData();
}

function saveDB() {
    localStorage.setItem('eoy_studio_db', JSON.stringify(db));
}

// ================= 3. ระบบแสดงผลแกลลอรี่ (Render) =================
function renderGallery(category) {
    const container = document.getElementById(`gallery-${category}`);
    if (!container) return;
    
    container.innerHTML = ''; // ล้างของเก่า

    if (db[category].length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#ccc; font-size:13px; grid-column:1/-1; padding: 20px;">ยังไม่มีผลงานในหมวดนี้ 🌸</p>`;
        return;
    }

    db[category].forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'work-card';

        // ป้ายไอดีเป็นจัตุรัส กดแล้วซูม // หมวดอื่นเป็นผืนผ้า กดดูลิงก์
        const isZoomable = category === 'id';
        const imgClick = isZoomable ? `onclick="openZoom('${item.img}')"` : '';
        const zoomClass = isZoomable ? 'zoomable' : '';
        
        // โค้ดปุ่มแอดมิน (ซ่อนอยู่ จะโชว์เมื่อเข้าโหมดแอดมิน)
        const btnDelete = `<button class="admin-btn del-gallery-btn admin-only hidden" onclick="deleteItem('${category}', ${index})"><i class="fa-solid fa-xmark"></i></button>`;
        const btnEditImg = `<button class="admin-btn edit-gallery-btn admin-only hidden" onclick="event.stopPropagation(); triggerGalleryUpload('${category}', ${index})"><i class="fa-solid fa-camera"></i></button>`;

        let html = `
            ${btnDelete}
            <div class="img-frame ${zoomClass}" ${imgClick}>
                <img src="${item.img}" alt="${item.title}">
                ${btnEditImg}
            </div>
            <h4 class="edit-text" id="txt-${category}-${index}">${item.title}</h4>
        `;

        if (!isZoomable) {
            const url = item.link || '#';
            html += `<button class="btn-sm-main" onclick="openLink('${item.title}', '${url}')">ดูตัวอย่างผลงาน</button>`;
        }

        card.innerHTML = html;
        container.appendChild(card);
    });

    // ถ้าแอดมินล็อกอินอยู่ ให้รีเฟรชการโชว์ปุ่มแอดมินใหม่
    if (document.body.classList.contains('is-admin')) {
        enableAdminPowers();
    }
}

// ================= 4. ระบบเพิ่ม/ลบ ข้อมูล (Add & Delete) =================
let activeCategory = '';

function openAddModal(category) {
    activeCategory = category;
    document.getElementById('add-input-title').value = '';
    document.getElementById('add-input-link').value = '';
    document.getElementById('add-img-preview').src = 'https://placehold.co/400x200/ffe4e1/ff69b4?text=+Click+to+Upload';
    
    // ถ้าหมวดป้ายไอดี ไม่ต้องใส่ลิงก์
    document.getElementById('add-input-link').style.display = (category === 'id') ? 'none' : 'block';
    
    document.getElementById('modal-add').classList.remove('hidden');
}

function previewAddImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => document.getElementById('add-img-preview').src = e.target.result;
        reader.readAsDataURL(file);
    }
}

function saveNewItem() {
    const title = document.getElementById('add-input-title').value;
    const link = document.getElementById('add-input-link').value;
    const imgData = document.getElementById('add-img-preview').src;

    if (!title || imgData.includes('placehold.co')) {
        alert('เอยจ๋า อย่าลืมใส่ชื่อผลงานกับรูปภาพนะคะ 🥰');
        return;
    }

    db[activeCategory].push({ title, link, img: imgData });
    saveDB();
    renderGallery(activeCategory);
    closeModal('modal-add');
    showToast('เพิ่มผลงานลงแกลลอรี่แล้ว! 🎉');
}

function deleteItem(category, index) {
    if (confirm('แน่ใจนะคะว่าจะลบผลงานชิ้นนี้? 🗑️')) {
        db[category].splice(index, 1);
        saveDB();
        renderGallery(category);
        showToast('ลบผลงานเรียบร้อยค่ะ');
    }
}

// ================= 5. ระบบแก้ไขภาพ (Edit Images) =================
let uploadTarget = { type: '', cat: '', index: null, id: '' };

// เปลี่ยนรูปโปรไฟล์ (Static)
function triggerStaticUpload(elementId) {
    uploadTarget = { type: 'static', id: elementId };
    document.getElementById('static-uploader').click();
}
function handleStaticUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById(uploadTarget.id).src = e.target.result;
            localStorage.setItem(uploadTarget.id, e.target.result);
            showToast('เปลี่ยนรูปภาพสำเร็จ! 🌸');
        };
        reader.readAsDataURL(file);
    }
}

// เปลี่ยนรูปในแกลลอรี่ (Dynamic)
function triggerGalleryUpload(category, index) {
    uploadTarget = { type: 'gallery', cat: category, index: index };
    document.getElementById('gallery-uploader').click();
}
function handleGalleryUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            db[uploadTarget.cat][uploadTarget.index].img = e.target.result;
            saveDB();
            renderGallery(uploadTarget.cat);
            showToast('อัปเดตรูปผลงานแล้ว! 🌸');
        };
        reader.readAsDataURL(file);
    }
}

// ================= 6. ระบบแอดมิน (Admin Login & Text Edit) =================
function toggleAdmin() {
    if (document.body.classList.contains('is-admin')) {
        if (confirm('ต้องการออกจากโหมดจัดการร้านใช่ไหมคะ? 🌸')) {
            document.body.classList.remove('is-admin');
            document.querySelectorAll('[contenteditable="true"]').forEach(el => el.setAttribute('contenteditable', 'false'));
            showToast('ออกจากระบบแอดมินแล้วค่ะ');
        }
    } else {
        document.getElementById('login-pass').value = '';
        document.getElementById('login-error').classList.add('hidden');
        document.getElementById('modal-login').classList.remove('hidden');
    }
}

function verifyAdmin() {
    const pass = document.getElementById('login-pass').value.trim().toLowerCase();
    if (pass === "ss11") {
        closeModal('modal-login');
        document.body.classList.add('is-admin');
        enableAdminPowers();
        alert('✨ เข้าสู่ระบบจัดการร้านสำเร็จ! ✨\n\n• เอยสามารถกดปุ่ม [+] เพิ่มผลงานได้เลย\n• กดที่รูป 📸 เพื่อเปลี่ยนรูปโปรไฟล์/รูปงาน\n• กดที่ [X] เพื่อลบผลงาน\n• คลิกที่ข้อความต่างๆ เพื่อพิมพ์แก้ได้ทันทีค่ะ!');
    } else {
        document.getElementById('login-error').classList.remove('hidden');
    }
}

function enableAdminPowers() {
    // ดึงคลาส .edit-text ทุกตัวมาทำให้พิมพ์แก้ได้
    document.querySelectorAll('.edit-text').forEach(el => {
        el.setAttribute('contenteditable', 'true');
        el.onblur = function() {
            // เมื่อพิมพ์เสร็จ (คลิกออก) ให้เซฟ
            if (!this.id) this.id = 'txt-' + Math.random().toString(36).substr(2, 9);
            
            // ถ้าเป็นข้อความในแกลลอรี่ เซฟลง DB
            if (this.id.startsWith('txt-') && this.id.split('-').length === 3) {
                const parts = this.id.split('-');
                const cat = parts[1];
                const idx = parseInt(parts[2]);
                if (db[cat] && db[cat][idx]) {
                    db[cat][idx].title = this.innerText;
                    saveDB();
                }
            } else {
                // ถ้าเป็นข้อความทั่วไป เซฟลง LocalStorage โดยตรง
                localStorage.setItem(this.id, this.innerText);
            }
            showToast('อัปเดตข้อความแล้ว! 📝');
        };
    });
}

function loadStaticData() {
    // โหลดรูปโปรไฟล์
    const savedProf = localStorage.getItem('img-profile');
    if (savedProf) document.getElementById('img-profile').src = savedProf;

    // โหลดข้อความทั่วไป (Bio, Desc)
    document.querySelectorAll('.edit-text').forEach(el => {
        if (el.id && !el.id.split('-').length === 3) { // ข้ามพวกที่เป็นแกลลอรี่
            const savedTxt = localStorage.getItem(el.id);
            if (savedTxt) el.innerText = savedTxt;
        }
    });
}

// ================= 7. ระบบ Modals & Utils =================
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function openZoom(src) {
    document.getElementById('zoom-img-display').src = src;
    document.getElementById('modal-image').classList.remove('hidden');
}

function openLink(title, url) {
    document.getElementById('link-title').innerText = title;
    document.getElementById('link-url').href = url || '#';
    document.getElementById('modal-link').classList.remove('hidden');
}

function showToast(msg) {
    const toast = document.getElementById('toast-msg');
    toast.innerText = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// เริ่มต้นการทำงานเมื่อหน้าเว็บโหลดเสร็จ
window.onload = initDB;
