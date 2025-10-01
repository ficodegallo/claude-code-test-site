const STORAGE_KEYS = {
    sessions: 'archerySessions',
    resources: 'archeryResources',
    spotlight: 'archerySpotlightId'
};

const DEFAULT_SESSIONS = [
    {
        date: formatDateISO(shiftDate(new Date(), -2)),
        location: 'Indoor range',
        focus: 'form',
        arrows: 48,
        bullseyes: 9,
        quality: 4,
        notes: 'Worked on a relaxed bow hand. Noticed cleaner release when I kept breath steady.'
    },
    {
        date: formatDateISO(shiftDate(new Date(), -5)),
        location: 'Backyard 15m',
        focus: 'accuracy',
        arrows: 36,
        bullseyes: 6,
        quality: 3,
        notes: 'Grouping improved after slowing down between shots.'
    },
    {
        date: formatDateISO(shiftDate(new Date(), -7)),
        location: 'Club night',
        focus: 'mental',
        arrows: 60,
        bullseyes: 11,
        quality: 5,
        notes: 'Shot a mini tournament round. Stayed composed and visualized each arrow.'
    }
];

const DEFAULT_RESOURCES = [
    {
        id: 'article-shot-sequence',
        title: 'Dial in Your Shot Sequence',
        url: 'https://archery360.com/2019/06/04/how-to-build-an-archery-shot-sequence/',
        category: 'article',
        notes: 'Step-by-step breakdown to tighten up consistency.',
        added: Date.now() - 1000 * 60 * 60 * 24 * 7,
        completed: false
    },
    {
        id: 'video-anchor-point',
        title: 'Finding a Repeatable Anchor Point',
        url: 'https://www.youtube.com/watch?v=YgJ6eBbg0xw',
        category: 'video',
        notes: 'Coach John Dudley explains anchoring for accuracy.',
        added: Date.now() - 1000 * 60 * 60 * 24 * 5,
        completed: false
    },
    {
        id: 'equipment-arrow-tuning',
        title: 'Arrow Tuning Checklist',
        url: 'https://www.lancasterarchery.com/blogs/archery-how-to/bare-shaft-tuning-basics',
        category: 'equipment',
        notes: 'Use before your next tuning session.',
        added: Date.now() - 1000 * 60 * 60 * 24 * 3,
        completed: false
    }
];

function shiftDate(date, days) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
}

function formatDateISO(date) {
    return date.toISOString().split('T')[0];
}

function formatDisplayDate(dateString) {
    return new Date(dateString + 'T00:00:00').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function initializeDefaults() {
    if (!localStorage.getItem(STORAGE_KEYS.sessions)) {
        localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(DEFAULT_SESSIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.resources)) {
        localStorage.setItem(STORAGE_KEYS.resources, JSON.stringify(DEFAULT_RESOURCES));
        localStorage.setItem(STORAGE_KEYS.spotlight, DEFAULT_RESOURCES[0].id);
    }
}

function readSessions() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.sessions)) || [];
    } catch (error) {
        console.error('Could not parse sessions', error);
        return [];
    }
}

function saveSessions(sessions) {
    localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
}

function readResources() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.resources)) || [];
    } catch (error) {
        console.error('Could not parse resources', error);
        return [];
    }
}

function saveResources(resources) {
    localStorage.setItem(STORAGE_KEYS.resources, JSON.stringify(resources));
}

function getSpotlightId() {
    return localStorage.getItem(STORAGE_KEYS.spotlight);
}

function setSpotlightId(id) {
    localStorage.setItem(STORAGE_KEYS.spotlight, id);
}

