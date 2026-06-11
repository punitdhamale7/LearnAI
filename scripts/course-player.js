let currentCourseId = null;
let currentLessonId = null;
let curriculum = [];
let allLessons = [];
let currentLessonIndex = 0;
let userId = null;
let player = null; 

document.addEventListener('DOMContentLoaded', () => {
    
    const session = JSON.parse(localStorage.getItem('session'));
    
    if (!session || !session.loggedIn) {
        window.location.replace('login.html');
        return;
    }
    
    userId = session.user.id;
    
    
    if (typeof videojs !== 'undefined') {
        player = videojs('videoPlayer', {
            controls: true,
            autoplay: false,
            preload: 'auto',
            fluid: true,
            playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
            controlBar: {
                children: [
                    'playToggle',
                    'volumePanel',
                    'currentTimeDisplay',
                    'timeDivider',
                    'durationDisplay',
                    'progressControl',
                    'playbackRateMenuButton',
                    'qualitySelector',
                    'fullscreenToggle'
                ]
            }
        });
        
        
        player.on('timeupdate', function() {
            const currentTime = player.currentTime();
            const duration = player.duration();
            if (duration > 0) {
                const progress = (currentTime / duration) * 100;
                if (progress >= 90 && currentLessonId) {
                    markAsComplete();
                }
            }
        });
    }
    
    
    const urlParams = new URLSearchParams(window.location.search);
    currentCourseId = urlParams.get('courseId');
    currentLessonId = urlParams.get('lessonId');
    
    if (!currentCourseId) {
        alert('No course specified');
        window.location.href = 'my-courses.html';
        return;
    }
    
    
    loadCourse();
    loadCurriculum();

    setInterval(function() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://learnai-backend-yf50.onrender.com/api/courses/' + currentCourseId + '/curriculum');
        xhr.onload = function() {
            try {
                var data = JSON.parse(xhr.responseText);
                if (!data.success) return;
                var newIds = data.curriculum.reduce(function(a, s) { return a.concat(s.lessons.map(function(l){return l.id;})); }, []);
                var oldIds = allLessons.map(function(l){return l.id;});
                var hasNew = newIds.some(function(id){ return oldIds.indexOf(id) === -1; });
                if (hasNew) {
                    curriculum = data.curriculum;
                    allLessons = data.curriculum.reduce(function(a,s){return a.concat(s.lessons);},[]);
                    displayCurriculum();
                    showNotification('📚 New lessons added to this course!');
                }
            } catch(e) {}
        };
        xhr.send();
    }, 30000);
});

function loadCourse() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://learnai-backend-yf50.onrender.com/api/courses/' + currentCourseId);
    xhr.onload = function() {
        try {
            var data = JSON.parse(xhr.responseText);
            if (data.success) document.getElementById('courseTitle').textContent = data.course.title;
        } catch(e) {}
    };
    xhr.send();
}

function loadCurriculum() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://learnai-backend-yf50.onrender.com/api/courses/' + currentCourseId + '/curriculum');
    xhr.onload = function() {
        try {
            var data = JSON.parse(xhr.responseText);
            if (data.success) {
                curriculum = data.curriculum;
                allLessons = [];
                curriculum.forEach(function(section) {
                    section.lessons.forEach(function(lesson) { allLessons.push(lesson); });
                });
                displayCurriculum();
                loadCourseProgress();
                if (currentLessonId) loadLesson(currentLessonId);
                else if (allLessons.length > 0) loadLesson(allLessons[0].id);
            }
        } catch(e) { console.error('Error loading curriculum:', e); }
    };
    xhr.send();
}

