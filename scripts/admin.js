const API = 'http://localhost:3001/api';

document.addEventListener('DOMContentLoaded', () => {
    const s = JSON.parse(localStorage.getItem('adminSession'));
    if (!s || !s.loggedIn) { window.location.replace('admin-login.html'); return; }
    if (new Date().getTime() - s.timestamp > 24 * 3600 * 1000) {
        localStorage.removeItem('adminSession');
        window.location.replace('admin-login.html'); return;
    }
    document.getElementById('adminName').textContent = s.admin.name || 'Admin';
    loadDashboard();
    if (window.lucide) lucide.createIcons();
});

function logout() {
    localStorage.removeItem('adminSession');
    window.location.replace('admin-login.html');
}

function showSection(name, el) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(name + 'Section').classList.add('active');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if (el) el.closest('.nav-item').classList.add('active');
    const titles = { dashboard:'Admin Dashboard', courses:'Course Management', users:'User Management', reviews:'Reviews', testseries:'Test Series' };
    document.getElementById('pageTitle').textContent = titles[name] || name;
    if (name === 'courses') loadCourses();
    if (name === 'users')   loadUsers();
    if (name === 'reviews') loadReviews();
    if (name === 'testseries') loadTestSeriesAdmin();
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
    // Create overlay if needed
    let overlay = document.getElementById('sidebarOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebarOverlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:1099;display:none;';
        overlay.onclick = () => { sidebar.classList.remove('active'); overlay.style.display='none'; };
        document.body.appendChild(overlay);
    }
    overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
}


function loadDashboard() {
    fetch(`${API}/admin/stats/users`).then(r=>r.json()).then(d=>{ if(d.success) document.getElementById('totalUsers').textContent=d.count; });
    fetch(`${API}/courses`).then(r=>r.json()).then(d=>{ if(d.success) document.getElementById('totalCourses').textContent=d.courses.length; });
    fetch(`${API}/admin/stats/enrollments`).then(r=>r.json()).then(d=>{ if(d.success) document.getElementById('totalEnrollments').textContent=d.count; });
    fetch(`${API}/admin/stats/reviews`).then(r=>r.json()).then(d=>{ if(d.success) document.getElementById('totalReviews').textContent=d.count; });
    fetch(`${API}/test-series/admin/list`).then(r=>r.json()).then(d=>{ if(d.success) document.getElementById('totalTests').textContent=d.tests.length; });
    fetch(`${API}/admin/users`).then(r=>r.json()).then(d=>{
        if (!d.success) return;
        document.getElementById('recentUsers').innerHTML = d.users.slice(0,5).map(u=>`
            <div class="list-item">
                <img src="${u.avatar_url||'assets/default-avatar.png'}" alt="${u.full_name}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">
                <div class="list-item-info"><h4>${u.full_name}</h4><p>${u.email}</p></div>
            </div>`).join('');
        if (window.lucide) lucide.createIcons();
    });
    fetch(`${API}/courses`).then(r=>r.json()).then(d=>{
        if (!d.success) return;
        const sorted = [...d.courses].sort((a,b)=>b.total_students-a.total_students).slice(0,5);
        document.getElementById('popularCourses').innerHTML = sorted.map(c=>`
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${c.title}</h4>
                    <p>${c.total_students||0} students · ₹${c.price} · <i data-lucide="star" class="icon-inline"></i>${c.average_rating||0}</p>
                </div>
            </div>`).join('');
        if (window.lucide) lucide.createIcons();
    });
}


let allCourses = [];
function loadCourses() {
    fetch(`${API}/courses`).then(r=>r.json()).then(d=>{
        if (!d.success) return;
        allCourses = d.courses;
        renderCourses(allCourses);
    });
}
function renderCourses(courses) {
    document.getElementById('coursesGrid').innerHTML = courses.map(c=>`
        <div class="admin-course-card">
            <div class="course-card-header">
                <span class="difficulty-badge diff-${(c.difficulty_level||'Beginner').toLowerCase()}">${c.difficulty_level||'Beginner'}</span>
                <h3 class="course-card-title">${c.title}</h3>
            </div>
            <div class="course-card-body">
                <p class="course-desc">${(c.description||'').substring(0,100)}…</p>
                <div class="course-meta-row"><span><i data-lucide="user" class="icon-inline"></i> ${c.instructor_name}</span><span><i data-lucide="indian-rupee" class="icon-inline"></i> ${c.price}</span><span><i data-lucide="clock" class="icon-inline"></i> ${c.duration_hours}h</span></div>
                <div class="course-meta-row"><span><i data-lucide="users" class="icon-inline"></i> ${c.total_students||0} students</span><span><i data-lucide="star" class="icon-inline"></i> ${c.average_rating||0}</span><span><i data-lucide="book" class="icon-inline"></i> ${c.total_lessons||0} lessons</span></div>
            </div>
            <div class="course-card-footer">
                <button class="btn-icon btn-edit" onclick="openEditCourse(${c.id})"><i data-lucide="edit-3"></i> Edit</button>
                <button class="btn-icon btn-manage" onclick="openManageLessons(${c.id})"><i data-lucide="list"></i> Lessons</button>
                <button class="btn-icon btn-delete" onclick="deleteCourse(${c.id})"><i data-lucide="trash-2"></i> Delete</button>
            </div>
        </div>`).join('');
    if (window.lucide) lucide.createIcons();
}
function filterCourses(q) {
    const t = q.toLowerCase();
    renderCourses(allCourses.filter(c=>c.title.toLowerCase().includes(t)||(c.instructor_name||'').toLowerCase().includes(t)));
}
function escHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/'/g,'&#39;'); }

// Course Builder
let builderSections = [];