function computeStats(sessions) {
    if (!sessions.length) {
        return {
            totalSessions: 0,
            totalBullseyes: 0,
            monthlySessions: 0,
            currentStreak: 0,
            longestStreak: 0,
            streakDates: [],
            longestStreakDates: []
        };
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const dayMs = 1000 * 60 * 60 * 24;

    const uniqueDates = Array.from(new Set(
        sessions
            .map(session => session.date)
            .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b));

    const monthlySessions = uniqueDates.filter(date => {
        const current = new Date(date + 'T00:00:00');
        return current >= monthStart && current.getMonth() === today.getMonth();
    }).length;

    let longestStreak = 0;
    let longestStreakDates = [];
    let runLength = 0;
    let runDates = [];
    let previousDate = null;

    uniqueDates.forEach(date => {
        const currentDate = new Date(date + 'T00:00:00');
        if (previousDate) {
            const diff = (currentDate - previousDate) / dayMs;
            if (diff === 1) {
                runLength += 1;
                runDates.push(date);
            } else {
                runLength = 1;
                runDates = [date];
            }
        } else {
            runLength = 1;
            runDates = [date];
        }

        if (runLength > longestStreak) {
            longestStreak = runLength;
            longestStreakDates = [...runDates];
        }
        previousDate = currentDate;
    });

    const sortedDesc = [...uniqueDates].sort((a, b) => b.localeCompare(a));
    const latest = sortedDesc[0];
    let activeStreak = 0;
    let activeStreakDates = [];

    if (latest) {
        const latestDate = new Date(latest + 'T00:00:00');
        const diffFromToday = (todayStart - latestDate) / dayMs;
        if (diffFromToday <= 1) {
            activeStreak = 1;
            activeStreakDates = [latest];
            let prevDate = latestDate;
            for (let i = 1; i < sortedDesc.length; i++) {
                const current = new Date(sortedDesc[i] + 'T00:00:00');
                const diff = (prevDate - current) / dayMs;
                if (diff === 1) {
                    activeStreak += 1;
                    activeStreakDates.push(sortedDesc[i]);
                    prevDate = current;
                } else {
                    break;
                }
            }
        }
    }

    const totalBullseyes = sessions.reduce((sum, session) => sum + Number(session.bullseyes || 0), 0);

    return {
        totalSessions: sessions.length,
        totalBullseyes,
        monthlySessions,
        currentStreak: activeStreak,
        longestStreak,
        streakDates: activeStreakDates.sort((a, b) => a.localeCompare(b)),
        longestStreakDates
    };
}

function getMotivationMessage(stats) {
    if (stats.currentStreak >= 5) {
        return {
            title: `🔥 ${stats.currentStreak}-day streak on fire!`,
            message: 'Keep the momentum going. Lock in a focused drill today to extend it.'
        };
    }
    if (!stats.totalSessions) {
        return {
            title: 'Let’s get that first arrow in the log',
            message: 'Log your first session to unlock streak tracking and trend insights.'
        };
    }
    if (stats.monthlySessions < 4) {
        return {
            title: 'Time to schedule the next range trip',
            message: 'You are only a couple of reps away from establishing consistency this month.'
        };
    }
    return {
        title: 'Stack another purposeful session',
        message: 'Pick a focus area for today—form, accuracy, or mindset—and write down one insight afterwards.'
    };
}

function renderDashboard() {
    const sessions = readSessions();
    const stats = computeStats(sessions);

    const totalSessions = document.getElementById('totalSessions');
    const bullseyeCount = document.getElementById('bullseyeCount');
    const monthlySessions = document.getElementById('monthlySessions');
    const currentStreak = document.getElementById('currentStreak');
    const streakMessage = document.getElementById('streakMessage');

    if (totalSessions) totalSessions.textContent = stats.totalSessions;
    if (bullseyeCount) bullseyeCount.textContent = stats.totalBullseyes;
    if (monthlySessions) monthlySessions.textContent = `${stats.monthlySessions} session${stats.monthlySessions === 1 ? '' : 's'}`;
    if (currentStreak) currentStreak.textContent = `${stats.currentStreak || 0} day${stats.currentStreak === 1 ? '' : 's'}`;
    if (streakMessage) {
        if (!stats.currentStreak) {
            streakMessage.textContent = `Let's light the fuse on a new streak!`;
        } else if (stats.currentStreak < 3) {
            streakMessage.textContent = 'A couple more days locks in the habit. Schedule your next practice now.';
        } else {
            streakMessage.textContent = `Amazing work—${stats.currentStreak} days straight. Keep going!`;
        }
    }

    const recentSessions = document.getElementById('recentSessions');
    if (recentSessions) {
        recentSessions.innerHTML = '';
        const sorted = [...sessions].sort((a, b) => (a.date > b.date ? -1 : 1));
        sorted.slice(0, 5).forEach(session => {
            const item = document.createElement('li');
            item.className = 'timeline-item';
            item.innerHTML = `
                <h3>${formatDisplayDate(session.date)}</h3>
                <p><strong>Focus:</strong> ${formatFocus(session.focus)}</p>
                <p><strong>Notes:</strong> ${session.notes || 'No notes logged.'}</p>
            `;
            recentSessions.appendChild(item);
        });
        if (!sorted.length) {
            const empty = document.createElement('li');
            empty.className = 'timeline-empty';
            empty.textContent = 'No sessions recorded yet. Log your first practice today!';
            recentSessions.appendChild(empty);
        }
    }

    const motivationCard = document.getElementById('motivationCard');
    if (motivationCard) {
        const message = getMotivationMessage(stats);
        motivationCard.innerHTML = `
            <h3>${message.title}</h3>
            <p>${message.message}</p>
            <a href="day.html" class="primary">Log today’s practice</a>
        `;
    }

    renderSpotlight();
    renderLearningLists();
}

function formatFocus(focus) {
    const labels = {
        form: 'Form & posture',
        accuracy: 'Accuracy & grouping',
        distance: 'Long range practice',
        tuning: 'Equipment tuning',
        mental: 'Mental reps & visualization'
    };
    return labels[focus] || focus;
}

function renderSpotlight() {
    const container = document.getElementById('spotlightResource');
    if (!container) return;

    const resources = readResources();
    if (!resources.length) {
        container.innerHTML = '<p>Add a resource to feature it here.</p>';
        return;
    }
    let spotlight = resources.find(resource => resource.id === getSpotlightId());
    if (!spotlight) {
        spotlight = resources[0];
        setSpotlightId(spotlight.id);
    }

    container.innerHTML = `
        <h3>${spotlight.title}</h3>
        <p>${spotlight.notes || 'Keep this on your radar this week.'}</p>
        <a href="${spotlight.url}" target="_blank" rel="noopener" class="primary">Open resource</a>
    `;
}

function renderLearningLists() {
    const resources = readResources();
    const articleList = document.getElementById('articleList');
    const videoList = document.getElementById('videoList');

    if (articleList) {
        articleList.innerHTML = '';
        const articles = resources.filter(item => item.category === 'article').slice(0, 4);
        if (!articles.length) {
            articleList.innerHTML = '<li>No articles saved yet.</li>';
        } else {
            articles.forEach(article => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="${article.url}" target="_blank" rel="noopener">${article.title}</a><span>${article.notes || ''}</span>`;
                articleList.appendChild(li);
            });
        }
    }

    if (videoList) {
        videoList.innerHTML = '';
        const videos = resources.filter(item => item.category === 'video').slice(0, 4);
        if (!videos.length) {
            videoList.innerHTML = '<li>No videos saved yet.</li>';
        } else {
            videos.forEach(video => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="${video.url}" target="_blank" rel="noopener">${video.title}</a><span>${video.notes || ''}</span>`;
                videoList.appendChild(li);
            });
        }
    }
}