function displayCurriculum() {
    const container = document.getElementById('curriculumContent');
    container.innerHTML = '';
    
    curriculum.forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'section';
        
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'section-header';
        sectionHeader.onclick = () => toggleSection(sectionDiv);
        
        sectionHeader.innerHTML = `
            <h4>${section.title}</h4>
            <span class="section-toggle">▼</span>
        `;
        
        const lessonsDiv = document.createElement('div');
        lessonsDiv.className = 'section-lessons';
        
        section.lessons.forEach(lesson => {
            const lessonItem = document.createElement('div');
            lessonItem.className = 'lesson-item';
            lessonItem.id = `lesson-${lesson.id}`;
            lessonItem.onclick = () => loadLesson(lesson.id);
            
            lessonItem.innerHTML = `
                ${getContentIcon(lesson.content_type)}
                <div class="lesson-details">
                    <h5>${lesson.title}</h5>
                    <p>${lesson.duration_minutes} min • ${lesson.content_type}</p>
                </div>
                <span class="lesson-status" id="status-${lesson.id}">○</span>
            `;
            
            lessonsDiv.appendChild(lessonItem);
        });
        
        sectionDiv.appendChild(sectionHeader);
        sectionDiv.appendChild(lessonsDiv);
        container.appendChild(sectionDiv);
    });
}

function getContentIcon(type) {
    const map = {
        'video':      { emoji: '▶', cls: 'video' },
        'article':    { emoji: '📄', cls: 'article' },
        'quiz':       { emoji: '❓', cls: 'quiz' },
        'assignment': { emoji: '📝', cls: 'article' }
    };
    const item = map[type] || { emoji: '📚', cls: '' };
    return `<span class="lesson-icon ${item.cls}">${item.emoji}</span>`;
}

function toggleSection(sectionDiv) {
    const lessonsDiv = sectionDiv.querySelector('.section-lessons');
    const toggle = sectionDiv.querySelector('.section-toggle');
    
    if (lessonsDiv.style.display === 'none') {
        lessonsDiv.style.display = 'block';
        toggle.textContent = '▼';
    } else {
        lessonsDiv.style.display = 'none';
        toggle.textContent = '▶';
    }
}