function openCourseBuilder() {
    builderSections = [];
    document.getElementById('builderTitle').textContent = 'Create New Course';
    ['bTitle','bDescription','bInstructor','bTags'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('bPrice').value='0';
    document.getElementById('bDuration').value='10';
    document.getElementById('bDifficulty').value='Beginner';
    renderSectionsList();
    goToStep(1);
    document.getElementById('courseBuilderModal').classList.add('active');
}

function goToStep(n) {
    [1,2,3].forEach(i=>{
        document.getElementById(`builderStep${i}`).classList.toggle('active',i===n);
        document.getElementById(`step${i}Tab`).classList.toggle('active',i===n);
    });
    if (n===3) renderReviewSummary();
}

function addSection() {
    builderSections.push({ title:`Section ${builderSections.length+1}`, lessons:[] });
    renderSectionsList();
}

function renderSectionsList() {
    const el = document.getElementById('sectionsList');
    if (!builderSections.length) {
        el.innerHTML='<div class="empty-sections">No sections yet. Click "+ Add Section" to start.</div>';
        return;
    }
    el.innerHTML = builderSections.map((sec,si)=>`
        <div class="section-builder-item">
            <div class="section-builder-header">
                <input class="section-title-input" value="${escHtml(sec.title)}" onchange="builderSections[${si}].title=this.value">
                <div class="section-header-actions">
                    <button class="btn-sm btn-primary" onclick="openLessonModal(${si})">+ Add Lesson</button>
                    <button class="btn-sm btn-delete" onclick="removeSection(${si})"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
            <div class="lessons-list">
                ${!sec.lessons.length ? '<p class="no-lessons">No lessons yet</p>' :
                sec.lessons.map((l,li)=>`
                    <div class="lesson-builder-item">
                        <span class="lesson-type-dot type-${l.type}"></span>
                        <span class="lesson-builder-title">${l.title}</span>
                        <span class="lesson-builder-meta">${l.type} · ${l.duration}min</span>
                        <div class="lesson-builder-actions">
                            <button class="btn-sm btn-edit" onclick="editLesson(${si},${li})"><i data-lucide="edit-2"></i></button>
                            <button class="btn-sm btn-delete" onclick="removeLesson(${si},${li})"><i data-lucide="trash-2"></i></button>
                        </div>
                    </div>`).join('')}
            </div>
        </div>`).join('');
    if (window.lucide) lucide.createIcons();
}

function removeSection(si){ if(confirm('Remove section?')){ builderSections.splice(si,1); renderSectionsList(); } }
function removeLesson(si,li){ builderSections[si].lessons.splice(li,1); renderSectionsList(); }

// Lesson Modal
let currentSectionIdx = -1, currentLessonIdx = -1;
window._quizQuestions = [];

function openLessonModal(si, li=-1) {
    currentSectionIdx=si; currentLessonIdx=li;
    document.getElementById('lessonModalTitle').textContent = li>=0 ? 'Edit Lesson' : 'Add Lesson';
    if (li>=0) {
        const l = builderSections[si].lessons[li];
        document.getElementById('lTitle').value = l.title;
        document.getElementById('lType').value = l.type;
        document.getElementById('lDuration').value = l.duration;
        document.getElementById('lDescription').value = l.description||'';
        document.getElementById('lVideoUrl').value = l.videoUrl||'';
        document.getElementById('lArticleContent').value = l.articleContent||'';
        window._quizQuestions = l.questions ? JSON.parse(JSON.stringify(l.questions)) : [];
    } else {
        ['lTitle','lDescription','lVideoUrl','lArticleContent'].forEach(id=>document.getElementById(id).value='');
        document.getElementById('lType').value='video';
        document.getElementById('lDuration').value='10';
        window._quizQuestions=[];
    }
    updateLessonTypeFields();
    renderQuizQuestions();
    document.getElementById('lessonModal').classList.add('active');
}

function editLesson(si,li){ openLessonModal(si,li); }

function updateLessonTypeFields() {
    const t = document.getElementById('lType').value;
    document.getElementById('videoFields').style.display   = t==='video'   ? '' : 'none';
    document.getElementById('articleFields').style.display = t==='article' ? '' : 'none';
    document.getElementById('quizFields').style.display    = t==='quiz'    ? '' : 'none';
}

function saveLesson() {
    const title = document.getElementById('lTitle').value.trim();
    if (!title) { alert('Lesson title is required'); return; }
    const type = document.getElementById('lType').value;
    if (type === 'quiz' && window._quizQuestions.length > 0) {
        for (let i = 0; i < window._quizQuestions.length; i++) {
            const q = window._quizQuestions[i];
            if (!q.question_text.trim()) { alert(`Q${i+1}: Question text is required`); return; }
            if (!q.option_a.trim() || !q.option_b.trim()) { alert(`Q${i+1}: At least options A and B are required`); return; }
        }
    }
    let videoUrl = document.getElementById('lVideoUrl').value.trim();
    if (videoUrl) videoUrl = toEmbedUrl(videoUrl);
    const lesson = {
        title, type,
        duration: parseInt(document.getElementById('lDuration').value)||10,
        description: document.getElementById('lDescription').value.trim(),
        videoUrl,
        articleContent: document.getElementById('lArticleContent').value.trim(),
        questions: window._quizQuestions||[]
    };
    if (currentLessonIdx>=0) builderSections[currentSectionIdx].lessons[currentLessonIdx]=lesson;
    else builderSections[currentSectionIdx].lessons.push(lesson);
    renderSectionsList();
    closeModal('lessonModal');
}

function toEmbedUrl(url) {
    if (url.includes('youtube.com/embed/')) return url;
    const s = url.match(/youtu\.be\/([^?&\s]+)/);
    if (s) return `https://www.youtube.com/embed/${s[1]}`;
    const w = url.match(/[?&]v=([^&\s]+)/);
    if (w) return `https://www.youtube.com/embed/${w[1]}`;
    return url;
}

function addQuizQuestion() {
    window._quizQuestions.push({question_text:'',option_a:'',option_b:'',option_c:'',option_d:'',correct_answer:'A',explanation:''});
    renderQuizQuestions();
}
function removeQuizQ(i){ window._quizQuestions.splice(i,1); renderQuizQuestions(); }

function renderQuizQuestions() {
    const el = document.getElementById('quizQuestionsBuilder');
    if (!el) return;
    if (!window._quizQuestions.length) {
        el.innerHTML = '<p style="color:#94a3b8;font-size:13px;padding:8px 0;">No questions yet. Click "+ Add Question" to start.</p>';
        return;
    }
    el.innerHTML = window._quizQuestions.map((q, i) => `
        <div class="quiz-q-builder">
            <div class="quiz-q-header">
                <span class="quiz-q-num">Q${i + 1}</span>
                <button class="btn-sm btn-delete" onclick="removeQuizQ(${i})"><i data-lucide="trash-2"></i></button>
            </div>
            <div class="form-group">
                <label>Question *</label>
                <input type="text" placeholder="e.g. What is the output of print(2+2)?" value="${escHtml(q.question_text)}" oninput="window._quizQuestions[${i}].question_text=this.value">
            </div>
            <div class="quiz-options-list">
                ${['A','B','C','D'].map(opt => `
                    <div class="quiz-option-row ${q.correct_answer === opt ? 'is-correct' : ''}" id="qopt-${i}-${opt}" onclick="setCorrectAnswer('_quizQuestions',${i},'${opt}')">
                        <div class="quiz-option-radio">
                            <div class="radio-dot ${q.correct_answer === opt ? 'active' : ''}"></div>
                        </div>
                        <span class="quiz-option-label">${opt}</span>
                        <input type="text" class="quiz-option-input" placeholder="Option ${opt}" value="${escHtml(q['option_' + opt.toLowerCase()])}"
                            oninput="window._quizQuestions[${i}].option_${opt.toLowerCase()}=this.value"
                            onclick="event.stopPropagation()">
                        ${q.correct_answer === opt ? '<span class="correct-tag">✓ Correct</span>' : ''}
                    </div>`).join('')}
            </div>
            <div class="form-group" style="margin-top:10px;margin-bottom:0;">
                <label>Explanation <span style="color:#9ca3af;font-weight:400;">(optional)</span></label>
                <input type="text" placeholder="Why is this the correct answer?" value="${escHtml(q.explanation)}" oninput="window._quizQuestions[${i}].explanation=this.value">
            </div>
        </div>`).join('');
    if (window.lucide) lucide.createIcons();
}

function setCorrectAnswer(arr, i, opt) {
    window[arr][i].correct_answer = opt;
    if (arr === '_quizQuestions') renderQuizQuestions();
    else renderManageQuizQuestions();
}

// Review summary
function renderReviewSummary() {
    const title = document.getElementById('bTitle').value||'(untitled)';
    const totalLessons = builderSections.reduce((s,sec)=>s+sec.lessons.length,0);
    document.getElementById('reviewSummary').innerHTML = `
        <div class="review-card-summary">
            <h3>${title}</h3>
            <div class="review-meta-grid">
                <div><span class="review-label">Instructor</span><span>${document.getElementById('bInstructor').value||'—'}</span></div>
                <div><span class="review-label">Price</span><span>₹${document.getElementById('bPrice').value||0}</span></div>
                <div><span class="review-label">Difficulty</span><span>${document.getElementById('bDifficulty').value}</span></div>
                <div><span class="review-label">Sections</span><span>${builderSections.length}</span></div>
                <div><span class="review-label">Total Lessons</span><span>${totalLessons}</span></div>
            </div>
            <div class="review-sections">
                ${builderSections.map((sec,i)=>`
                    <div class="review-section-item">
                        <strong>Section ${i+1}: ${sec.title}</strong>
                        <ul>${sec.lessons.map(l=>`<li>${l.type==='video'?'<i data-lucide="play-circle" class="icon-inline"></i>':l.type==='article'?'<i data-lucide="file-text" class="icon-inline"></i>':'<i data-lucide="help-circle" class="icon-inline"></i>'} ${l.title} (${l.duration}min)</li>`).join('')}</ul>
                    </div>`).join('')}
            </div>
        </div>`;
    if (window.lucide) lucide.createIcons();
}

// Publish
async function publishCourse() {
    const title = document.getElementById('bTitle').value.trim();
    const instructor = document.getElementById('bInstructor').value.trim();
    if (!title||!instructor) { alert('Course title and instructor are required'); goToStep(1); return; }
    const btn = document.getElementById('publishBtn');
    btn.disabled=true; btn.textContent='⏳ Publishing…';
    try {
        const courseRes = await fetch(`${API}/admin/courses`,{
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
                title, description: document.getElementById('bDescription').value.trim(),
                instructor_name: instructor,
                difficulty_level: document.getElementById('bDifficulty').value,
                price: parseFloat(document.getElementById('bPrice').value)||0,
                duration_hours: parseInt(document.getElementById('bDuration').value)||10,
                total_lessons: builderSections.reduce((s,sec)=>s+sec.lessons.length,0)
            })
        }).then(r=>r.json());
        if (!courseRes.success) throw new Error(courseRes.message||'Failed to create course');
        const courseId = courseRes.course_id;

        for (let si=0; si<builderSections.length; si++) {
            const sec = builderSections[si];
            const secRes = await fetch(`${API}/admin/courses/${courseId}/sections`,{
                method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({title:sec.title, order_index:si+1})
            }).then(r=>r.json());
            if (!secRes.success) continue;
            const sectionId = secRes.section_id;

            for (let li=0; li<sec.lessons.length; li++) {
                const l = sec.lessons[li];
                const lessonRes = await fetch(`${API}/admin/sections/${sectionId}/lessons`,{
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body: JSON.stringify({
                        course_id:courseId, title:l.title, description:l.description,
                        content_type:l.type, video_url:l.videoUrl||null,
                        article_content:l.articleContent||null,
                        duration_minutes:l.duration, order_index:li+1
                    })
                }).then(r=>r.json());
                if (l.type==='quiz' && l.questions.length>0 && lessonRes.success) {
                    await fetch(`${API}/admin/lessons/${lessonRes.lesson_id}/questions`,{
                        method:'POST', headers:{'Content-Type':'application/json'},
                        body: JSON.stringify({questions:l.questions})
                    });
                }
            }
        }
        showNotification('🎉 Course published! Students can now see it in Browse Courses.');
        closeModal('courseBuilderModal');
        loadCourses();
    } catch(err) {
        alert('Error: '+err.message);
    } finally {
        btn.disabled=false; btn.textContent='🚀 Publish Course';
    }
}

