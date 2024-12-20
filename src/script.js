// Constants
const ARRIVAL_STATE_DURATION = 5000;
const ENGAGEMENT_STATE_DURATION = 15000;

// Breathing patterns in seconds: [inhale, hold1, exhale, hold2]
const breathingPatterns = {
    '4-4-4-4': [4, 4, 4, 4],
    '4-7-8': [4, 7, 8, 0],
    '5-5': [5, 0, 5, 0]
};

// State management
let currentPattern = '4-4-4-4';
let isBreathingActive = false;
let audioEnabled = false;
let timerInterval = null;
let currentState = 'arrival';
let breathingInterval = null;

// Audio context and elements
let audioContext;
let binaural40Hz;
let binaural432Hz;
const inhaleSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-fast-small-sweep-transition-166.mp3');
const exhaleSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-fast-small-sweep-transition-166.mp3');
const chimeSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-bell-notification-933.mp3');

// Set audio volumes
[inhaleSound, exhaleSound, chimeSound].forEach(sound => {
    sound.volume = 0.2; // -20db approximation
});

// DOM elements
const breathingCircle = document.querySelector('.breathing-circle');
const breathingInstruction = document.querySelector('.breathing-instruction');
const progressiveContent = document.querySelector('.progressive-content');
const patternButtons = document.querySelectorAll('.pattern-btn');
const toggleAudioBtn = document.getElementById('toggleAudio');
const toggleTimerBtn = document.getElementById('toggleTimer');
const timerModal = document.querySelector('.timer-modal');
const timerInput = document.getElementById('timerMinutes');
const startTimerBtn = document.getElementById('startTimer');
const activeUsersSpan = document.getElementById('activeUsers');
const startStopBtn = document.querySelector('.start-stop-btn');

// Calming messages with progressive disclosure
const calmingMessages = {
    arrival: [
        "Just focus on the circle",
        "Follow your breath",
    ],
    engagement: [
        "Notice how your body feels",
        "You're doing great",
        "Stay with your breath",
    ],
    active: [
        "Each breath brings more peace",
        "Let go of any tension",
        "You're safe and supported",
        "This moment is yours",
        "We're here with you",
    ]
};

// Initialize audio context and binaural beats
function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create 40Hz binaural beat (anxiety reduction)
    const baseFreq = 200;
    binaural40Hz = createBinauralBeat(baseFreq, baseFreq + 40);
    
    // Create 432Hz binaural beat
    binaural432Hz = createBinauralBeat(432, 432 + 8);
}

function createBinauralBeat(leftFreq, rightFreq) {
    const leftOsc = audioContext.createOscillator();
    const rightOsc = audioContext.createOscillator();
    const leftGain = audioContext.createGain();
    const rightGain = audioContext.createGain();
    const merger = audioContext.createChannelMerger(2);

    leftOsc.frequency.value = leftFreq;
    rightOsc.frequency.value = rightFreq;
    leftGain.gain.value = 0.1; // -20db
    rightGain.gain.value = 0.1;

    leftOsc.connect(leftGain);
    rightOsc.connect(rightGain);
    leftGain.connect(merger, 0, 0);
    rightGain.connect(merger, 0, 1);
    merger.connect(audioContext.destination);

    return {
        start: () => {
            leftOsc.start();
            rightOsc.start();
        },
        stop: () => {
            leftOsc.stop();
            rightOsc.stop();
        }
    };
}

// Progressive disclosure state management
function updateState() {
    if (currentState === 'arrival' && Date.now() - startTime > ARRIVAL_STATE_DURATION) {
        currentState = 'engagement';
        breathingInstruction.textContent = 'Breathe with the circle';
        progressiveContent.style.opacity = '0.3';
    } else if (currentState === 'engagement' && Date.now() - startTime > ENGAGEMENT_STATE_DURATION) {
        currentState = 'active';
        progressiveContent.style.opacity = '1';
        document.querySelector('.pattern-selector').style.opacity = '1';
        document.querySelector('.controls').style.opacity = '1';
    }
}

