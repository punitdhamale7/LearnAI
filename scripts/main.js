document.addEventListener('DOMContentLoaded', function() {
    
    if (window.API && window.API.isAuthenticated()) {
        const currentUser = window.API.getCurrentUser();
        
        
        document.getElementById('registerLink').style.display = 'none';
        document.getElementById('loginLink').style.display = 'none';
        document.getElementById('myCoursesLink').style.display = 'block';
        
        
        const profileHeader = document.querySelector('.profile-header h4');
        const profileEmail = document.querySelector('.profile-header p');
        if (profileHeader && currentUser) profileHeader.textContent = currentUser.fullName || currentUser.username || 'User';
        if (profileEmail && currentUser) profileEmail.textContent = currentUser.email || '';
        
        
        document.getElementById('ctaButton').innerHTML = 'Go to Dashboard <span class="arrow">→</span>';
    } else {
        
        document.getElementById('myCoursesLink').style.display = 'none';
    }
});


function toggleMobileNav() {
    const nav = document.getElementById('navLinks');
    const btn = document.getElementById('hamburgerBtn');
    nav.classList.toggle('mobile-open');
    btn.classList.toggle('open');
}


document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#navLinks .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            document.getElementById('navLinks').classList.remove('mobile-open');
            document.getElementById('hamburgerBtn').classList.remove('open');
        });
    });
});


function toggleProfile() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('show');
}


document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('profileDropdown');
    const profileIcon = document.querySelector('.profile-icon');
    
    if (dropdown && profileIcon) {
        if (!dropdown.contains(event.target) && !profileIcon.contains(event.target)) {
            dropdown.classList.remove('show');
        }
    }
});


document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('profileDropdown');
    const profileIcon = document.querySelector('.profile-icon');
    
    if (dropdown && !dropdown.contains(event.target) && !profileIcon.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});


function getStarted() {
    if (window.API && window.API.isAuthenticated()) {
        
        window.location.href = 'dashboard.html';
    } else {
        
        window.location.href = 'register.html';
    }
}


function logout() {
    if (window.API) {
        window.API.logout();
    } else {
        
        localStorage.removeItem('session');
        sessionStorage.clear();
        alert('You have been logged out successfully');
        window.location.replace('login.html');
    }
}


let currentTeamIndex = 0;
const teamMembers = document.querySelectorAll('.team-member');
const dots = document.querySelectorAll('.dot');

function showTeamMember(index) {
    
    teamMembers.forEach(member => {
        member.classList.remove('active', 'prev');
    });
    dots.forEach(dot => {
        dot.classList.remove('active');
    });
    
    
    if (teamMembers[index]) {
        teamMembers[index].classList.add('active');
        dots[index].classList.add('active');
    }
}

function slideTeam(direction) {
    currentTeamIndex += direction;
    
    
    if (currentTeamIndex >= teamMembers.length) {
        currentTeamIndex = 0;
    } else if (currentTeamIndex < 0) {
        currentTeamIndex = teamMembers.length - 1;
    }
    
    showTeamMember(currentTeamIndex);
}

function currentSlide(index) {
    currentTeamIndex = index;
    showTeamMember(currentTeamIndex);
}


setInterval(() => {
    slideTeam(1);
}, 7000);


document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});


window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});


const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);


document.addEventListener('DOMContentLoaded', () => {
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease-out';
        observer.observe(card);
    });
});



