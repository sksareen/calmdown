document.addEventListener('DOMContentLoaded', () => {
    const progressChart = document.getElementById('progress-chart');
    const streakCounter = document.getElementById('streak-counter');
    const sessionHistoryList = document.getElementById('session-history-list');

    function renderProgressChart() {
        // Implement chart rendering using a library like Chart.js
        const ctx = progressChart.getContext('2d');
        // Example data
        const data = {
            labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            datasets: [{
                label: 'Breathing Sessions',
                data: [3, 5, 2, 8, 4, 6, 7],
                backgroundColor: 'rgba(74, 144, 226, 0.6)',
                borderColor: 'rgba(74, 144, 226, 1)',
                borderWidth: 1
            }]
        };
        new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    function updateStreak() {
        const streak = parseInt(localStorage.getItem('streak')) || 0;
        streakCounter.textContent = `Current Streak: ${streak} days`;
    }

    function renderSessionHistory() {
        const sessionDurations = JSON.parse(localStorage.getItem('sessionDurations')) || [];

        if (sessionHistoryList) {
            sessionHistoryList.innerHTML = '';
            sessionDurations.slice(-7).reverse().forEach((duration, index) => {
                const listItem = document.createElement('li');
                const minutes = (duration / 60000).toFixed(2);
                listItem.textContent = `Session ${sessionDurations.length - index}: ${minutes} minutes`;
                sessionHistoryList.appendChild(listItem);
            });
        }
    }

    renderProgressChart();
    updateStreak();
    renderSessionHistory();
});