function loadLesson(lessonId) {
    currentLessonId = lessonId;
    
    
    const url = new URL(window.location);
    url.searchParams.set('lessonId', lessonId);
    window.history.pushState({}, '', url);
    
    
    document.querySelectorAll('.lesson-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeItem = document.getElementById(`lesson-${lessonId}`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
    
    
    currentLessonIndex = allLessons.findIndex(l => l.id == lessonId);
    
    
    updateNavigationButtons();
    
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://learnai-backend-yf50.onrender.com/api/lessons/' + lessonId + '/progress/' + userId);
    xhr.onload = function() {
        try {
            var data = JSON.parse(xhr.responseText);
            if (data.success) displayLesson(data.lesson);
        } catch(e) { console.error('Error loading lesson:', e); }
    };
    xhr.send();
}

function displayLesson(lesson) {
    
    document.getElementById('lessonTitle').textContent = lesson.title;
    document.getElementById('lessonDuration').textContent = `${lesson.duration_minutes} min`;
    document.getElementById('lessonDescription').textContent = lesson.description || 'No description available';
    document.getElementById('lessonOverview').textContent = lesson.description || 'No overview available';

    
    const typeEl = document.getElementById('lessonType');
    const badgeClass = { video: 'badge-video', article: 'badge-article', quiz: 'badge-quiz' }[lesson.content_type] || 'badge-article';
    const typeIcon = { video: '▶', article: '📄', quiz: '❓' }[lesson.content_type] || '📚';
    typeEl.className = `lesson-type-badge ${badgeClass}`;
    typeEl.textContent = `${typeIcon} ${lesson.content_type}`;

    
    const completeBtn = document.getElementById('completeBtn');
    if (lesson.is_completed) {
        completeBtn.textContent = '✓ Completed';
        completeBtn.classList.add('completed');
    } else {
        completeBtn.textContent = '✓ Mark as Complete';
        completeBtn.classList.remove('completed');
    }

    const videoContainer = document.getElementById('videoContainer');
    const articleContainer = document.getElementById('articleContainer');
    const quizTabBtn = document.getElementById('quizTabBtn');
    quizTabBtn.style.display = 'none';

    if (lesson.content_type === 'video') {
        videoContainer.style.display = 'block';
        articleContainer.style.display = 'none';

        const externalPlayer = document.getElementById('externalVideoPlayer');

        if (lesson.video_url) {
            const url = lesson.video_url;
            
            if (url.includes('youtube.com/embed') || url.includes('youtu.be') || url.includes('vimeo.com')) {
                let embedUrl = url;
                
                const ytWatch = url.match(/youtube\.com\/watch\?v=([^&\s]+)/);
                if (ytWatch) embedUrl = `https://www.youtube.com/embed/${ytWatch[1]}?rel=0&modestbranding=1`;
                
                if (url.includes('youtube.com/embed') && !url.includes('?')) {
                    embedUrl = url + '?rel=0&modestbranding=1';
                }

                externalPlayer.src = embedUrl;
                externalPlayer.style.display = 'block';
                document.getElementById('videoPlayer').style.display = 'none';
            } else {
                
                externalPlayer.style.display = 'none';
                document.getElementById('videoPlayer').style.display = 'block';
                if (player) player.src({ src: url, type: 'video/mp4' });
            }
        } else {
            
            videoContainer.innerHTML = `
                <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1e293b;color:#94a3b8;gap:12px;">
                    <div style="font-size:48px;">▶</div>
                    <p style="font-size:16px;">Video content coming soon</p>
                    <p style="font-size:13px;opacity:0.6;">Check back later for this lesson's video</p>
                </div>`;
        }

    } else if (lesson.content_type === 'article') {
        videoContainer.style.display = 'none';
        articleContainer.style.display = 'block';

        const content = lesson.article_content || lesson.description || '';
        document.getElementById('articleContent').innerHTML = content
            ? content
            : generateSampleArticle(lesson.title);

    } else if (lesson.content_type === 'quiz') {
        videoContainer.style.display = 'none';
        articleContainer.style.display = 'none';
        quizTabBtn.style.display = 'block';
    }

    const savedNotes = localStorage.getItem(`notes_${lesson.id}`);
    document.getElementById('lessonNotes').value = savedNotes || '';

    if (lesson.content_type === 'quiz') {
        showTab('quiz');
    } else {
        showTab('overview');
    }
}


function generateSampleArticle(title) {
    return `
        <h1>${title}</h1>
        <blockquote>This lesson covers key concepts. Take notes using the Notes tab as you read.</blockquote>
        <h2>Introduction</h2>
        <p>Welcome to this lesson. In this section you will learn the core concepts and practical applications related to <strong>${title}</strong>.</p>
        <h2>Key Concepts</h2>
        <ul>
            <li>Understanding the fundamentals</li>
            <li>Practical implementation techniques</li>
            <li>Best practices and common patterns</li>
            <li>Real-world examples and use cases</li>
        </ul>
        <h2>Code Example</h2>
        <pre><code>// Example code for ${title}
function example() {
    console.log("Learning ${title}");
    return "Keep going!";
}

example();</code></pre>
        <h2>Summary</h2>
        <p>After completing this lesson, you should have a solid understanding of the topic. Use the <strong>Notes</strong> tab to jot down key takeaways, and take the <strong>Quiz</strong> to test your knowledge.</p>
    `;
}

function loadCourseProgress() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://learnai-backend-yf50.onrender.com/api/courses/' + currentCourseId + '/progress/' + userId);
    xhr.onload = function() {
        try {
            var data = JSON.parse(xhr.responseText);
            if (data.success) {
                var p = data.progress;
                document.getElementById('completedLessons').textContent = p.completed_lessons || 0;
                document.getElementById('totalLessons').textContent = p.total_lessons || 0;
                var pct = parseFloat(p.progress_percentage) || 0;
                document.getElementById('progressPercentage').textContent = Math.round(pct) + '%';
                var circle = document.querySelector('.progress-circle');
                if (circle) circle.style.background = 'conic-gradient(#6366f1 ' + pct + '%, #e5e7eb ' + pct + '%)';
                updateLessonStatuses();

                // Show certificate button when 100% complete
                var existing = document.getElementById('certDownloadBtn');
                if (pct >= 100 && !existing) {
                    var btn = document.createElement('button');
                    btn.id = 'certDownloadBtn';
                    btn.textContent = '🏆 Download Certificate';
                    btn.style.cssText = 'margin-top:12px;width:100%;padding:10px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;';
                    btn.onclick = function() {
                        btn.textContent = '⏳ Generating...';
                        btn.disabled = true;
                        var a = document.createElement('a');
                        a.href = 'https://learnai-backend-yf50.onrender.com/api/certificates/generate/' + userId + '/' + currentCourseId;
                        a.download = 'Certificate.pdf';
                        a.target = '_blank';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        setTimeout(function() { btn.textContent = '🏆 Download Certificate'; btn.disabled = false; }, 2000);
                    };
                    var progressInfo = document.querySelector('.course-progress-summary');
                    if (progressInfo) progressInfo.appendChild(btn);
                }
            }
        } catch(e) {}
    };
    xhr.send();
}