// Manage lessons for existing course
function openManageLessons(courseId) {
    fetch(`${API}/courses/${courseId}`).then(r=>r.json()).then(async d=>{
        if (!d.success) return;
        const c = d.course;
        document.getElementById('manageCourseId').value = courseId;
        document.getElementById('manageCourseName').textContent = c.title;
        document.getElementById('manageCourseModal').classList.add('active');
        loadManageCurriculum(courseId);
    });
}

let manageCourseId = null;

function loadManageCurriculum(courseId) {
    manageCourseId = courseId;
    const container = document.getElementById('manageCurriculumList');
    container.innerHTML = '<p style="color:#9ca3af;padding:20px;text-align:center;">Loading…</p>';
    fetch(`${API}/courses/${courseId}/curriculum`).then(r=>r.json()).then(d=>{
        if (!d.success || !d.curriculum.length) {
            container.innerHTML = '<p style="color:#9ca3af;padding:20px;text-align:center;">No sections yet. Add one below.</p>';
            return;
        }
        container.innerHTML = d.curriculum.map(sec=>`
            <div class="manage-section" id="msec-${sec.id}">
                <div class="manage-section-header">
                    <span class="manage-section-title"><i data-lucide="folder" style="width:15px;height:15px;margin-right:6px;vertical-align:middle;"></i>${sec.title}</span>
                    <button class="btn-sm btn-primary" onclick="openAddLessonToSection(${sec.id}, ${courseId})">+ Add Lesson</button>
                </div>
                <div class="manage-lessons-list">
                    ${!sec.lessons.length ? '<p style="color:#9ca3af;font-size:13px;padding:8px 12px;">No lessons yet</p>' :
                    sec.lessons.map(l=>`
                        <div class="manage-lesson-item">
                            <span class="lesson-type-dot type-${l.content_type}"></span>
                            <span class="manage-lesson-title">${l.title}</span>
                            <span class="manage-lesson-meta">${l.content_type} · ${l.duration_minutes}min${l.content_type==='quiz'?' · <span style="color:#8b5cf6;font-weight:600;">Quiz</span>':''}</span>
                            <div style="display:flex;gap:6px;margin-left:auto;">
                                <button class="btn-sm btn-edit" onclick="openEditExistingLesson(${l.id}, ${sec.id}, ${courseId})" title="Edit lesson"><i data-lucide="edit-2"></i></button>
                                <button class="btn-sm btn-delete" onclick="deleteLesson(${l.id}, ${courseId})" title="Delete lesson"><i data-lucide="trash-2"></i></button>
                            </div>
                        </div>`).join('')}
                </div>
            </div>`).join('');
        if (window.lucide) lucide.createIcons();
    });
}

