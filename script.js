// ================= 1. TOAST NOTIFICATION (แก้บั๊กค้าง) =================
let toastTimeout;
function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toast-text');
    
    toastText.innerText = msg;
    toast.classList.remove('hidden'); // เอาคลาส hidden ออกเพื่อความชัวร์
    
    // บังคับ Reflow แล้วใส่คลาส show เพื่อให้อนิเมชันทำงาน
    void toast.offsetWidth;
    toast.classList.add('show');
    
    // เคลียร์เวลาเก่าถ้ามีการกดรัวๆ
    clearTimeout(toastTimeout);
    
    // ตั้งเวลาซ่อน
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ================= 2. NAVIGATION (เลื่อนหน้าจออิสระ ไม่ติดกล่อง) =================
function navTo(pageId) {
    document.querySelectorAll('.page-section').forEach(sec => {
        sec.classList.remove('active');
        sec.classList.add('hidden');
    });
    
    const target = document.getElementById(pageId);
    target.classList.remove('hidden');
    void target.offsetWidth; 
    target.classList.add('active');
    
    // เลื่อนหน้าต่างหลักกลับไปบนสุดแบบสมูท
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================= 3. DATABASE (LocalStorage) =================
let db = {};
const defaultDB = {
    web: [
        { title: 'เว็บโอนเงิน 69.-', link: 'https://example.com', img: 'https://placehold.co/400x250/fdf0f4/d67a8d?text=Web+Preview' }
    ],
    id: [
        { title: 'ป้ายลายมินิมอล', img: 'https://placehold.co/400x400/fdf0f4/d67a8d?text=Banner' }
    ],
    decor: [], rov: [], idv: [], forms: [], course: []
};

function initData() {
    const saved = localStorage.getItem('studio_data_v2');
    if (saved) { db = JSON.parse(saved); } 
    else { db = defaultDB; saveDB(); }
    
    Object.keys(db).forEach(cat => renderGal(cat));
    loadStaticData();
}

function saveDB() { localStorage.setItem('studio_data_v2', JSON.stringify(db)); }

// ================= 4. RENDER GALLERY =================
function renderGal(cat) {
    const cont = document.getElementById(`gal-${cat}`);
    if (!cont) return;
    cont.innerHTML = ''; 

    if (db[cat].length === 0) {
        cont.innerHTML = `<p style="text-align:center; color:#ccc; font-size:13px; grid-column:1/-1; padding: 20px;">ยังไม่มีผลงานค่ะ</p>`;
        return;
    }

    db[cat].forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'card-work';

        const isZoom = cat === 'id';
        const imgAct = isZoom ? `onclick="openZoom('${item.img}')"` : '';
        const zClass = isZoom ? 'zoomable' : '';
        
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

    if (document.body.classList.contains('admin-mode')) {
        bindEditableText();
    }
}

// ================= 5. ADD & DELETE =================
let activeCat = '';

function openAddModal(cat) {
    activeCat = cat;
    document.getElementById('add-title').value = '';
    document.getElementById('add-link').value = '';
    document.getElementById('add-preview').src = 'https://placehold.co/400x200/fdf0f4/d67a8d?text=Tap+to+Upload';
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
        alert('กรุณาใส่ชื่องานและอัปโหลดรูปค่ะ'); return;
    }

    db[activeCat].push({ title: t, link: l, img: i });
    saveDB();
    renderGal(activeCat);
    closeModal('modal-add');
    showToast('เพิ่มผลงานเรียบร้อย!');
}

function delItem(cat, idx) {
    if (confirm('ยืนยันการลบผลงานนี้?')) {
        db[cat].splice(idx, 1);
        saveDB();
        renderGal(cat);
        showToast('ลบผลงานแล้ว');
    }
}

// ================= 6. UPLOAD IMAGES =================
let uploadTarget = {};

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
            showToast('อัปเดตรูปภาพสำเร็จ');
        };
        r.readAsDataURL(e.target.files[0]);
    }
}

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
            showToast('อัปเดตรูปผลงานแล้ว');
        };
        r.readAsDataURL(e.target.files[0]);
    }
}

// ================= 7. ADMIN SYSTEM =================
function toggleAdmin() {
    if (document.body.classList.contains('admin-mode')) {
        if(confirm('ออกจากระบบจัดการร้าน?')) {
            document.body.classList.remove('admin-mode');
            document.querySelectorAll('[contenteditable="true"]').forEach(el => el.setAttribute('contenteditable', 'false'));
            showToast('ออกจากระบบแอดมิน');
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
        showToast('เข้าสู่ระบบแอดมินสำเร็จ!');
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
            showToast('บันทึกข้อความแล้ว');
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

// ================= 8. MODALS & UTILS =================
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function openZoom(src) { document.getElementById('zoom-img').src = src; document.getElementById('modal-img').classList.remove('hidden'); }
function openLink(t, u) { document.getElementById('link-title').innerText = t; document.getElementById('link-url').href = u || '#'; document.getElementById('modal-link').classList.remove('hidden'); }

// Init
window.onload = initData;