// Calendar page
function renderCalendar(currentDate) {
    const daysContainer = document.getElementById('calendarDays');
    const monthLabel = document.getElementById('monthLabel');
    if (!daysContainer || !monthLabel) return;

    const sessions = readSessions();
    const stats = computeStats(sessions);
    const streakDates = stats.streakDates || [];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const firstWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    monthLabel.textContent = firstDay.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    daysContainer.innerHTML = '';

    for (let i = 0; i < firstWeekday; i++) {
        const filler = document.createElement('span');
        filler.className = 'day filler';
        daysContainer.appendChild(filler);
    }

    const sessionMap = sessions.reduce((map, session) => {
        map[session.date] = session;
        return map;
    }, {});

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const iso = formatDateISO(date);
        const button = document.createElement('button');
        button.className = 'day';
        button.type = 'button';
        button.dataset.date = iso;
        button.innerHTML = `<span class="day-number">${day}</span>`;

        if (sessionMap[iso]) {
            button.classList.add('logged');
        }
        if (streakDates.includes(iso)) {
            button.classList.add('streak');
        }
        if (formatDateISO(new Date()) === iso) {
            button.classList.add('today');
        }

        button.addEventListener('click', () => {
            window.location.href = `day.html?date=${iso}`;
        });

        daysContainer.appendChild(button);
    }

    const summary = document.getElementById('streakSummary');
    const highlights = document.getElementById('streakHighlights');
    if (summary) {
        if (stats.currentStreak) {
            summary.textContent = `Current streak: ${stats.currentStreak} day${stats.currentStreak === 1 ? '' : 's'}. Longest streak: ${stats.longestStreak} day${stats.longestStreak === 1 ? '' : 's'}.`;
        } else {
            summary.textContent = 'No active streak yet. Log two sessions back-to-back to start one!';
        }
    }
    if (highlights) {
        highlights.innerHTML = '';
        streakDates.forEach(dateString => {
            const li = document.createElement('li');
            li.textContent = formatDisplayDate(dateString);
            highlights.appendChild(li);
        });
        if (!streakDates.length) {
            highlights.innerHTML = '<li>Build your streak to see it light up here.</li>';
        }
    }
}