// Fetch and display real statistics from database
async function loadRealStatistics() {
    try {
        const response = await fetch('https://learnai-backend-yf50.onrender.com/api/statistics');
        const data = await response.json();
        
        if (data.success) {
            const stats = data.statistics;
            
            // Update the data-target attributes with real values from database
            const statStudents = document.getElementById('statStudents');
            const statCourses = document.getElementById('statCourses');
            const statSuccessRate = document.getElementById('statSuccessRate');
            const statInstructors = document.getElementById('statInstructors');
            
            if (statStudents) statStudents.setAttribute('data-target', stats.activeStudents);
            if (statCourses) statCourses.setAttribute('data-target', stats.coursesAvailable);
            if (statSuccessRate) statSuccessRate.setAttribute('data-target', stats.successRate);
            if (statInstructors) statInstructors.setAttribute('data-target', stats.expertInstructors);
            
            console.log('✓ Real statistics loaded:', stats);
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
        // Fallback to default values if API fails
        const statStudents = document.getElementById('statStudents');
        const statCourses = document.getElementById('statCourses');
        const statSuccessRate = document.getElementById('statSuccessRate');
        const statInstructors = document.getElementById('statInstructors');
        
        if (statStudents) statStudents.setAttribute('data-target', '0');
        if (statCourses) statCourses.setAttribute('data-target', '4');
        if (statSuccessRate) statSuccessRate.setAttribute('data-target', '0');
        if (statInstructors) statInstructors.setAttribute('data-target', '4');
    }
}

// Load statistics when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadRealStatistics();
});

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current).toLocaleString();
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target.toLocaleString();
        }
    };
    
    updateCounter();
}


const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counters = entry.target.querySelectorAll('.stat-number');
            counters.forEach(counter => {
                if (counter.textContent === '0') {
                    animateCounter(counter);
                }
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.addEventListener('DOMContentLoaded', () => {
    const statsSection = document.querySelector('.stats');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }
});


function toggleFAQ(element) {
    const faqItem = element.parentElement;
    const isActive = faqItem.classList.contains('active');
    
    
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
    
    
    if (!isActive) {
        faqItem.classList.add('active');
    }
}


function viewAllCourses() {
    if (window.API && window.API.isAuthenticated()) {
        
        window.location.href = 'browse-courses.html';
    } else {
        
        window.location.href = 'register.html';
    }
}


const activityColors = ['icon-blue','icon-purple','icon-indigo','icon-orange','icon-green','icon-red'];
const activities = [
    { name: 'Alex M.',  action: 'completed',              course: 'Python Basics',       color: 'icon-blue'   },
    { name: 'Sarah K.', action: 'earned a certificate in', course: 'Web Development',     color: 'icon-purple' },
    { name: 'John D.',  action: 'started learning',        course: 'Machine Learning',    color: 'icon-indigo' },
    { name: 'Emma R.',  action: 'achieved 100% in',        course: 'JavaScript Quiz',     color: 'icon-orange' },
    { name: 'Mike T.',  action: 'unlocked',                course: 'Advanced React',      color: 'icon-green'  },
    { name: 'Lisa P.',  action: 'completed',               course: 'CSS Mastery',         color: 'icon-red'    },
    { name: 'David W.', action: 'started learning',        course: 'Node.js Fundamentals',color: 'icon-blue'   },
    { name: 'Anna S.',  action: 'earned a certificate in', course: 'Data Science',        color: 'icon-purple' }
];

let activityIndex = 5;

function addNewActivity() {
    const container = document.querySelector('.activity-container');
    if (!container) return;
    
    const activity = activities[activityIndex % activities.length];
    activityIndex++;
    
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    activityItem.innerHTML = `
        <div class="activity-avatar"><span class="icon-3d-wrapper icon-md ${activity.color}"><i data-lucide="user"></i></span></div>
        <div class="activity-content">
            <p><strong>${activity.name}</strong> ${activity.action} <span class="highlight">${activity.course}</span></p>
            <span class="activity-time">Just now</span>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
    
    container.insertBefore(activityItem, container.firstChild);
    
    
    updateActivityTimestamps();
    
    
    if (container.children.length > 5) {
        container.removeChild(container.lastChild);
    }
}

function updateActivityTimestamps() {
    const items = document.querySelectorAll('.activity-time');
    const times = ['Just now', '2 minutes ago', '5 minutes ago', '8 minutes ago', '12 minutes ago'];
    items.forEach((item, index) => {
        if (index < times.length) {
            item.textContent = times[index];
        }
    });
}


setInterval(addNewActivity, 10000);


document.addEventListener('DOMContentLoaded', () => {
    
    const courseCards = document.querySelectorAll('.course-card');
    courseCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `all 0.6s ease-out ${index * 0.1}s`;
        observer.observe(card);
    });
    
    
    const pricingCards = document.querySelectorAll('.pricing-card');
    pricingCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `all 0.6s ease-out ${index * 0.1}s`;
        observer.observe(card);
    });
});



document.addEventListener('DOMContentLoaded', () => {
    if (window.API && window.API.isAuthenticated()) {
        const currentUser = window.API.getCurrentUser();
        
        
        const profileDropdown = document.getElementById('profileDropdown');
        if (profileDropdown && currentUser) {
            const userName = profileDropdown.querySelector('.profile-header h4');
            const userEmail = profileDropdown.querySelector('.profile-header p');
            
            if (userName) {
                userName.textContent = currentUser.fullName || currentUser.username || 'User';
            }
            if (userEmail) {
                userEmail.textContent = currentUser.email || '';
            }
        }
        
        
        const ctaButton = document.getElementById('ctaButton');
        if (ctaButton) {
            ctaButton.innerHTML = 'Start Learning <span class="arrow">→</span>';
        }
        
        
        if (currentUser && currentUser.id) {
            fetch(`https://learnai-backend-yf50.onrender.com/api/profile/${currentUser.id}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.profile.avatar_url) {
                        
                        const profileImg = document.getElementById('profileImg');
                        const dropdownImg = document.querySelector('.profile-dropdown .profile-header img');
                        
                        if (profileImg) {
                            profileImg.src = data.profile.avatar_url;
                        }
                        if (dropdownImg) {
                            dropdownImg.src = data.profile.avatar_url;
                        }
                    }
                })
                .catch(error => {
                    console.error('Error loading avatar:', error);
                });
        }
    }
    
    
    loadFeaturedCourses();
});


