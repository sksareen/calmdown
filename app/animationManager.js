class AnimationManager {
    constructor(container, exercises) {
        this.container = container;
        this.exercises = exercises;
        this.isExerciseActive = false;
        this.currentExercise = null;
        this.phase = 0;
        this.animationFrame = null;
        this.lastTimestamp = 0;
        this.minScale = 1;
        this.maxScale = 5;
        this.lastPhaseType = null;
        this.cycleCount = 0;
        this.elapsedTime = 0;
        this.lastScale = 1;
        this.lastOpacity = 1;
        this.sessionStartTime = null;
        this.sessionDurations = []; // To store past session durations

        this.instructionEl = document.getElementById('breather-extension-instruction');
        this.countdownEl = document.getElementById('breather-extension-timer');
        this.circleEl = document.getElementById('breather-extension-circle');
        this.calmTitleEl = document.getElementById('calmTitle');
        this.calmSubtitleEl = document.getElementById('calmSubtitle');

        // Audio Element
        this.audioEl = document.getElementById('guided-audio');
    }

    updateInstruction() {
        const currentPhase = this.exercises[this.currentExercise].phases[this.phase];
        if (this.instructionEl) {
            this.instructionEl.textContent = currentPhase.instruction;
        }
    }

    breathingAnimation(timestamp) {
        if (!this.isExerciseActive) return;

        if (!this.lastTimestamp) {
            this.lastTimestamp = timestamp;
        }

        const elapsed = timestamp - this.lastTimestamp;
        this.elapsedTime += elapsed;

        const currentPhase = this.exercises[this.currentExercise].phases[this.phase];
        const phaseDuration = currentPhase.duration;
        const progress = Math.min(this.elapsedTime / phaseDuration, 1);

        this.updateCircleAnimation(currentPhase, progress);
        this.updateCountdown(phaseDuration - this.elapsedTime);

        if (progress < 1) {
            this.animationFrame = requestAnimationFrame(this.breathingAnimation.bind(this));
        } else {
            this.moveToNextPhase(timestamp);
        }

        this.lastTimestamp = timestamp;
    }

    updateCircleAnimation(currentPhase, progress) {
        if (this.circleEl) {
            const newScale = this.getCircleScale(currentPhase.type, progress);
            const newOpacity = currentPhase.type === 'inhale' ? 0.8 + (0.2 * progress) : 1 - (0.3 * progress);

            if (Math.abs(newScale - this.lastScale) > 0.01 || Math.abs(newOpacity - this.lastOpacity) > 0.01) {
                this.circleEl.style.transform = `scale(${newScale})`;
                this.circleEl.style.opacity = newOpacity;
                this.lastScale = newScale;
                this.lastOpacity = newOpacity;
            }
        }
    }

    updateCountdown(remainingTime) {
        if (this.countdownEl) {
            const remaining = Math.ceil(remainingTime / 1000);
            if (remaining !== parseInt(this.countdownEl.textContent)) {
                this.countdownEl.textContent = remaining > 0 ? `${remaining}` : '';
            }
        }
    }

    moveToNextPhase(timestamp) {
        this.lastPhaseType = this.exercises[this.currentExercise].phases[this.phase].type;
        this.phase = (this.phase + 1) % this.exercises[this.currentExercise].phases.length;
        if (this.phase === 0) {
            this.cycleCount++;
            this.updateCycleCount();
        }
        this.elapsedTime = 0;
        this.lastTimestamp = timestamp;
        this.updateInstruction();
        this.animationFrame = requestAnimationFrame(this.breathingAnimation.bind(this));
    }

    getCircleScale(phaseType, progress) {
        switch (phaseType) {
            case 'inhale':
                return this.minScale + (this.maxScale - this.minScale) * progress;
            case 'exhale':
                return this.maxScale - (this.maxScale - this.minScale) * progress;
            case 'hold':
                return this.lastPhaseType === 'inhale' ? this.maxScale : this.minScale;
            default:
                return 1;
        }
    }

    startAnimation(exercise) {
        this.currentExercise = exercise;
        this.isExerciseActive = true;
        this.phase = 0;
        this.lastTimestamp = 0;
        this.lastPhaseType = null;
        this.elapsedTime = 0;
        this.resetCircle();
        this.cycleCount = 0;
        this.updateCycleCount();
        this.updateInstruction();
        this.animationFrame = requestAnimationFrame(this.breathingAnimation.bind(this));
        console.log('AnimationManager.startAnimation called');
        this.sessionStartTime = Date.now();

        // Hide calmTitle and calmSubtitle
        if (this.calmTitleEl) this.calmTitleEl.style.display = 'none';
        if (this.calmSubtitleEl) this.calmSubtitleEl.style.display = 'none';

        // Show instruction and timer
        if (this.instructionEl) this.instructionEl.style.display = 'block';
        if (this.countdownEl) this.countdownEl.style.display = 'block';

        if (this.audioEl) {
            this.audioEl.currentTime = 0;
            this.audioEl.play();
        }
    }

    stopAnimation() {
        console.log('AnimationManager.stopAnimation called');
        this.isExerciseActive = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.resetCircle();
        this.updateUI('Press the button to start', '');
        this.cycleCount = 0;
        this.updateCycleCount();

        // Show calmTitle and calmSubtitle
        if (this.calmTitleEl) this.calmTitleEl.style.display = 'block';
        if (this.calmSubtitleEl) this.calmSubtitleEl.style.display = 'block';

        // Hide instruction and timer
        if (this.instructionEl) this.instructionEl.style.display = 'none';
        if (this.countdownEl) this.countdownEl.style.display = 'none';

        if (this.audioEl) {
            this.audioEl.pause();
            this.audioEl.currentTime = 0;
        }

        if (this.sessionStartTime) {
            const sessionDuration = Date.now() - this.sessionStartTime;
            this.sessionDurations.push(sessionDuration);
            localStorage.setItem('sessionDurations', JSON.stringify(this.sessionDurations));
            this.sessionStartTime = null;
        }
    }

    resetCircle() {
        if (this.countdownEl) {
            this.countdownEl.textContent = '';
        }
        if (this.circleEl) {
            this.circleEl.style.transition = 'transform 0.5s, opacity 0.5s';
            this.circleEl.style.transform = 'scale(1)';
            this.circleEl.style.opacity = '1';
        }
    }

    updateUI(instruction, countdown) {
        if (this.instructionEl) this.instructionEl.textContent = instruction;
        if (this.countdownEl) this.countdownEl.textContent = countdown;
    }

    updateCycleCount() {
        if (this.cycleCount >= 3) {
            this.stopAnimation();
            if (typeof window.showFinalScore === 'function') {
                window.showFinalScore();
            }
            if (typeof window.stopExercise === 'function') {
                window.stopExercise();
            }
        } else {
            this.updateCycleDisplay();
        }
    }

    updateCycleDisplay() {
        const cycleDisplay = document.getElementById('cycle-display');
        if (!cycleDisplay) {
            console.error("Element with ID 'cycle-display' not found.");
            return;
        }

        cycleDisplay.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = `cycle-dot ${i < this.cycleCount ? 'completed' : ''}`;
            cycleDisplay.appendChild(dot);
        }
    }

    getSessionHistory() {
        return this.sessionDurations;
    }
}

window.AnimationManager = AnimationManager;