// Day log page
function populateSessionForm() {
    const params = new URLSearchParams(window.location.search);
    const providedDate = params.get('date');
    const dateInput = document.getElementById('sessionDate');
    let sessions = readSessions();

    if (dateInput) {
        dateInput.value = providedDate || formatDateISO(new Date());
    }

    if (!dateInput) return;

    const session = sessions.find(entry => entry.date === dateInput.value);
    if (session) {
        setFormValues(session);
    }

    const deleteButton = document.getElementById('deleteSession');
    if (deleteButton) {
        deleteButton.disabled = !session;
        deleteButton.addEventListener('click', () => {
            sessions = sessions.filter(entry => entry.date !== dateInput.value);
            saveSessions(sessions);
            clearFormExceptDate();
            showFormMessage('Session deleted.', 'success');
            deleteButton.disabled = true;
            renderLastSession();
        });
    }

    const form = document.getElementById('sessionForm');
    if (form) {
        form.addEventListener('submit', event => {
            event.preventDefault();
            const newSession = getFormValues();
            const existingIndex = sessions.findIndex(entry => entry.date === newSession.date);
            if (existingIndex >= 0) {
                sessions[existingIndex] = newSession;
            } else {
                sessions.push(newSession);
            }
            saveSessions(sessions);
            showFormMessage('Session saved! Your streaks and stats are up to date.', 'success');
            const deleteBtn = document.getElementById('deleteSession');
            if (deleteBtn) deleteBtn.disabled = false;
            renderLastSession();
        });
    }

    const promptList = document.getElementById('promptList');
    if (promptList) {
        const prompts = shuffleArray([
            'What was the clearest cue that helped today? (e.g., elbow position, breathing rhythm)',
            'How did your mindset feel before and after the session?',
            'What minor adjustment made the biggest difference?',
            'Did any shot surprise you? Break down what happened.',
            'What is one thing you want to focus on next time?'
        ]).slice(0, 3);
        promptList.innerHTML = '';
        prompts.forEach(prompt => {
            const li = document.createElement('li');
            li.textContent = prompt;
            promptList.appendChild(li);
        });
    }

    renderLastSession();

    if (dateInput) {
        dateInput.addEventListener('change', () => {
            sessions = readSessions();
            const current = sessions.find(entry => entry.date === dateInput.value);
            if (current) {
                setFormValues(current);
                const deleteBtn = document.getElementById('deleteSession');
                if (deleteBtn) deleteBtn.disabled = false;
            } else {
                clearFormExceptDate();
                const deleteBtn = document.getElementById('deleteSession');
                if (deleteBtn) deleteBtn.disabled = true;
            }
            showFormMessage('', '');
        });
    }
}

