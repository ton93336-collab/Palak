// ================= 1. ระบบ SPA (เปลี่ยนหน้าไร้รอยต่อ) =================
function navTo(pageId) {
    document.querySelectorAll('.page-section').forEach(sec => {
        sec.classList.remove('active');
        sec.classList.add('hidden');
    });
    const target = document.getElementById(pageId);
    target.classList.remove('hidden');
    void target.offsetWidth; // บังคับให้เบราว์เซอร์รีเฟรชอนิเมชัน
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' }); // เลื่อนจอธรรมดา ไม่ติดกล่องแล้ว
}

// ================= 2. ฐานข้อมูลจำลอง (LocalStorage) =================
let db = {};
const defaultDB = {
    web: [
        { title: 'เว็บโอนเงิน 69.-', link: 'https://example.com', img: 'https://placehold.co/400x250/ffe4e1/ff69b4?text=Web+Design' }
    ],
    id: [
        { title: 'ป้ายลายอนิเมะ', img: 'https://placehold.co/400x400/ffe4e1/ff69b4?text=ID+Banner' }
    ],
    decor: [], rov: [], idv: [], forms: [], course: []
};

function initData() {
    const saved = localStorage.getItem('db_eoy');
    if (saved) { db = JSON.parse(saved); } 
    else { db = defaultDB; saveDB(); }
    
    // โหลดผลงานทั้งหมด
    Object.keys(db).forEach(cat => renderGal(cat));
    // โหลดข้อความ&รูปคงที่
    loadStaticData();
}

function saveDB() { localStorage.setItem('db_eoy', JSON.stringify(db)); }

// ================= 3. RENDER GALLERY (สร้าง HTML จากข้อมูล) =================
function renderGal(cat) {
    const cont = document.getElementById(`gal-${cat}`);
    if (!cont) return;
    cont.innerHTML = ''; 

    if (db[cat].length === 0) {
        cont.innerHTML = `<p style="text-align:center; color:#ccc; font-size:13px; grid-column:1/-1;">ยังไม่มีผลงานจ้า 🌸</p>`;
        return;
    }

    db[cat].forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'card-work';

        // ป้ายไอดีกดขยายรูป หมวดอื่นกดดูลิงก์
        const isZoom = cat === 'id';
        const imgAct = isZoom ? `onclick="openZoom('${item.img}')"` : '';
        const zClass = isZoom ? 'zoomable' : '';
        
        // ปุ่มแอดมิน (ลบ / เปลี่ยนรูป) -> ผูกคลาส admin-ui เพื่อให้ CSS ซ่อน/โชว์ อัตโนมัติ
        const btnDel = `<button class="admin-ui btn-del-gal" onclick="delItem('${cat}', ${idx})"><i class="fa-solid fa-xmark"></i></button>`;
        const btnEditImg = `<button class="admin-ui btn-edit-gal" onclick="event.stopPropagation(); triggerGalleryImg('${cat}', ${idx})"><i class="fa-solid fa-camera"></i></button>`;

        let html = `
            ${btnDel}
            <div class="img-box ${zClass}" ${imgAct}>
                <img src="${item.img}" alt="work">
                ${btnEditImg}
            </div>
            <h4 class="edit-text" id="txt-${cat}-${idx}">${item.title}</h4>
        `;

        if (!isZoom) {
            const url = item.link || '#';
            html += `<button class="btn-sm-glow" onclick="openLink('${item.title}', '${url}')">ดูตัวอย่าง</button>`;
        }

        card.innerHTML = html;
        cont.appendChild(card);
    });

    // รีเฟรช Event Listener สำหรับพิมพ์แก้ข้อความทันทีหลังจากสร้างเสร็จ
    if (document.body.classList.contains('admin-mode')) {
        bindEditableText();
    }
}

// ================= 4. ADD & DELETE (เพิ่ม/ลบ) =================
let activeCat = '';

function openAddModal(cat) {
    activeCat = cat;
    document.getElementById('add-title').value = '';
    document.getElementById('add-link').value = '';
    document.getElementById('add-preview').src = 'https://placehold.co/400x200/ffe4e1/ff69b4?text=+Click+to+Upload';
    document.getElementById('add-link').style.display = (cat === 'id') ? 'none' : 'block';
    document.getElementById('modal-add').classList.remove('hidden');
}

function previewAddImg(e) {
    if(e.target.files[0]){
        const r = new FileReader();
        r.onload = ev => document.getElementById('add-preview').src = ev.target.result;
        r.readAsDataURL(e.target.files[0]);
    }
}

function saveNewItem() {
    const t = document.getElementById('add-title').value;
    const l = document.getElementById('add-link').value;
    const i = document.getElementById('add-preview').src;

    if (!t || i.includes('placehold.co')) {
        alert('เอยจ๋า ใส่ชื่อกับรูปก่อนน้าา 🥰'); return;
    }

    db[activeCat].push({ title: t, link: l, img: i });
    saveDB();
    renderGal(activeCat);
    closeModal('modal-add');
    showToast('เพิ่มผลงานแล้ว! 🎉');
}