function loadFeaturedCourses() {
    const grid = document.getElementById('featuredCoursesGrid');
    
    if (!grid) return;
    
    fetch('https://learnai-backend-yf50.onrender.com/api/courses')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.courses.length > 0) {
                grid.innerHTML = '';
                
                
                const featuredCourses = data.courses.slice(0, 4);
                
                featuredCourses.forEach(course => {
                    const courseCard = createCourseCard(course);
                    grid.appendChild(courseCard);
                });
            } else {
                grid.innerHTML = '<div style="text-align: center; padding: 40px; color: #666; grid-column: 1 / -1;">No courses available</div>';
            }
        })
        .catch(error => {
            console.error('Error loading courses:', error);
            grid.innerHTML = '<div style="text-align: center; padding: 40px; color: #666; grid-column: 1 / -1;">Error loading courses</div>';
        });
}

function getCourseIcon(title) {
    let iconName = 'book-open', colorClass = 'icon-blue';
    if (title.includes('Web') || title.includes('Full Stack'))   { iconName = 'globe';         colorClass = 'icon-indigo'; }
    else if (title.includes('Python'))                            { iconName = 'terminal';      colorClass = 'icon-green';  }
    else if (title.includes('AI') || title.includes('Machine'))   { iconName = 'cpu';           colorClass = 'icon-purple'; }
    else if (title.includes('Mobile') || title.includes('App'))   { iconName = 'smartphone';   colorClass = 'icon-blue';   }
    else if (title.includes('React'))                             { iconName = 'layers';        colorClass = 'icon-blue';   }
    else if (title.includes('Node'))                              { iconName = 'server';        colorClass = 'icon-green';  }
    else if (title.includes('Database') || title.includes('SQL')) { iconName = 'database';      colorClass = 'icon-orange'; }
    else if (title.includes('Design') || title.includes('UI'))    { iconName = 'pen-tool';      colorClass = 'icon-red';    }
    else if (title.includes('JavaScript') || title.includes('JS')){ iconName = 'zap';           colorClass = 'icon-yellow'; }
    else if (title.includes('Data'))                              { iconName = 'bar-chart-2';  colorClass = 'icon-orange'; }
    return `<span class="icon-3d-wrapper icon-xl ${colorClass}"><i data-lucide="${iconName}"></i></span>`;
}