function updateLessonStatuses() {
    allLessons.forEach(lesson => {
        const statusIcon = document.getElementById(`status-${lesson.id}`);
        if (statusIcon) {
            
            
            statusIcon.textContent = '○';
        }
    });
}

function markAsComplete() {
    if (!currentLessonId) return;
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://learnai-backend-yf50.onrender.com/api/lessons/' + currentLessonId + '/complete');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        try {
            var data = JSON.parse(xhr.responseText);
            if (data.success) {
                var btn = document.getElementById('completeBtn');
                btn.textContent = '✓ Completed';
                btn.classList.add('completed');
                var statusIcon = document.getElementById('status-' + currentLessonId);
                if (statusIcon) statusIcon.textContent = '✓';
                var lessonItem = document.getElementById('lesson-' + currentLessonId);
                if (lessonItem) lessonItem.classList.add('completed');
                loadCourseProgress();
                showNotification('Lesson marked as complete!');
            }
        } catch(e) {}
    };
    xhr.send(JSON.stringify({ user_id: userId, course_id: currentCourseId }));
}

function showTab(tabName, el) {
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.style.display = 'none';
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).style.display = 'block';
    const activeBtn = el || document.querySelector(`.tab-btn[onclick*="'${tabName}'"]`);
    if (activeBtn) activeBtn.classList.add('active');
    if (tabName === 'quiz' && currentLessonId) {
        loadQuiz(currentLessonId);
    }
    if (tabName === 'reviews') {
        loadReviews();
    }
}

function saveNotes() {
    const notes = document.getElementById('lessonNotes').value;
    localStorage.setItem(`notes_${currentLessonId}`, notes);
    const indicator = document.getElementById('notesSavedMsg');
    if (indicator) {
        indicator.style.display = 'inline';
        setTimeout(() => { indicator.style.display = 'none'; }, 2000);
    }
}

function insertNoteTemplate(type) {
    const textarea = document.getElementById('lessonNotes');
    const pos = textarea.selectionStart;
    const before = textarea.value.substring(0, pos);
    const after = textarea.value.substring(pos);
    const templates = {
        heading: '\n## Heading\n',
        bullet: '\n• Point 1\n• Point 2\n• Point 3\n',
        code: '\n```\n// code here\n```\n'
    };
    const insert = templates[type] || '';
    textarea.value = before + insert + after;
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = pos + insert.length;
}

function clearNotes() {
    if (confirm('Clear all notes for this lesson?')) {
        document.getElementById('lessonNotes').value = '';
        localStorage.removeItem(`notes_${currentLessonId}`);
    }
}

