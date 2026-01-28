// Timer configuration
const INTERVALS = [43, 37, 25]; // Minutes
const REMINDER_INTERVAL = 3.5 * 60 * 60 * 1000; // 3.5 hours in milliseconds

// State management
const state = {
    isRunning: false,
    isPaused: false,
    currentTime: 0, // in seconds
    totalSeconds: 43 * 60, // Start with 43 minutes
    currentIntervalIndex: 0,
    continueCount: 0,
    sessionsCompleted: 0,
    totalBreakTime: 0,
    sessionStartTime: null,
};

// DOM elements
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const intervalDisplay = document.getElementById('interval');
const continueCountDisplay = document.getElementById('continueCount');
const statusDisplay = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const continueBtn = document.getElementById('continueBtn');
const stopBtn = document.getElementById('stopBtn');
const notificationModal = document.getElementById('notificationModal');
const sessionsCompletedDisplay = document.getElementById('sessionsCompleted');
const totalBreakTimeDisplay = document.getElementById('totalBreakTime');
const sessionTimeDisplay = document.getElementById('sessionTime');

let timerInterval = null;
let sessionInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    continueBtn.addEventListener('click', continueSession);
    stopBtn.addEventListener('click', stopSession);

    updateDisplay();
    loadState();
});

// Load state from localStorage
function loadState() {
    const saved = localStorage.getItem('screenTimeState');
    if (saved) {
        Object.assign(state, JSON.parse(saved));
        updateDisplay();
    }
}

// Save state to localStorage
function saveState() {
    localStorage.setItem('screenTimeState', JSON.stringify(state));
}

// Start timer
function startTimer() {
    if (!state.isRunning) {
        state.isRunning = true;
        state.isPaused = false;
        state.sessionStartTime = Date.now();

        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBtn.disabled = true;

        updateStatus('Running');

        timerInterval = setInterval(() => {
            state.currentTime++;

            if (state.currentTime >= state.totalSeconds) {
                triggerBreakNotification();
            }

            updateDisplay();
            saveState();
        }, 1000);

        sessionInterval = setInterval(() => {
            updateSessionTime();
        }, 1000);
    }
}

// Pause timer
function pauseTimer() {
    if (state.isRunning) {
        state.isRunning = false;
        state.isPaused = true;

        clearInterval(timerInterval);
        clearInterval(sessionInterval);

        startBtn.disabled = false;
        pauseBtn.disabled = true;

        updateStatus('Paused');
        saveState();
    }
}

// Reset timer
function resetTimer() {
    state.isRunning = false;
    state.isPaused = false;
    state.currentTime = 0;
    state.currentIntervalIndex = 0;
    state.totalSeconds = INTERVALS[0] * 60;
    state.continueCount = 0;
    state.sessionStartTime = null;

    clearInterval(timerInterval);
    clearInterval(sessionInterval);

    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = false;

    updateStatus('Ready');
    updateDisplay();
    saveState();
}

// Trigger break notification
function triggerBreakNotification() {
    clearInterval(timerInterval);
    clearInterval(sessionInterval);

    state.isRunning = false;
    updateStatus('Break Time!');

    // Show notification modal
    notificationModal.classList.remove('hidden');

    // Play sound if available
    playNotificationSound();

    saveState();
}

// Continue session
function continueSession() {
    notificationModal.classList.add('hidden');
    state.continueCount++;
    state.currentIntervalIndex = (state.currentIntervalIndex + 1) % INTERVALS.length;
    state.totalSeconds = INTERVALS[state.currentIntervalIndex] * 60;
    state.currentTime = 0;
    state.totalBreakTime += 5; // Assume 5 min break

    updateDisplay();
    startTimer();
}

// Stop session and reset
function stopSession() {
    notificationModal.classList.add('hidden');
    
    // Record session as completed
    state.sessionsCompleted++;
    
    resetTimer();
    
    // Show reminder in 3.5 hours
    setTimeout(() => {
        showReminder();
    }, REMINDER_INTERVAL);
}

// Update display
function updateDisplay() {
    const minutes = Math.floor(state.currentTime / 60);
    const seconds = state.currentTime % 60;

    minutesDisplay.textContent = String(minutes).padStart(2, '0');
    secondsDisplay.textContent = String(seconds).padStart(2, '0');

    const intervalMinutes = INTERVALS[state.currentIntervalIndex];
    intervalDisplay.textContent = `${intervalMinutes} minutes`;

    continueCountDisplay.textContent = state.continueCount;
    sessionsCompletedDisplay.textContent = state.sessionsCompleted;
    totalBreakTimeDisplay.textContent = `${state.totalBreakTime} min`;
}

// Update status
function updateStatus(status) {
    statusDisplay.textContent = status;
}

// Update session time
function updateSessionTime() {
    if (state.sessionStartTime) {
        const elapsed = Math.floor((Date.now() - state.sessionStartTime) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        sessionTimeDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
}

// Play notification sound
function playNotificationSound() {
    // Create a simple beep sound using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('Audio not available');
    }
}

// Show reminder
function showReminder() {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Screen Time Reminder', {
            body: 'Time to take a break! You\'ve been working hard.',
            icon: '🕐'
        });
    }
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Persist state before page unload
window.addEventListener('beforeunload', () => {
    saveState();
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden
        pauseTimer();
    }
});
