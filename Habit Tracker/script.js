class HabitTracker {
    constructor() {
        this.habits = JSON.parse(localStorage.getItem('habits')) || [];
        this.init();
    }

    init() {
        this.renderHabits();
        this.updateStats();
        document.getElementById('addHabitBtn').addEventListener('click', () => this.addHabit());
        document.getElementById('habitInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addHabit();
        });
    }

    addHabit() {
        const input = document.getElementById('habitInput');
        const name = input.value.trim();
        
        if (!name) return;

        const habit = {
            id: Date.now(),
            name,
            completions: {},
            createdAt: new Date().toISOString()
        };

        this.habits.push(habit);
        this.save();
        this.renderHabits();
        this.updateStats();
        input.value = '';
    }

    deleteHabit(id) {
        this.habits = this.habits.filter(h => h.id !== id);
        this.save();
        this.renderHabits();
        this.updateStats();
    }

    toggleCompletion(id) {
        const habit = this.habits.find(h => h.id === id);
        const today = this.getDateString(new Date());
        
        if (habit.completions[today]) {
            delete habit.completions[today];
        } else {
            habit.completions[today] = true;
        }
        
        this.save();
        this.renderHabits();
        this.updateStats();
    }

    getDateString(date) {
        return date.toISOString().split('T')[0];
    }

    renderHabits() {
        const container = document.getElementById('habitsContainer');
        
        if (this.habits.length === 0) {
            container.innerHTML = '<div class="empty-state">No habits yet. Add your first habit above! 🚀</div>';
            return;
        }

        container.innerHTML = this.habits.map(habit => `
            <div class="habit-card">
                <div class="habit-header">
                    <div class="habit-title">${habit.name}</div>
                    <div class="habit-actions">
                        <button class="check-btn ${this.isCompletedToday(habit) ? 'checked' : ''}" 
                                onclick="tracker.toggleCompletion(${habit.id})">
                            ${this.isCompletedToday(habit) ? '✓ Done' : 'Mark Done'}
                        </button>
                        <button class="delete-btn" onclick="tracker.deleteHabit(${habit.id})">Delete</button>
                    </div>
                </div>
                <div class="heatmap-container">
                    <div class="heatmap-header">
                        <div class="heatmap-title">Last 365 days</div>
                        <div class="heatmap-legend">
                            <span>Less</span>
                            <div class="legend-box" style="background: #ebedf0;"></div>
                            <div class="legend-box" style="background: #c6e48b;"></div>
                            <div class="legend-box" style="background: #7bc96f;"></div>
                            <div class="legend-box" style="background: #239a3b;"></div>
                            <div class="legend-box" style="background: #196127;"></div>
                            <span>More</span>
                        </div>
                    </div>
                    <div class="heatmap">
                        ${this.generateHeatmap(habit)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    generateHeatmap(habit) {
        const weeks = [];
        const today = new Date();
        const oneYearAgo = new Date(today);
        oneYearAgo.setDate(today.getDate() - 364);
        
        const startDay = oneYearAgo.getDay();
        const currentDate = new Date(oneYearAgo);
        currentDate.setDate(currentDate.getDate() - startDay);
        
        const months = [];
        let currentMonth = -1;
        let weekCount = 0;
        
        while (currentDate <= today) {
            const week = [];
            
            for (let day = 0; day < 7; day++) {
                const dateStr = this.getDateString(currentDate);
                const isCompleted = habit.completions[dateStr];
                const level = isCompleted ? 4 : 0;
                const isInRange = currentDate >= oneYearAgo && currentDate <= today;
                
                const formattedDate = currentDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                });
                
                if (day === 0 && currentDate.getMonth() !== currentMonth) {
                    currentMonth = currentDate.getMonth();
                    months.push({ name: currentDate.toLocaleDateString('en-US', { month: 'short' }), week: weekCount });
                }
                
                week.push(`
                    <div class="heatmap-day ${!isInRange ? 'out-of-range' : ''}" 
                         data-level="${isInRange ? level : 0}" 
                         data-date="${dateStr}"
                         style="${!isInRange ? 'opacity: 0;' : ''}"
                         title="${formattedDate}${isCompleted ? ' - Completed' : ''}">
                        <div class="tooltip">${formattedDate}${isCompleted ? ' ✓' : ''}</div>
                    </div>
                `);
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            weeks.push(`<div class="calendar-week">${week.join('')}</div>`);
            weekCount++;
        }
        
        const monthLabels = months.map(m => 
            `<div class="calendar-month" style="width: ${22 * (months[months.indexOf(m) + 1] ? months[months.indexOf(m) + 1].week - m.week : weekCount - m.week)}px;">${m.name}</div>`
        ).join('');
        
        const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => 
            `<div class="calendar-weekday">${day}</div>`
        ).join('');
        
        return `
            <div class="calendar-months">${monthLabels}</div>
            <div class="calendar-body">
                <div class="calendar-weekdays">${weekdayLabels}</div>
                <div class="calendar-weeks">${weeks.join('')}</div>
            </div>
        `;
    }

    isCompletedToday(habit) {
        const today = this.getDateString(new Date());
        return habit.completions[today] || false;
    }

    getCurrentStreak(habit) {
        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < 365; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = this.getDateString(date);
            
            if (habit.completions[dateStr]) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    updateStats() {
        const today = this.getDateString(new Date());
        const todayCompleted = this.habits.filter(h => h.completions[today]).length;
        const maxStreak = Math.max(0, ...this.habits.map(h => this.getCurrentStreak(h)));
        
        document.getElementById('totalHabits').textContent = this.habits.length;
        document.getElementById('todayCompleted').textContent = todayCompleted;
        document.getElementById('currentStreak').textContent = maxStreak;
    }

    save() {
        localStorage.setItem('habits', JSON.stringify(this.habits));
    }
}

const tracker = new HabitTracker();