function delItem(cat, idx) {
    if (confirm('ลบงานนี้ทิ้งเลยใช่ไหมคะ? 🗑️')) {
        db[cat].splice(idx, 1);
        saveDB();
        renderGal(cat);
        showToast('ลบเรียบร้อย!');
    }
}

// ================= 5. UPLOAD IMAGES (อัปโหลดเปลี่ยนรูป) =================
let uploadTarget = {};

// เปลี่ยนรูปโปรไฟล์ (หรือรูปอื่นๆ ที่ตั้งค่าตายตัว)
function editStaticImg(id) {
    uploadTarget = { type: 'static', id: id };
    document.getElementById('static-file').click();
}
function handleStaticImg(e) {
    if(e.target.files[0]) {
        const r = new FileReader();
        r.onload = ev => {
            document.getElementById(uploadTarget.id).src = ev.target.result;
            localStorage.setItem(uploadTarget.id, ev.target.result);
            showToast('เปลี่ยนรูปสำเร็จ! 🌸');
        };
        r.readAsDataURL(e.target.files[0]);
    }
}

// เปลี่ยนรูปในแกลลอรี่เจาะจงชิ้น
function triggerGalleryImg(cat, idx) {
    uploadTarget = { type: 'gal', cat: cat, idx: idx };
    document.getElementById('gallery-file').click();
}
function handleGalleryImg(e) {
    if(e.target.files[0]) {
        const r = new FileReader();
        r.onload = ev => {
            db[uploadTarget.cat][uploadTarget.idx].img = ev.target.result;
            saveDB();
            renderGal(uploadTarget.cat);
            showToast('อัปเดตรูปผลงานแล้ว! 🌸');
        };
        r.readAsDataURL(e.target.files[0]);
    }
}

// ================= 6. ADMIN SYSTEM =================
function toggleAdmin() {
    if (document.body.classList.contains('admin-mode')) {
        if(confirm('ปิดโหมดแอดมินนะคะ? 🌸')) {
            document.body.classList.remove('admin-mode');
            document.querySelectorAll('[contenteditable="true"]').forEach(el => el.setAttribute('contenteditable', 'false'));
            showToast('ออกจากระบบจัดการร้าน');
        }
    } else {
        document.getElementById('login-pass').value = '';
        document.getElementById('login-err').classList.add('hidden');
        document.getElementById('modal-login').classList.remove('hidden');
    }
}

function verifyAdmin() {
    const p = document.getElementById('login-pass').value.trim().toLowerCase();
    if (p === "ss11") {
        closeModal('modal-login');
        document.body.classList.add('admin-mode');
        bindEditableText();
        alert('✨ เข้าระบบแอดมินสำเร็จ! ✨\n\nปุ่มเปลี่ยนรูป (📸) และปุ่มลบ (X) โผล่ขึ้นมาแล้วค่ะ\nและด้านล่างสุดของทุกหมวดจะมีปุ่ม [+ เพิ่มผลงาน]\nส่วนข้อความต่างๆ คลิกพิมพ์แก้ได้เลยนะคะ!');
    } else {
        document.getElementById('login-err').classList.remove('hidden');
    }
}

function bindEditableText() {
    document.querySelectorAll('.edit-text').forEach(el => {
        el.setAttribute('contenteditable', 'true');
        el.onblur = function() {
            if(!this.id) this.id = 'txt-' + Math.random().toString(36).substr(2, 9);
            
            if(this.id.startsWith('txt-') && this.id.split('-').length === 3) {
                const parts = this.id.split('-');
                if(db[parts[1]] && db[parts[1]][parts[2]]) {
                    db[parts[1]][parts[2]].title = this.innerText;
                    saveDB();
                }
            } else {
                localStorage.setItem(this.id, this.innerText);
            }
            showToast('เซฟข้อความแล้ว! 📝');
        };
    });
}

function loadStaticData() {
    const prof = localStorage.getItem('img-profile');
    if(prof) document.getElementById('img-profile').src = prof;

    document.querySelectorAll('.edit-text').forEach(el => {
        if (el.id && el.id.split('-').length !== 3) {
            const txt = localStorage.getItem(el.id);
            if(txt) el.innerText = txt;
        }
    });
}

// ================= 7. UTILS & MODALS =================
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function openZoom(src) { document.getElementById('zoom-img').src = src; document.getElementById('modal-img').classList.remove('hidden'); }
function openLink(t, u) { document.getElementById('link-title').innerText = t; document.getElementById('link-url').href = u || '#'; document.getElementById('modal-link').classList.remove('hidden'); }
function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg; t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
}

// รันตอนเริ่ม
window.onload = initData;