function addSectionToExistingCourse() {
    const title = document.getElementById('newSectionTitle').value.trim();
    if (!title) { alert('Section title required'); return; }
    const courseId = document.getElementById('manageCourseId').value;
    fetch(`${API}/admin/courses/${courseId}/sections`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ title, order_index: 99 })
    }).then(r=>r.json()).then(d=>{
        if (!d.success) { alert(d.message); return; }
        document.getElementById('newSectionTitle').value = '';
        showNotification('Section added');
        loadManageCurriculum(courseId);
    });
}

let addLessonSectionId = null, addLessonCourseId = null, editLessonId = null;
window._manageLessonQuestions = [];

function openAddLessonToSection(sectionId, courseId) {
    addLessonSectionId = sectionId;
    addLessonCourseId = courseId;
    editLessonId = null;
    window._manageLessonQuestions = [];
    document.getElementById('manageLessonModalTitle').textContent = 'Add Lesson';
    ['mlTitle','mlDescription','mlVideoUrl','mlArticleContent'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('mlType').value = 'video';
    document.getElementById('mlDuration').value = '10';
    updateManageLessonFields();
    renderManageQuizQuestions();
    document.getElementById('manageLessonModal').classList.add('active');
}

function openEditExistingLesson(lessonId, sectionId, courseId) {
    addLessonSectionId = sectionId;
    addLessonCourseId = courseId;
    editLessonId = lessonId;
    window._manageLessonQuestions = [];
    fetch(`${API}/lessons/${lessonId}`).then(r=>r.json()).then(d=>{
        if (!d.success) return;
        const l = d.lesson;
        document.getElementById('manageLessonModalTitle').textContent = 'Edit Lesson';
        document.getElementById('mlTitle').value = l.title||'';
        document.getElementById('mlType').value = l.content_type||'video';
        document.getElementById('mlDuration').value = l.duration_minutes||10;
        document.getElementById('mlDescription').value = l.description||'';
        document.getElementById('mlVideoUrl').value = l.video_url||'';
        document.getElementById('mlArticleContent').value = l.article_content||'';
        updateManageLessonFields();
        if (l.content_type === 'quiz') {
            fetch(`${API}/admin/lessons/${lessonId}/questions`).then(r=>r.json()).then(qd=>{
                if (qd.success && qd.questions.length) {
                    window._manageLessonQuestions = qd.questions.map(q=>({
                        question_text: q.question_text,
                        option_a: q.option_a,
                        option_b: q.option_b,
                        option_c: q.option_c,
                        option_d: q.option_d,
                        correct_answer: q.correct_answer,
                        explanation: q.explanation||''
                    }));
                }
                renderManageQuizQuestions();
            });
        } else {
            renderManageQuizQuestions();
        }
        document.getElementById('manageLessonModal').classList.add('active');
    });
}

function updateManageLessonFields() {
    const t = document.getElementById('mlType').value;
    document.getElementById('mlVideoFields').style.display   = t==='video'   ? '' : 'none';
    document.getElementById('mlArticleFields').style.display = t==='article' ? '' : 'none';
    document.getElementById('mlQuizFields').style.display    = t==='quiz'    ? '' : 'none';
}

function saveManageLesson() {
    const title = document.getElementById('mlTitle').value.trim();
    if (!title) { alert('Lesson title required'); return; }
    const type = document.getElementById('mlType').value;
    if (type === 'quiz' && window._manageLessonQuestions.length > 0) {
        for (let i = 0; i < window._manageLessonQuestions.length; i++) {
            const q = window._manageLessonQuestions[i];
            if (!q.question_text.trim()) { alert(`Q${i+1}: Question text is required`); return; }
            if (!q.option_a.trim() || !q.option_b.trim()) { alert(`Q${i+1}: At least options A and B are required`); return; }
        }
    }
    let videoUrl = document.getElementById('mlVideoUrl').value.trim();
    if (videoUrl) videoUrl = toEmbedUrl(videoUrl);
    const payload = {
        title, content_type: type,
        duration_minutes: parseInt(document.getElementById('mlDuration').value)||10,
        description: document.getElementById('mlDescription').value.trim(),
        video_url: videoUrl||null,
        article_content: document.getElementById('mlArticleContent').value.trim()||null,
        course_id: addLessonCourseId,
        order_index: 99
    };

    const req = editLessonId
        ? fetch(`${API}/admin/lessons/${editLessonId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
        : fetch(`${API}/admin/sections/${addLessonSectionId}/lessons`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });

    req.then(r=>r.json()).then(async d=>{
        if (!d.success) { alert(d.message||'Error saving lesson'); return; }
        const lessonId = editLessonId || d.lesson_id;
        if (type === 'quiz') {
            const method = editLessonId ? 'PUT' : 'POST';
            await fetch(`${API}/admin/lessons/${lessonId}/questions`, {
                method, headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ questions: window._manageLessonQuestions })
            });
        }
        showNotification(editLessonId ? 'Lesson updated — visible to students now!' : 'Lesson added — visible to students now!');
        closeModal('manageLessonModal');
        loadManageCurriculum(addLessonCourseId);
    });
}

function addManageQuizQuestion() {
    window._manageLessonQuestions.push({question_text:'',option_a:'',option_b:'',option_c:'',option_d:'',correct_answer:'A',explanation:''});
    renderManageQuizQuestions();
}

function deleteLesson(lessonId, courseId) {
    if (!confirm('Delete this lesson? This cannot be undone.')) return;
    fetch(`${API}/admin/lessons/${lessonId}`, { method:'DELETE' })
        .then(r=>r.json()).then(d=>{
            if (d.success) { showNotification('Lesson deleted'); loadManageCurriculum(courseId); }
            else alert(d.message||'Error deleting lesson');
        });
}
function removeManageQuizQ(i){ window._manageLessonQuestions.splice(i,1); renderManageQuizQuestions(); }
function renderManageQuizQuestions() {
    const el = document.getElementById('mlQuizQuestionsBuilder');
    if (!el) return;
    if (!window._manageLessonQuestions.length) {
        el.innerHTML = '<p style="color:#94a3b8;font-size:13px;padding:8px 0;">No questions yet. Click "+ Add Question" to start.</p>';
        return;
    }
    el.innerHTML = window._manageLessonQuestions.map((q, i) => `
        <div class="quiz-q-builder">
            <div class="quiz-q-header">
                <span class="quiz-q-num">Q${i + 1}</span>
                <button class="btn-sm btn-delete" onclick="removeManageQuizQ(${i})"><i data-lucide="trash-2"></i></button>
            </div>
            <div class="form-group">
                <label>Question *</label>
                <input type="text" placeholder="e.g. What is the output of print(2+2)?" value="${escHtml(q.question_text)}" oninput="window._manageLessonQuestions[${i}].question_text=this.value">
            </div>
            <div class="quiz-options-list">
                ${['A','B','C','D'].map(opt => `
                    <div class="quiz-option-row ${q.correct_answer === opt ? 'is-correct' : ''}" id="mlqopt-${i}-${opt}" onclick="setCorrectAnswer('_manageLessonQuestions',${i},'${opt}')">
                        <div class="quiz-option-radio">
                            <div class="radio-dot ${q.correct_answer === opt ? 'active' : ''}"></div>
                        </div>
                        <span class="quiz-option-label">${opt}</span>
                        <input type="text" class="quiz-option-input" placeholder="Option ${opt}" value="${escHtml(q['option_' + opt.toLowerCase()])}"
                            oninput="window._manageLessonQuestions[${i}].option_${opt.toLowerCase()}=this.value"
                            onclick="event.stopPropagation()">
                        ${q.correct_answer === opt ? '<span class="correct-tag">✓ Correct</span>' : ''}
                    </div>`).join('')}
            </div>
            <div class="form-group" style="margin-top:10px;margin-bottom:0;">
                <label>Explanation <span style="color:#9ca3af;font-weight:400;">(optional)</span></label>
                <input type="text" placeholder="Why is this the correct answer?" value="${escHtml(q.explanation)}" oninput="window._manageLessonQuestions[${i}].explanation=this.value">
            </div>
        </div>`).join('');
    if (window.lucide) lucide.createIcons();
}

// Edit course basic info
function openEditCourse(courseId) {
    fetch(`${API}/courses/${courseId}`).then(r=>r.json()).then(d=>{
        if (!d.success) return;
        const c = d.course;
        document.getElementById('editCourseId').value=c.id;
        document.getElementById('editCourseTitle').value=c.title;
        document.getElementById('editCourseDesc').value=c.description||'';
        document.getElementById('editCourseInstructor').value=c.instructor_name;
        document.getElementById('editCoursePrice').value=c.price;
        document.getElementById('editCourseDifficulty').value=c.difficulty_level;
        document.getElementById('editCourseModal').classList.add('active');
    });
}
function saveEditCourse() {
    const id = document.getElementById('editCourseId').value;
    fetch(`${API}/admin/courses/${id}`,{
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
            title:document.getElementById('editCourseTitle').value,
            description:document.getElementById('editCourseDesc').value,
            instructor_name:document.getElementById('editCourseInstructor').value,
            price:document.getElementById('editCoursePrice').value,
            difficulty_level:document.getElementById('editCourseDifficulty').value
        })
    }).then(r=>r.json()).then(d=>{
        if (d.success){showNotification('Course updated');closeModal('editCourseModal');loadCourses();}
        else alert(d.message);
    });
}
function deleteCourse(id) {
    if (!confirm('Delete this course and all its content?')) return;
    fetch(`${API}/admin/courses/${id}`,{method:'DELETE'}).then(r=>r.json()).then(d=>{
        if (d.success){showNotification('Course deleted');loadCourses();}
        else alert(d.message);
    });
}

// Users
function loadUsers() {
    fetch(`${API}/admin/users`).then(r=>r.json()).then(d=>{
        if (!d.success) return;
        document.getElementById('usersTableBody').innerHTML = d.users.map(u=>`
            <tr>
                <td>${u.id}</td><td>${u.full_name}</td><td>${u.email}</td>
                <td>${formatDate(u.created_at)}</td><td>${u.enrollments_count||0}</td>
                <td><button class="btn-icon btn-delete" onclick="deleteUser(${u.id})"><i data-lucide="trash-2"></i></button></td>
            </tr>`).join('');
        if (window.lucide) lucide.createIcons();
    });
}
function deleteUser(id) {
    if (!confirm('Delete this user?')) return;
    fetch(`${API}/admin/users/${id}`,{method:'DELETE'}).then(r=>r.json()).then(d=>{
        if (d.success){showNotification('User deleted');loadUsers();}else alert(d.message);
    });
}
document.getElementById('userSearch').addEventListener('input',e=>{
    const q=e.target.value.toLowerCase();
    document.querySelectorAll('#usersTableBody tr').forEach(row=>{
        row.style.display=row.textContent.toLowerCase().includes(q)?'':'none';
    });
});

// Reviews
function loadReviews() {
    fetch(`${API}/admin/reviews`).then(r=>r.json()).then(d=>{
        if (!d.success) return;
        document.getElementById('adminReviewsList').innerHTML = d.reviews.map(r=>`
            <div class="admin-review-card">
                <div class="review-header">
                    <div class="review-user-info"><h4>${r.user_name}</h4><p>${r.course_title} · ${'<i data-lucide="star" class="icon-inline active-star"></i>'.repeat(r.rating)}</p></div>
                    <button class="btn-icon btn-delete" onclick="deleteReview(${r.id})"><i data-lucide="trash-2"></i></button>
                </div>
                <p>${r.review_text||'<em>No text</em>'}</p>
            </div>`).join('');
        if (window.lucide) lucide.createIcons();
    });
}
function deleteReview(id) {
    if (!confirm('Delete review?')) return;
    fetch(`${API}/admin/reviews/${id}`,{method:'DELETE'}).then(r=>r.json()).then(d=>{
        if (d.success){showNotification('Review deleted');loadReviews();}
    });
}

// Utilities
function closeModal(id){ document.getElementById(id).classList.remove('active'); }
window.addEventListener('click',e=>{ if(e.target.classList.contains('modal')) e.target.classList.remove('active'); });
function formatDate(s){ return new Date(s).toLocaleDateString('en-IN',{year:'numeric',month:'short',day:'numeric'}); }
function showNotification(msg,type='success') {
    const n=document.createElement('div');
    n.style.cssText=`position:fixed;top:20px;right:20px;background:${type==='success'?'#10b981':'#ef4444'};color:#fff;padding:14px 20px;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:99999;font-size:14px;font-weight:500;`;
    n.textContent=msg; document.body.appendChild(n);
    setTimeout(()=>n.remove(),4000);
}

// ═══════════════════════════════════════════════
// TEST SERIES - ADMIN
// ═══════════════════════════════════════════════

window._tsQuestions = [];
let _tsEditId = null;

function loadTestSeriesAdmin() {
    const container = document.getElementById('testSeriesList');
    container.innerHTML = '<p style="color:#9ca3af;padding:20px;text-align:center;">Loading…</p>';
    fetch(`${API}/test-series/admin/list`).then(r=>r.json()).then(d=>{
        if (!d.success) { container.innerHTML = '<p style="color:#ef4444;padding:20px;">Error loading tests</p>'; return; }
        if (!d.tests.length) {
            container.innerHTML = '<div class="ts-empty"><i data-lucide="clipboard-list" style="width:48px;height:48px;color:#d1d5db;margin-bottom:12px;"></i><p>No test series yet. Create one to get started.</p></div>';
            if (window.lucide) lucide.createIcons();
            return;
        }
        container.innerHTML = d.tests.map(t => {
            const start = new Date(t.start_datetime);
            const end = new Date(start.getTime() + t.duration_minutes * 60000);
            const now = new Date();
            let statusBadge = '';
            if (now < start) statusBadge = `<span class="ts-badge ts-badge-upcoming">Upcoming</span>`;
            else if (now >= start && now <= end) statusBadge = `<span class="ts-badge ts-badge-live">🔴 Live</span>`;
            else statusBadge = `<span class="ts-badge ts-badge-ended">Ended</span>`;
            return `
            <div class="ts-admin-card">
                <div class="ts-admin-card-header">
                    <div>
                        <h3 class="ts-admin-title">${t.title}</h3>
                        <p class="ts-admin-meta">${t.description || ''}</p>
                    </div>
                    ${statusBadge}
                </div>
                <div class="ts-admin-info-row">
                    <span><i data-lucide="calendar" class="icon-inline"></i> ${formatTsDate(t.start_datetime)}</span>
                    <span><i data-lucide="clock" class="icon-inline"></i> ${t.duration_minutes} min</span>
                    <span><i data-lucide="help-circle" class="icon-inline"></i> ${t.total_questions} questions</span>
                </div>
                <div class="ts-admin-actions">
                    <button class="btn-icon btn-edit" onclick="openEditTestSeries(${t.id})"><i data-lucide="edit-3"></i> Edit</button>
                    <button class="btn-icon btn-manage" onclick="openTsLeaderboard(${t.id}, '${escHtml(t.title)}')"><i data-lucide="trophy"></i> Leaderboard</button>
                    <button class="btn-icon btn-delete" onclick="deleteTestSeries(${t.id})"><i data-lucide="trash-2"></i> Delete</button>
                </div>
            </div>`;
        }).join('');
        if (window.lucide) lucide.createIcons();
    });
}

function formatTsDate(dt) {
    return new Date(dt).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function openCreateTestSeries() {
    _tsEditId = null;
    window._tsQuestions = [];
    document.getElementById('testSeriesModalTitle').textContent = 'Create Test Series';
    document.getElementById('tsEditId').value = '';
    document.getElementById('tsTitle').value = '';
    document.getElementById('tsDescription').value = '';
    document.getElementById('tsDuration').value = '30';
    document.getElementById('tsStartDatetime').value = '';
    switchTsTab(1);
    renderTsQuestions();
    document.getElementById('testSeriesModal').classList.add('active');
}

function openEditTestSeries(testId) {
    _tsEditId = testId;
    fetch(`${API}/test-series/admin/list`).then(r=>r.json()).then(d=>{
        const t = d.tests.find(x=>x.id===testId);
        if (!t) return;
        document.getElementById('testSeriesModalTitle').textContent = 'Edit Test Series';
        document.getElementById('tsEditId').value = testId;
        document.getElementById('tsTitle').value = t.title;
        document.getElementById('tsDescription').value = t.description || '';
        document.getElementById('tsDuration').value = t.duration_minutes;
        
        // Convert database datetime to datetime-local format (YYYY-MM-DDTHH:MM)
        // Important: Keep local time, don't convert to UTC
        const dt = new Date(t.start_datetime);
        const year = dt.getFullYear();
        const month = String(dt.getMonth() + 1).padStart(2, '0');
        const day = String(dt.getDate()).padStart(2, '0');
        const hours = String(dt.getHours()).padStart(2, '0');
        const minutes = String(dt.getMinutes()).padStart(2, '0');
        const local = `${year}-${month}-${day}T${hours}:${minutes}`;
        document.getElementById('tsStartDatetime').value = local;
        fetch(`${API}/test-series/admin/${testId}/questions`).then(r=>r.json()).then(qd=>{
            window._tsQuestions = qd.success ? qd.questions.map(q=>({
                question_text: q.question_text, option_a: q.option_a, option_b: q.option_b,
                option_c: q.option_c||'', option_d: q.option_d||'', correct_answer: q.correct_answer, explanation: q.explanation||''
            })) : [];
            switchTsTab(1);
            renderTsQuestions();
            document.getElementById('testSeriesModal').classList.add('active');
        });
    });
}

function switchTsTab(n) {
    [1,2].forEach(i=>{
        document.getElementById(`tsTab${i}`).classList.toggle('active', i===n);
        document.getElementById(`tsTabContent${i}`).classList.toggle('active', i===n);
    });
}

function addTsQuestion() {
    window._tsQuestions.push({ question_text:'', option_a:'', option_b:'', option_c:'', option_d:'', correct_answer:'A', explanation:'' });
    renderTsQuestions();
}

function removeTsQuestion(i) { window._tsQuestions.splice(i,1); renderTsQuestions(); }

function setTsCorrectAnswer(i, opt) {
    window._tsQuestions[i].correct_answer = opt;
    renderTsQuestions();
}

function renderTsQuestions() {
    const el = document.getElementById('tsQuestionsBuilder');
    if (!el) return;
    el.innerHTML = '';
    if (!window._tsQuestions.length) {
        el.innerHTML = '<p style="color:#94a3b8;font-size:13px;padding:8px 0;">No questions yet. Click "+ Add Question" to start.</p>';
        return;
    }
    window._tsQuestions.forEach(function(q, i) {
        var card = document.createElement('div');
        card.className = 'quiz-q-builder';

        var header = document.createElement('div');
        header.className = 'quiz-q-header';
        header.innerHTML = '<span class="quiz-q-num">Q' + (i+1) + '</span>';
        var delBtn = document.createElement('button');
        delBtn.className = 'btn-sm btn-delete';
        delBtn.innerHTML = '<i data-lucide="trash-2"></i>';
        delBtn.onclick = function() { removeTsQuestion(i); };
        header.appendChild(delBtn);
        card.appendChild(header);

        var qGroup = document.createElement('div');
        qGroup.className = 'form-group';
        qGroup.innerHTML = '<label>Question *</label>';
        var qInput = document.createElement('input');
        qInput.type = 'text';
        qInput.placeholder = 'Enter question';
        qInput.value = q.question_text;
        qInput.oninput = function() { window._tsQuestions[i].question_text = this.value; };
        qGroup.appendChild(qInput);
        card.appendChild(qGroup);

        var optsList = document.createElement('div');
        optsList.className = 'quiz-options-list';
        ['A','B','C','D'].forEach(function(opt) {
            var row = document.createElement('div');
            row.className = 'quiz-option-row' + (q.correct_answer === opt ? ' is-correct' : '');
            row.onclick = function() { setTsCorrectAnswer(i, opt); };

            var radio = document.createElement('div');
            radio.className = 'quiz-option-radio';
            var dot = document.createElement('div');
            dot.className = 'radio-dot' + (q.correct_answer === opt ? ' active' : '');
            radio.appendChild(dot);

            var label = document.createElement('span');
            label.className = 'quiz-option-label';
            label.textContent = opt;

            var optInput = document.createElement('input');
            optInput.type = 'text';
            optInput.className = 'quiz-option-input';
            optInput.placeholder = 'Option ' + opt;
            optInput.value = q['option_' + opt.toLowerCase()] || '';
            optInput.onclick = function(e) { e.stopPropagation(); };
            (function(capturedOpt) {
                optInput.oninput = function() { window._tsQuestions[i]['option_' + capturedOpt.toLowerCase()] = this.value; };
            })(opt);

            row.appendChild(radio);
            row.appendChild(label);
            row.appendChild(optInput);
            if (q.correct_answer === opt) {
                var tag = document.createElement('span');
                tag.className = 'correct-tag';
                tag.textContent = '✓ Correct';
                row.appendChild(tag);
            }
            optsList.appendChild(row);
        });
        card.appendChild(optsList);

        var expGroup = document.createElement('div');
        expGroup.className = 'form-group';
        expGroup.style.marginTop = '10px';
        expGroup.style.marginBottom = '0';
        expGroup.innerHTML = '<label>Explanation <span style="color:#9ca3af;font-weight:400;">(optional)</span></label>';
        var expInput = document.createElement('input');
        expInput.type = 'text';
        expInput.placeholder = 'Why is this correct?';
        expInput.value = q.explanation || '';
        expInput.oninput = function() { window._tsQuestions[i].explanation = this.value; };
        expGroup.appendChild(expInput);
        card.appendChild(expGroup);

        el.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
}

async function saveTestSeries() {
    const title = document.getElementById('tsTitle').value.trim();
    const startDatetime = document.getElementById('tsStartDatetime').value;
    if (!title) { alert('Test title is required'); switchTsTab(1); return; }
    if (!startDatetime) { alert('Start date and time is required'); switchTsTab(1); return; }
    if (!window._tsQuestions.length) { alert('Add at least one question'); return; }
    for (let i=0; i<window._tsQuestions.length; i++) {
        const q = window._tsQuestions[i];
        if (!q.question_text.trim()) { alert(`Q${i+1}: Question text required`); return; }
        if (!q.option_a.trim() || !q.option_b.trim()) { alert(`Q${i+1}: Options A and B required`); return; }
    }

    // Convert datetime-local input to MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
    // Important: Keep local time, don't convert to UTC
    const dt = new Date(startDatetime);
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    const hours = String(dt.getHours()).padStart(2, '0');
    const minutes = String(dt.getMinutes()).padStart(2, '0');
    const seconds = String(dt.getSeconds()).padStart(2, '0');
    const mysqlDatetime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    const payload = {
        title,
        description: document.getElementById('tsDescription').value.trim(),
        start_datetime: mysqlDatetime,
        duration_minutes: parseInt(document.getElementById('tsDuration').value)||30
    };

    const url = _tsEditId ? `${API}/test-series/admin/${_tsEditId}` : `${API}/test-series/admin/create`;
    const method = _tsEditId ? 'PUT' : 'POST';

    const res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }).then(r=>r.json());
    if (!res.success) { alert(res.message||'Error saving'); return; }

    const testId = _tsEditId || res.test_id;
    await fetch(`${API}/test-series/admin/${testId}/questions`, {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ questions: window._tsQuestions })
    });

    showNotification(_tsEditId ? 'Test series updated!' : 'Test series created! Students will be notified.');
    closeModal('testSeriesModal');
    loadTestSeriesAdmin();
}

function deleteTestSeries(id) {
    if (!confirm('Delete this test series and all its data?')) return;
    fetch(`${API}/test-series/admin/${id}`, { method:'DELETE' }).then(r=>r.json()).then(d=>{
        if (d.success) { showNotification('Test series deleted'); loadTestSeriesAdmin(); }
        else alert(d.message);
    });
}

function openTsLeaderboard(testId, title) {
    document.getElementById('tsLeaderboardTitle').textContent = `🏆 Leaderboard — ${title}`;
    document.getElementById('tsLeaderboardContent').innerHTML = '<p style="color:#9ca3af;text-align:center;padding:20px;">Loading…</p>';
    document.getElementById('tsLeaderboardModal').classList.add('active');
    fetch(`${API}/test-series/${testId}/leaderboard`).then(r=>r.json()).then(d=>{
        if (!d.success || !d.leaderboard.length) {
            document.getElementById('tsLeaderboardContent').innerHTML = '<p style="color:#9ca3af;text-align:center;padding:20px;">No submissions yet.</p>';
            return;
        }
        document.getElementById('tsLeaderboardContent').innerHTML = `
            <table class="admin-table">
                <thead><tr><th>Rank</th><th>Student</th><th>Score</th><th>Time Taken</th><th>Submitted</th></tr></thead>
                <tbody>${d.leaderboard.map(r=>`
                    <tr>
                        <td><span class="ts-rank-badge rank-${r.rank_pos}">${r.rank_pos <= 3 ? ['🥇','🥈','🥉'][r.rank_pos-1] : '#'+r.rank_pos}</span></td>
                        <td><div style="display:flex;align-items:center;gap:8px;"><img src="${r.avatar_url||'assets/default-avatar.png'}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;"> ${r.full_name}</div></td>
                        <td><strong>${r.score}/${r.total_questions}</strong> <span style="color:#9ca3af;font-size:12px;">(${Math.round(r.score/r.total_questions*100)}%)</span></td>
                        <td>${formatTimeTaken(r.time_taken_seconds)}</td>
                        <td>${formatDate(r.submitted_at)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>`;
    });
}

function formatTimeTaken(secs) {
    if (!secs) return '—';
    const m = Math.floor(secs/60), s = secs%60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