function loadQuiz(lessonId) {
    var container = document.getElementById('quizContainer');
    container.innerHTML = '<div style="text-align:center;padding:30px;color:#9ca3af;">Loading quiz…</div>';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://learnai-backend-yf50.onrender.com/api/lessons/' + lessonId + '/quiz');
    xhr.onload = function() {
        try {
            var data = JSON.parse(xhr.responseText);
            if (data.success && data.questions && data.questions.length > 0) {
                displayQuiz(data.questions);
            } else {
                container.innerHTML = '<div style="text-align:center;padding:40px 20px;"><div style="font-size:48px;margin-bottom:12px;">📝</div><p style="color:#6b7280;font-size:15px;margin-bottom:16px;">No quiz questions yet for this lesson.</p><button onclick="loadQuiz(' + lessonId + ')" style="padding:8px 20px;background:#6366f1;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;">🔄 Refresh</button></div>';
            }
        } catch(e) {
            container.innerHTML = '<div style="text-align:center;padding:40px 20px;"><p style="color:#ef4444;margin-bottom:12px;">Error loading quiz.</p><button onclick="loadQuiz(' + lessonId + ')" style="padding:8px 20px;background:#6366f1;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;">🔄 Retry</button></div>';
        }
    };
    xhr.onerror = function() {
        container.innerHTML = '<div style="text-align:center;padding:40px 20px;"><p style="color:#ef4444;">Could not connect to server.</p></div>';
    };
    xhr.send();
}

function displayQuiz(questions) {
    const container = document.getElementById('quizContainer');
    container.innerHTML = '';
    
    questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'quiz-question';
        questionDiv.innerHTML = `
            <h4>${index + 1}. ${q.question_text}</h4>
            <div class="quiz-options">
                <div class="quiz-option" onclick="selectOption(${q.id}, 'A')">
                    <input type="radio" name="q${q.id}" value="A" id="q${q.id}a">
                    <label for="q${q.id}a">A. ${q.option_a}</label>
                </div>
                <div class="quiz-option" onclick="selectOption(${q.id}, 'B')">
                    <input type="radio" name="q${q.id}" value="B" id="q${q.id}b">
                    <label for="q${q.id}b">B. ${q.option_b}</label>
                </div>
                <div class="quiz-option" onclick="selectOption(${q.id}, 'C')">
                    <input type="radio" name="q${q.id}" value="C" id="q${q.id}c">
                    <label for="q${q.id}c">C. ${q.option_c}</label>
                </div>
                <div class="quiz-option" onclick="selectOption(${q.id}, 'D')">
                    <input type="radio" name="q${q.id}" value="D" id="q${q.id}d">
                    <label for="q${q.id}d">D. ${q.option_d}</label>
                </div>
            </div>
        `;
        container.appendChild(questionDiv);
    });
    
    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn-primary quiz-submit';
    submitBtn.textContent = 'Submit Quiz';
    submitBtn.onclick = () => submitQuiz(questions);
    container.appendChild(submitBtn);
}

function selectOption(questionId, option) {
    document.getElementById(`q${questionId}${option.toLowerCase()}`).checked = true;
}

function submitQuiz(questions) {
    var answers = {};
    questions.forEach(function(q) {
        var selected = document.querySelector('input[name="q' + q.id + '"]:checked');
        if (selected) answers[q.id] = selected.value;
    });
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://learnai-backend-yf50.onrender.com/api/lessons/' + currentLessonId + '/quiz/submit');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        try {
            var data = JSON.parse(xhr.responseText);
            if (data.success) {
                data.details = data.results;
                displayQuizResults(data);
            }
        } catch(e) {}
    };
    xhr.send(JSON.stringify({ user_id: userId, answers: answers }));
}

