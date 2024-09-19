// Initialize the exercises object with the Box Breathing exercise
window.exercises = {
  anxiety: { 
    name: `Box Breathing`, 
    phases: [
        { duration: 4000, instruction: 'Breathe In', type: 'inhale' },
        { duration: 4000, instruction: 'Hold', type: 'hold' },
        { duration: 4000, instruction: 'Breathe Out', type: 'exhale' },
        { duration: 4000, instruction: 'Hold', type: 'hold' }
    ]
  },
  deepRelax: { 
    name: `Deep Relaxation`, 
    phases: [
        { duration: 5000, instruction: 'Breathe In Deeply', type: 'inhale' },
        { duration: 5000, instruction: 'Hold Deeply', type: 'hold' },
        { duration: 5000, instruction: 'Breathe Out Slowly', type: 'exhale' },
        { duration: 5000, instruction: 'Hold Shoulders', type: 'hold' }
    ]
  }
};

// Initialize variables for managing the breathing exercise
let isExerciseActive = false;
let isCountingDown = false;
let animationManager;
let currentExercise = 'anxiety';
let countdownInterval;
let countdown = 2;

// Define a storage object for managing local storage
const storage = {
  get: (keys, callback) => {
      const result = {};
      keys.forEach(key => {
          result[key] = JSON.parse(localStorage.getItem(key)) || null;
      });
      callback(result);
  },
  set: (data) => {
      Object.keys(data).forEach(key => {
          localStorage.setItem(key, JSON.stringify(data[key]));
      });
  }
};

// Initialize the instructions modal
function initInstructionsModal() {
  console.log("Initializing instructions modal");
  const modal = document.getElementById('instructions-modal');
  const closeBtn = document.getElementById('close-instructions');
  const openInstructionsBtn = document.getElementById('about');

  // Show modal on initial load by adding 'visible' class
  if (modal) {
    modal.classList.add('visible');
  }

  // Close modal when clicking the close button
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.classList.remove('visible');
    };
  }

  // Open modal when clicking the 'Open Instructions' button
  if (openInstructionsBtn) {
    openInstructionsBtn.onclick = () => {
      modal.classList.add('visible');
    };
  }

  // Close modal when clicking outside of it
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.classList.remove('visible');
    }
  };

  // Close modal with 'Escape' key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('visible')) {
      modal.classList.remove('visible');
    }
  });
}

// Initialize the application when the DOMContentLoaded event is fired
function initializeApp() {
  console.log('Initializing app');

  const appContainer = document.getElementById('app'); // Ensure there's a container with ID 'app'
  if (!appContainer) {
    console.error("Element with ID 'app' not found. Please add a container with ID 'app' in your HTML.");
    return;
  }

  // Create and style the dark mode toggle button
  const darkModeToggle = document.createElement('button');
  darkModeToggle.id = 'dark-mode-toggle';
  darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>'; // Using Font Awesome for icons
  darkModeToggle.style.position = 'absolute';
  darkModeToggle.style.top = '10px';
  darkModeToggle.style.right = '10px';
  darkModeToggle.style.background = 'none';
  darkModeToggle.style.border = 'none';
  darkModeToggle.style.cursor = 'pointer';
  darkModeToggle.style.fontSize = '24px';
  
  // Append the dark mode toggle to the app container
  appContainer.appendChild(darkModeToggle);

  if (darkModeToggle) {
      darkModeToggle.addEventListener('click', () => {
          document.body.classList.toggle('dark-mode');
          darkModeToggle.classList.toggle('active');
          // Toggle icon
          if (document.body.classList.contains('dark-mode')) {
              darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
          } else {
              darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
          }
          // Save preference to localStorage
          const isDarkMode = document.body.classList.contains('dark-mode');
          storage.set({ darkMode: isDarkMode });
      });

      // Load dark mode preference
      storage.get(['darkMode'], (data) => {
          if (data.darkMode) {
              document.body.classList.add('dark-mode');
              darkModeToggle.classList.add('active');
              darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
          } else {
              darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
          }
      });
  } else {
      console.error("Element with ID 'dark-mode-toggle' not found.");
  }

  // Initialize the animation manager
  animationManager = new AnimationManager(appContainer, window.exercises);
  
  // Add event listeners for the toggle button
  const toggleBtn = document.getElementById('breather-extension-toggle-button');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleBreathing);
  } else {
    console.error("Element with ID 'breather-extension-toggle-button' not found.");
  }
  
  document.addEventListener('keydown', handleKeyPress);

  // Update the cycle display
  updateCycleDisplay();

  // Initialize the instructions modal
  initInstructionsModal();

  // Add event listener for exercise toggle
  const exerciseToggle = document.createElement('button');
  exerciseToggle.id = 'exercise-toggle';
  exerciseToggle.textContent = 'Box Breathing';
  exerciseToggle.className = 'toggle-button';
  exerciseToggle.style.position = 'absolute';
  exerciseToggle.style.top = '10px';
  exerciseToggle.style.left = '10px';
  exerciseToggle.style.padding = '10px 20px';
  exerciseToggle.style.cursor = 'pointer';
  
  // Append the exercise toggle to the app container
  appContainer.appendChild(exerciseToggle);

  if (exerciseToggle) {
    exerciseToggle.addEventListener('click', () => {
      if (currentExercise === 'anxiety') {
        currentExercise = 'deepRelax';
        exerciseToggle.textContent = 'Deep Relaxation';
        exerciseToggle.classList.add('active');
      } else {
        currentExercise = 'anxiety';
        exerciseToggle.textContent = 'Box Breathing';
        exerciseToggle.classList.remove('active');
      }
      if (animationManager && isExerciseActive) {
        animationManager.stopAnimation();
        animationManager.startAnimation(currentExercise);
      }
    });
  } else {
    console.error("Element with ID 'exercise-toggle' not found.");
  }

  // Add event listener for saving settings
  const saveSettingsBtn = document.getElementById('save-settings');
  if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => {
          const inhaleDuration = parseInt(document.getElementById('inhale-duration').value) * 1000;
          const holdDuration = parseInt(document.getElementById('hold-duration').value) * 1000;
          const exhaleDuration = parseInt(document.getElementById('exhale-duration').value) * 1000;

          // Save to localStorage
          storage.set({
              inhaleDuration: inhaleDuration,
              holdDuration: holdDuration,
              exhaleDuration: exhaleDuration
          });

          // Update exercises with new durations
          window.exercises.anxiety.phases = [
              { duration: inhaleDuration, instruction: 'Breathe In', type: 'inhale' },
              { duration: holdDuration, instruction: 'Hold', type: 'hold' },
              { duration: exhaleDuration, instruction: 'Breathe Out', type: 'exhale' },
              { duration: holdDuration, instruction: 'Hold', type: 'hold' }
          ];

          // Restart animation if active
          if (isExerciseActive && animationManager) {
              animationManager.stopAnimation();
              animationManager.startAnimation(currentExercise);
          }

          alert('Settings saved successfully!');
      });

      // Load settings on initialization
      storage.get(['inhaleDuration', 'holdDuration', 'exhaleDuration'], (data) => {
          if (data.inhaleDuration) {
              document.getElementById('inhale-duration').value = data.inhaleDuration / 1000;
          }
          if (data.holdDuration) {
              document.getElementById('hold-duration').value = data.holdDuration / 1000;
          }
          if (data.exhaleDuration) {
              document.getElementById('exhale-duration').value = data.exhaleDuration / 1000;
          }
      });
  } else {
      console.error("Element with ID 'save-settings' not found.");
  }

  // Detect if device is mobile
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);


}