// Update breathing animation with exponential easing
function updateBreathing() {
    const [inhale, hold1, exhale, hold2] = breathingPatterns[currentPattern];
    const totalCycleDuration = (inhale + hold1 + exhale + hold2) * 1000;

    function breathingCycle() {
        if (!isBreathingActive) return;

        // Inhale
        breathingCircle.classList.add('inhale');
        breathingInstruction.textContent = 'Breathe in...';
        if (audioEnabled) inhaleSound.play();

        // Hold after inhale
        setTimeout(() => {
            if (!isBreathingActive) return;
            breathingInstruction.textContent = 'Hold...';
        }, inhale * 1000);

        // Exhale
        setTimeout(() => {
            if (!isBreathingActive) return;
            breathingCircle.classList.remove('inhale');
            breathingInstruction.textContent = 'Breathe out...';
            if (audioEnabled) exhaleSound.play();
        }, (inhale + hold1) * 1000);

        // Hold after exhale
        setTimeout(() => {
            if (!isBreathingActive) return;
            breathingInstruction.textContent = 'Hold...';
        }, (inhale + hold1 + exhale) * 1000);
    }

    breathingCycle();
    return setInterval(breathingCycle, totalCycleDuration);
}

// Toggle breathing animation
function toggleBreathing() {
    isBreathingActive = !isBreathingActive;
    startStopBtn.querySelector('.control-icon').textContent = isBreathingActive ? '⏸️' : '▶️';
    
    if (isBreathingActive) {
        breathingInterval = updateBreathing();
    } else {
        if (breathingInterval) {
            clearInterval(breathingInterval);
        }
        breathingCircle.classList.remove('inhale');
        breathingInstruction.textContent = 'Paused';
    }
}

// Update calming message based on current state
function updateCalmingMessage() {
    const messageElement = document.querySelector('.calming-message');
    const messages = calmingMessages[currentState];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    messageElement.style.opacity = '0';
    setTimeout(() => {
        messageElement.textContent = randomMessage;
        messageElement.style.opacity = '1';
    }, 500);
}

// Initialize random active users (smaller number for less cognitive load)
function updateActiveUsers() {
    const randomUsers = Math.floor(Math.random() * (1000 - 100 + 1)) + 100;
    activeUsersSpan.textContent = randomUsers.toLocaleString();
}

// Timer functionality
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function updateTimer(timeLeft) {
    const timerDisplay = document.querySelector('.timer-display');
    if (!timerDisplay) return;
    
    timerDisplay.textContent = formatTime(timeLeft);
}

// Event Listeners
startStopBtn.addEventListener('click', toggleBreathing);

patternButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (currentState !== 'active') return;
        
        patternButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPattern = btn.dataset.pattern;
        
        if (breathingInterval) {
            clearInterval(breathingInterval);
        }
        if (isBreathingActive) {
            breathingInterval = updateBreathing();
        }
    });
});

toggleAudioBtn.addEventListener('click', () => {
    if (currentState !== 'active') return;
    
    audioEnabled = !audioEnabled;
    toggleAudioBtn.querySelector('.icon').style.opacity = audioEnabled ? '1' : '0.5';
    
    if (audioEnabled) {
        if (!audioContext) initAudio();
        binaural40Hz.start();
        binaural432Hz.start();
    } else {
        binaural40Hz?.stop();
        binaural432Hz?.stop();
    }
});

// Timer functionality
toggleTimerBtn.addEventListener('click', () => {
    timerModal.hidden = !timerModal.hidden;
});

document.querySelectorAll('.timer-adjust').forEach(btn => {
    btn.addEventListener('click', () => {
        const adjustment = parseInt(btn.dataset.adjust);
        let currentValue = parseInt(timerInput.value);
        currentValue = Math.max(1, Math.min(60, currentValue + adjustment));
        timerInput.value = currentValue;
    });
});

document.querySelectorAll('.timer-preset').forEach(btn => {
    btn.addEventListener('click', () => {
        timerInput.value = btn.dataset.minutes;
    });
});

startTimerBtn.addEventListener('click', () => {
    const minutes = parseInt(timerInput.value);
    if (minutes > 0) {
        let timeLeft = minutes * 60;
        timerModal.hidden = true;
        
        if (timerInterval) clearInterval(timerInterval);
        
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimer(timeLeft);
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                if (audioEnabled) chimeSound.play();
                isBreathingActive = false;
                if (breathingInterval) {
                    clearInterval(breathingInterval);
                }
                breathingCircle.classList.remove('inhale');
                breathingInstruction.textContent = 'Session Complete';
                startStopBtn.querySelector('.control-icon').textContent = '▶️';
            }
        }, 1000);
    }
});

// Initialize
const startTime = Date.now();

// Update states and messages
setInterval(updateState, 1000);
setInterval(updateCalmingMessage, 10000);
setInterval(updateActiveUsers, 30000);

// Initial setup
updateActiveUsers();
updateCalmingMessage();

// Respect reduced motion preferences
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.setProperty('--transition-slow', '0.01ms');
    document.documentElement.style.setProperty('--transition-medium', '0.01ms');
    document.documentElement.style.setProperty('--transition-fast', '0.01ms');
}