function displayQuizResults(results) {
    const container = document.getElementById('quizContainer');

    const pct = Math.round(results.percentage);
    const passed = results.passed;

    
    let grade, gradeColor, gradeLabel;
    if (pct >= 90)      { grade = 'A'; gradeColor = '#10b981'; gradeLabel = 'Excellent'; }
    else if (pct >= 80) { grade = 'B'; gradeColor = '#3b82f6'; gradeLabel = 'Good'; }
    else if (pct >= 70) { grade = 'C'; gradeColor = '#f59e0b'; gradeLabel = 'Average'; }
    else if (pct >= 60) { grade = 'D'; gradeColor = '#f97316'; gradeLabel = 'Below Average'; }
    else                { grade = 'F'; gradeColor = '#ef4444'; gradeLabel = 'Needs Improvement'; }

    
    let breakdownHTML = '';
    if (results.details && results.details.length > 0) {
        breakdownHTML = `
            <div class="quiz-breakdown">
                <h4 class="breakdown-title">Question Review</h4>
                ${results.details.map((d, i) => `
                    <div class="breakdown-item ${d.is_correct ? 'correct' : 'incorrect'}">
                        <div class="breakdown-header">
                            <span class="breakdown-num">Q${i + 1}</span>
                            <span class="breakdown-icon">${d.is_correct ? '✓' : '✗'}</span>
                        </div>
                        <p class="breakdown-question">${d.question_text}</p>
                        <div class="breakdown-answers">
                            <span class="your-answer ${d.is_correct ? 'ans-correct' : 'ans-wrong'}">
                                Your answer: ${d.user_answer || 'Not answered'}
                            </span>
                            ${!d.is_correct ? `<span class="correct-answer">Correct: ${d.correct_answer}</span>` : ''}
                        </div>
                        ${d.explanation ? `<p class="breakdown-explanation">💡 ${d.explanation}</p>` : ''}
                    </div>
                `).join('')}
            </div>`;
    }

    container.innerHTML = `
        <div class="quiz-results-screen">
            <!-- Score circle -->
            <div class="results-top">
                <div class="score-circle" style="--pct:${pct}; --color:${gradeColor};">
                    <svg viewBox="0 0 120 120" class="score-svg">
                        <circle cx="60" cy="60" r="52" class="score-track"/>
                        <circle cx="60" cy="60" r="52" class="score-fill"
                            style="stroke:${gradeColor}; stroke-dasharray:${Math.round(pct * 3.267)} 327;"/>
                    </svg>
                    <div class="score-inner">
                        <span class="score-pct">${pct}%</span>
                        <span class="score-grade" style="color:${gradeColor};">${grade}</span>
                    </div>
                </div>

                <div class="results-info">
                    <div class="pass-badge ${passed ? 'badge-pass' : 'badge-fail'}">
                        ${passed ? '🎉 PASSED' : '❌ FAILED'}
                    </div>
                    <h3 class="results-title">${gradeLabel}</h3>
                    <p class="results-score">${results.score} / ${results.total} correct</p>
                    <p class="results-msg">${passed
                        ? 'Great work! This lesson has been marked complete.'
                        : 'You need 60% to pass. Review the material and try again.'}</p>
                    <div class="results-actions">
                        <button class="btn-primary" onclick="loadQuiz(${currentLessonId})">🔄 Retake Quiz</button>
                        ${currentLessonIndex < allLessons.length - 1
                            ? `<button class="btn-outline" onclick="nextLesson()">Next Lesson →</button>`
                            : ''}
                    </div>
                </div>
            </div>

            ${breakdownHTML}
        </div>
    `;

    if (passed) {
        markAsComplete();
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.disabled = currentLessonIndex === 0;
    nextBtn.disabled = currentLessonIndex === allLessons.length - 1;
}

function previousLesson() {
    if (currentLessonIndex > 0) {
        const prevLesson = allLessons[currentLessonIndex - 1];
        loadLesson(prevLesson.id);
    }
}

function nextLesson() {
    if (currentLessonIndex < allLessons.length - 1) {
        const nextLesson = allLessons[currentLessonIndex + 1];
        loadLesson(nextLesson.id);
    }
}

function goBack() {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from === 'dashboard') {
        window.location.href = `dashboard.html#/my-courses`;
    } else {
        window.location.href = `dashboard.html#/my-courses`;
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}



let selectedRating = 0;
let userReview = null;


document.addEventListener('DOMContentLoaded', () => {
    const stars = document.querySelectorAll('#starRating .star');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.rating);
            updateStarDisplay();
        });
        
        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.dataset.rating);
            highlightStars(rating);
        });
    });
    
    document.getElementById('starRating').addEventListener('mouseleave', () => {
        highlightStars(selectedRating);
    });
});