// Handle key press events
function handleKeyPress(event) {
  if (event.code === 'Space') {
      event.preventDefault();
      toggleBreathing();
  } else if (event.code === 'Escape') {
      if (isCountingDown) {
          cancelCountdown();
      } else if (isExerciseActive) {
          stopExercise();
      }
  }
}

// Start the breathing exercise
function startExercise() {
  if (isExerciseActive || isCountingDown) return;

  console.log('Starting exercise');
  const toggleButton = document.getElementById('breather-extension-toggle-button');
  const countdownOverlay = document.getElementById('countdown-overlay');
  const countdownTimer = document.getElementById('countdown-timer');
  
  // Enhanced Logging
  if (!toggleButton) console.error("Element with ID 'breather-extension-toggle-button' not found.");
  if (!countdownOverlay) console.error("Element with ID 'countdown-overlay' not found.");
  if (!countdownTimer) console.error("Element with ID 'countdown-timer' not found.");

  if (!toggleButton || !countdownOverlay || !countdownTimer) {
    console.error("Required elements not found");
    return;
  }

  toggleButton.disabled = true;
  countdown = 3;
  
  countdownOverlay.classList.add('visible');
  isCountingDown = true;

  countdownInterval = setInterval(() => {
    if (countdown > 0) {
      countdownTimer.textContent = countdown;
      countdown--;
    } else {
      clearInterval(countdownInterval);
      countdownOverlay.classList.remove('visible');
      toggleButton.textContent = 'End';
      toggleButton.className = 'stop pulsing';
      toggleButton.disabled = false;
      isExerciseActive = true;
      isCountingDown = false;
      if (animationManager) {
        animationManager.startAnimation(currentExercise);
      }
    }
  }, 1000);
  updateCycleDisplay();
}

// Stop the breathing exercise
function stopExercise() {
  if (!isExerciseActive) return;

  console.log('Stopping exercise');
  isExerciseActive = false;
  if (animationManager) {
      animationManager.stopAnimation();
  }
  updateToggleButton('Start');
  updateCycleDisplay();
}

// Cancel the countdown
function cancelCountdown() {
  clearInterval(countdownInterval);
  const countdownOverlay = document.getElementById('countdown-overlay');
  if (countdownOverlay) {
    countdownOverlay.classList.remove('visible');
  }
  isCountingDown = false;
  updateToggleButton('Start');
}

// Update the cycle display
function updateCycleDisplay() {
  const cycleDisplay = document.getElementById('cycle-display');
  if (!cycleDisplay) {
    console.error("Element with ID 'cycle-display' not found.");
    return;
  }

  cycleDisplay.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.className = `cycle-dot ${i < animationManager.cycleCount ? 'completed' : ''}`;
    cycleDisplay.appendChild(dot);
  }
}

// Update the toggle button text and class
function updateToggleButton(text) {
  const toggleButton = document.getElementById('breather-extension-toggle-button');
  if (toggleButton) {
    toggleButton.className = text === 'Start' ? '' : 'stop pulsing';
    toggleButton.textContent = text;
  }
}

// Toggle the breathing exercise
function toggleBreathing() {
  if (isCountingDown) return;

  if (isExerciseActive) {
    stopExercise();
  } else {
    startExercise();
  }
}

// Make stopExercise function globally accessible
window.stopExercise = stopExercise;

// Initialize the application when the DOMContentLoaded event is fired
document.addEventListener('DOMContentLoaded', initializeApp);