function setFormValues(session) {
    const location = document.getElementById('sessionLocation');
    const focus = document.getElementById('sessionFocus');
    const arrows = document.getElementById('arrowsShot');
    const bullseyes = document.getElementById('bullseyes');
    const quality = document.getElementById('sessionQuality');
    const notes = document.getElementById('sessionNotes');

    if (location) location.value = session.location || '';
    if (focus) focus.value = session.focus || 'form';
    if (arrows) arrows.value = session.arrows || '';
    if (bullseyes) bullseyes.value = session.bullseyes || '';
    if (quality) quality.value = session.quality || 3;
    if (notes) notes.value = session.notes || '';
}

function clearFormExceptDate() {
    const location = document.getElementById('sessionLocation');
    const focus = document.getElementById('sessionFocus');
    const arrows = document.getElementById('arrowsShot');
    const bullseyes = document.getElementById('bullseyes');
    const quality = document.getElementById('sessionQuality');
    const notes = document.getElementById('sessionNotes');

    if (location) location.value = '';
    if (focus) focus.value = 'form';
    if (arrows) arrows.value = '';
    if (bullseyes) bullseyes.value = '';
    if (quality) quality.value = 3;
    if (notes) notes.value = '';
}

function getFormValues() {
    return {
        date: document.getElementById('sessionDate').value,
        location: document.getElementById('sessionLocation').value.trim(),
        focus: document.getElementById('sessionFocus').value,
        arrows: Number(document.getElementById('arrowsShot').value) || 0,
        bullseyes: Number(document.getElementById('bullseyes').value) || 0,
        quality: Number(document.getElementById('sessionQuality').value) || 3,
        notes: document.getElementById('sessionNotes').value.trim()
    };
}

function showFormMessage(message, type) {
    const messageEl = document.getElementById('formMessage') || document.getElementById('resourceMessage');
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.className = `form-message ${type}`;
}

function renderLastSession() {
    const sessions = readSessions();
    const container = document.getElementById('lastSession');
    if (!container || !sessions.length) {
        if (container) container.textContent = 'No previous sessions logged yet.';
        return;
    }
    const sorted = [...sessions].sort((a, b) => (a.date > b.date ? -1 : 1));
    const latest = sorted[0];
    container.innerHTML = `
        <h3>${formatDisplayDate(latest.date)}</h3>
        <p><strong>Location:</strong> ${latest.location || '—'}</p>
        <p><strong>Focus:</strong> ${formatFocus(latest.focus)}</p>
        <p><strong>Arrows:</strong> ${latest.arrows || '—'} | <strong>Bullseyes:</strong> ${latest.bullseyes || '—'}</p>
        <p><strong>Notes:</strong> ${latest.notes || 'No notes added.'}</p>
    `;
}

// Links page logic
function renderResources() {
    const list = document.getElementById('resourceList');
    const filter = document.getElementById('categoryFilter');
    if (!list) return;

    const resources = readResources();
    const spotlightId = getSpotlightId();
    const selected = filter ? filter.value : 'all';

    list.innerHTML = '';

    const filtered = resources
        .filter(resource => selected === 'all' || resource.category === selected)
        .sort((a, b) => (b.added || 0) - (a.added || 0));

    if (!filtered.length) {
        const empty = document.createElement('li');
        empty.className = 'vault-empty';
        empty.textContent = 'No resources saved yet. Add one above!';
        list.appendChild(empty);
        return;
    }

    filtered.forEach(resource => {
        const li = document.createElement('li');
        li.className = 'vault-item';
        if (resource.id === spotlightId) {
            li.classList.add('spotlighted');
        }
        li.innerHTML = `
            <div>
                <h3><a href="${resource.url}" target="_blank" rel="noopener">${resource.title}</a></h3>
                <p class="meta">${formatResourceCategory(resource.category)}${resource.completed ? ' • ✅ Marked complete' : ''}</p>
                <p>${resource.notes || ''}</p>
            </div>
            <div class="item-actions">
                <button type="button" data-action="spotlight" data-id="${resource.id}" class="secondary">${resource.id === spotlightId ? 'Spotlighted' : 'Set as spotlight'}</button>
                <button type="button" data-action="complete" data-id="${resource.id}" class="secondary">${resource.completed ? 'Mark as to-do' : 'Mark complete'}</button>
                <button type="button" data-action="remove" data-id="${resource.id}" class="danger">Remove</button>
            </div>
        `;
        list.appendChild(li);
    });
}