function createCourseCard(course) {
    const card = document.createElement('div');
    card.className = 'course-card';
    
    const icon = getCourseIcon(course.title);
    const formattedPrice = `₹${parseFloat(course.price).toLocaleString('en-IN')}`;
    const formattedStudents = course.total_students.toLocaleString('en-IN');
    
    card.innerHTML = `
        <div class="course-image">
            <span class="course-visual-icon">${icon}</span>
            <span class="course-badge">${course.difficulty_level}</span>
        </div>
        <div class="course-content">
            <h3>${course.title}</h3>
            <p class="course-instructor"><i data-lucide="user" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> By ${course.instructor_name}</p>
            <p class="course-description">${course.description}</p>
            <div class="course-meta">
                <span class="course-rating"><i data-lucide="star" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:3px;color:#f59e0b;"></i> ${course.rating}</span>
                <span class="course-students"><i data-lucide="users" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:3px;"></i> ${formattedStudents}</span>
            </div>
            <div class="course-footer">
                <span class="course-price">${formattedPrice}</span>
                <button class="course-btn" onclick="handleCourseEnroll()">Enroll Now</button>
            </div>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
    
    return card;
}

function handleCourseEnroll() {
    if (window.API && window.API.isAuthenticated()) {
        window.location.href = 'browse-courses.html';
    } else {
        window.location.href = 'register.html';
    }
}






window.showGlobalLoading = function() {
    let overlay = document.getElementById('globalLoadingOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'globalLoadingOverlay';
        overlay.className = 'global-loading-overlay';
        overlay.innerHTML = '<div class="global-loading-spinner"></div>';
        document.body.appendChild(overlay);
    }
    setTimeout(() => overlay.classList.add('active'), 10);
};

window.hideGlobalLoading = function() {
    const overlay = document.getElementById('globalLoadingOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
};


window.setButtonLoading = function(button, loading = true) {
    if (loading) {
        button.dataset.originalText = button.textContent;
        button.classList.add('btn-loading');
        button.disabled = true;
    } else {
        button.classList.remove('btn-loading');
        button.disabled = false;
        if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
        }
    }
};


window.createInlineSpinner = function(size = 20) {
    const spinner = document.createElement('div');
    spinner.className = 'inline-spinner';
    spinner.style.cssText = `
        display: inline-block;
        width: ${size}px;
        height: ${size}px;
        border: 2px solid rgba(0, 0, 0, 0.1);
        border-top: 2px solid #6B7280;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        vertical-align: middle;
        margin-right: 8px;
    `;
    return spinner;
};


window.showLoadingInContainer = function(container, message = 'Loading...') {
    if (typeof container === 'string') {
        container = document.getElementById(container) || document.querySelector(container);
    }
    if (!container) return;
    
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
            <div style="width: 40px; height: 40px; border: 4px solid #f3f4f6; border-top: 4px solid #6B7280; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <p>${message}</p>
        </div>
    `;
};


window.showErrorInContainer = function(container, message = 'An error occurred', retryCallback = null) {
    if (typeof container === 'string') {
        container = document.getElementById(container) || document.querySelector(container);
    }
    if (!container) return;
    
    const retryButton = retryCallback ? `
        <button onclick="(${retryCallback.toString()})()" style="margin-top: 20px; padding: 10px 20px; background: #6B7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
            Retry
        </button>
    ` : '';
    
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
            <div style="display:flex;justify-content:center;margin-bottom:16px;"><span class="icon-3d-wrapper icon-lg icon-red"><i data-lucide="alert-triangle"></i></span></div>
            <h3 style="margin-bottom: 8px;">Error</h3>
            <p>${message}</p>
            ${retryButton}
        </div>
    `;
    if (window.lucide) lucide.createIcons();
};


window.showLoadingToast = function(message = 'Loading...') {
    const toast = document.createElement('div');
    toast.className = 'loading-toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: white;
        color: #111827;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    const spinner = createInlineSpinner(16);
    spinner.style.margin = '0';
    toast.appendChild(spinner);
    
    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);
    
    document.body.appendChild(toast);
    
    return {
        remove: () => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        },
        update: (newMessage) => {
            text.textContent = newMessage;
        }
    };
};