function updateStarDisplay() {
    highlightStars(selectedRating);
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('#starRating .star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.textContent = '⭐';
            star.style.color = '#fbbf24';
        } else {
            star.textContent = '☆';
            star.style.color = '#d1d5db';
        }
    });
}

function loadReviews() {
    if (!currentCourseId) return;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://learnai-backend-yf50.onrender.com/api/courses/' + currentCourseId + '/reviews');
    xhr.onload = function() {
        try {
            var data = JSON.parse(xhr.responseText);
            if (data.success) { displayReviews(data.reviews); updateRatingSummary(data.reviews); }
        } catch(e) {}
    };
    xhr.send();

    var session = JSON.parse(localStorage.getItem('session'));
    if (session && session.user) {
        var xhr2 = new XMLHttpRequest();
        xhr2.open('GET', 'https://learnai-backend-yf50.onrender.com/api/courses/' + currentCourseId + '/reviews/user/' + session.user.id);
        xhr2.onload = function() {
            try {
                var data = JSON.parse(xhr2.responseText);
                if (data.success && data.review) { userReview = data.review; populateUserReview(data.review); }
            } catch(e) {}
        };
        xhr2.send();
    }
}

function updateRatingSummary(reviews) {
    if (reviews.length === 0) {
        document.getElementById('avgRating').textContent = '0.0';
        document.getElementById('avgStars').innerHTML = '☆☆☆☆☆';
        document.getElementById('reviewCount').textContent = 'No reviews yet';
        return;
    }
    
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    document.getElementById('avgRating').textContent = avgRating.toFixed(1);
    document.getElementById('avgStars').innerHTML = generateStarsHTML(avgRating);
    document.getElementById('reviewCount').textContent = `${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}`;
}

function generateStarsHTML(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let html = '';
    for (let i = 0; i < fullStars; i++) html += '⭐';
    if (hasHalfStar) html += '⭐';
    for (let i = 0; i < emptyStars; i++) html += '☆';
    
    return html;
}

function displayReviews(reviews) {
    const container = document.getElementById('reviewsList');
    
    if (reviews.length === 0) {
        container.innerHTML = '<p class="no-reviews">No reviews yet. Be the first to review this course!</p>';
        return;
    }
    
    container.innerHTML = reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <img src="${review.avatar_url || 'assets/default-avatar.png'}" alt="${review.full_name}" class="review-avatar">
                <div class="review-user-info">
                    <h4>${review.full_name}</h4>
                    <div class="review-rating">${generateStarsHTML(review.rating)}</div>
                    <span class="review-date">${formatDate(review.created_at)}</span>
                </div>
            </div>
            <div class="review-text">
                ${review.review_text || '<em>No written review</em>'}
            </div>
        </div>
    `).join('');
}

function populateUserReview(review) {
    selectedRating = review.rating;
    updateStarDisplay();
    document.getElementById('reviewText').value = review.review_text || '';
    document.getElementById('submitReviewBtn').textContent = 'Update Review';
}

function submitReview() {
    var session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.user) { showNotification('Please login to submit a review'); return; }
    if (selectedRating === 0) { showNotification('Please select a rating'); return; }
    var reviewText = document.getElementById('reviewText').value.trim();
    var submitBtn = document.getElementById('submitReviewBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://learnai-backend-yf50.onrender.com/api/courses/' + currentCourseId + '/reviews');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        try {
            var data = JSON.parse(xhr.responseText);
            if (data.success) {
                showNotification(data.action === 'updated' ? 'Review updated!' : 'Review submitted!');
                loadReviews();
                submitBtn.textContent = 'Update Review';
            } else { showNotification('Error submitting review'); }
        } catch(e) { showNotification('Error submitting review'); }
        submitBtn.disabled = false;
    };
    xhr.send(JSON.stringify({ user_id: session.user.id, rating: selectedRating, review_text: reviewText }));
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}