function formatResourceCategory(category) {
    switch (category) {
        case 'article':
            return 'Article / Guide';
        case 'video':
            return 'Video / Webinar';
        case 'equipment':
            return 'Equipment Research';
        case 'community':
            return 'Community & Coaching';
        default:
            return category;
    }
}

function shuffleArray(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function handleResourceForm() {
    const form = document.getElementById('resourceForm');
    const filter = document.getElementById('categoryFilter');
    if (filter) {
        filter.addEventListener('change', renderResources);
    }
    if (!form) return;

    form.addEventListener('submit', event => {
        event.preventDefault();
        const title = document.getElementById('resourceTitle').value.trim();
        const url = document.getElementById('resourceUrl').value.trim();
        const category = document.getElementById('resourceCategory').value;
        const notes = document.getElementById('resourceNotes').value.trim();

        if (!title || !url) {
            showFormMessage('Please provide a title and link.', 'error');
            return;
        }

        const resources = readResources();
        const resource = {
            id: `resource-${Date.now()}`,
            title,
            url,
            category,
            notes,
            added: Date.now(),
            completed: false
        };
        resources.push(resource);
        saveResources(resources);
        form.reset();
        showFormMessage('Resource added to your vault.', 'success');
        renderResources();
        if (!getSpotlightId()) {
            setSpotlightId(resource.id);
            renderSpotlight();
        }
    });

    const list = document.getElementById('resourceList');
    if (list) {
        list.addEventListener('click', event => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            const action = target.dataset.action;
            const id = target.dataset.id;
            if (!action || !id) return;

            let resources = readResources();
            const index = resources.findIndex(item => item.id === id);
            if (index < 0) return;

            if (action === 'spotlight') {
                setSpotlightId(id);
                showFormMessage('Spotlight updated! Check your dashboard.', 'success');
            }
            if (action === 'complete') {
                resources[index].completed = !resources[index].completed;
                saveResources(resources);
                showFormMessage(resources[index].completed ? 'Nice! Marked as complete.' : 'Marked as to-do.', 'success');
            }
            if (action === 'remove') {
                resources.splice(index, 1);
                saveResources(resources);
                if (getSpotlightId() === id) {
                    const newSpotlight = resources[0]?.id;
                    if (newSpotlight) {
                        setSpotlightId(newSpotlight);
                    } else {
                        localStorage.removeItem(STORAGE_KEYS.spotlight);
                    }
                    renderSpotlight();
                }
                showFormMessage('Resource removed.', 'success');
            }
            saveResources(resources);
            renderResources();
            renderSpotlight();
        });
    }
}

let calendarDate = new Date();

function setupCalendarNavigation() {
    const prev = document.getElementById('prevMonth');
    const next = document.getElementById('nextMonth');
    if (prev) {
        prev.addEventListener('click', () => {
            calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
            renderCalendar(calendarDate);
        });
    }
    if (next) {
        next.addEventListener('click', () => {
            calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
            renderCalendar(calendarDate);
        });
    }
}

function onReady() {
    initializeDefaults();
    const page = document.body.dataset.page;
    switch (page) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'calendar':
            renderCalendar(calendarDate);
            setupCalendarNavigation();
            break;
        case 'day':
            populateSessionForm();
            break;
        case 'links':
            handleResourceForm();
            renderResources();
            break;
        default:
            break;
    }
}

document.addEventListener('DOMContentLoaded', onReady);
