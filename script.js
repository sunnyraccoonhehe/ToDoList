document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const emptyImage = document.querySelector('.empty-image');
    const progressBar = document.getElementById('progress');
    const progressNumbers = document.getElementById('numbers');

    let isInitialLoading = true;
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    
    let savedProgressDates = new Set();
    let sadProgressDates = new Set();

    const loadSavedProgress = () => {
        const saved = localStorage.getItem('completedProgress');
        if (saved) savedProgressDates = new Set(JSON.parse(saved));
        const sadSaved = localStorage.getItem('sadProgress');
        if (sadSaved) sadProgressDates = new Set(JSON.parse(sadSaved));
    };

    const saveProgressToStorage = () => {
        localStorage.setItem('completedProgress', JSON.stringify([...savedProgressDates]));
        localStorage.setItem('sadProgress', JSON.stringify([...sadProgressDates]));
    };

    const saveTodayProgress = () => {
        const totalTasks = taskList.children.length;
        const completedTasks = taskList.querySelectorAll('.checkbox:checked').length;
        
        if (totalTasks === 0) {
            showNotification('Add at least one task first!', 'warning');
            return;
        }

        const today = formatDateForStorage(new Date());
        
        if (completedTasks === totalTasks) {
            savedProgressDates.add(today);
            sadProgressDates.delete(today);
            showNotification('All tasks completed! Great job! 🌟 Task list cleared for new tasks! ✨', 'success');
        } else {
            sadProgressDates.add(today);
            savedProgressDates.delete(today);
            showNotification(`Progress saved: ${completedTasks}/${totalTasks} tasks completed. You can do better! 💪 Task list cleared for new tasks! ✨`, 'warning');
        }
        saveProgressToStorage();
        
        const saveBtn = document.getElementById('save-progress-btn');
        if (saveBtn) {
            saveBtn.classList.add('saving');
            setTimeout(() => saveBtn.classList.remove('saving'), 300);
        }
  
        updateCalendarWithProgress();
        clearAllTasks();
    };

    const clearAllTasks = () => {
        while (taskList.firstChild) {
            taskList.removeChild(taskList.firstChild);
        }
        localStorage.removeItem('tasks');
        toggleEmptyState();
        updateProgress();
    };

    const clearCalendarData = () => {
        if (confirm('Are you sure you want to clear all calendar progress data?')) {
            savedProgressDates.clear();
            sadProgressDates.clear();
            localStorage.removeItem('completedProgress');
            localStorage.removeItem('sadProgress');
            updateCalendarWithProgress();
            showNotification('Calendar data cleared successfully! 🧹', 'success');
        }
    };

    const showNotification = (message, type) => {
        const notification = document.createElement('div');
        const bgColor = type === 'warning' ? 'var(--red)' : 'var(--green)';
        
        notification.innerHTML = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 15px 25px;
            border-radius: 30px;
            font-size: 1rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };

    const updateCalendarWithProgress = () => {
        const calendarDays = document.querySelectorAll('.mini-calendar-day');
        calendarDays.forEach(day => {
            if (!day.classList.contains('other-month') && !day.classList.contains('mini-calendar-weekday')) {
                const dayNumber = day.textContent.trim();
                if (dayNumber && !isNaN(parseInt(dayNumber))) {
                    const dateString = formatDateString(currentYear, currentMonth, parseInt(dayNumber));
                    day.classList.remove('has-progress', 'sad-progress');
                    if (savedProgressDates.has(dateString)) {
                        day.classList.add('has-progress');
                    } else if (sadProgressDates.has(dateString)) {
                        day.classList.add('sad-progress');
                    }
                }
            }
        });
    };

    const toggleEmptyState = () => {
        emptyImage.style.display = taskList.children.length === 0 ? 'block' : 'none';
    };

    const updateProgress = () => {
        const totalTasks = taskList.children.length;
        const completedTasks = taskList.querySelectorAll('.checkbox:checked').length;
        const progressPercentage = totalTasks ? (completedTasks / totalTasks) * 100 : 0;
        
        progressBar.style.width = `${progressPercentage}%`;
        progressNumbers.textContent = `${completedTasks} / ${totalTasks}`;
        
        if (totalTasks > 0 && completedTasks === totalTasks) {
            progressBar.classList.add('completed');
            if (!isInitialLoading && typeof confetti !== 'undefined') launchConfetti();
        } else {
            progressBar.classList.remove('completed');
        }
    };

    const formatDateForStorage = (date) => {
        const d = date instanceof Date ? date : new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const formatDateString = (year, month, day) => {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const saveTaskToLocalStorage = () => {
        const tasks = Array.from(taskList.querySelectorAll('li')).map(li => ({
            text: li.querySelector('span').textContent,
            completed: li.querySelector('.checkbox').checked
        }));
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    const loadTasksFromLocalStorage = () => {
        const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
        savedTasks.forEach(task => addTask(task.text, task.completed, true));
        
        setTimeout(() => { isInitialLoading = false; }, 100);
        
        toggleEmptyState();
        updateProgress();
    };

    const addTask = (text = null, completed = false, fromLocalStorage = false) => {
        const taskText = text || taskInput.value.trim();
        if (!taskText) return;
        
        const li = document.createElement('li');
        li.innerHTML = `
            <input type="checkbox" class="checkbox" ${completed ? 'checked' : ''}/>
            <span>${taskText}</span>
            <div class="task-buttons">
                <button class="edit-btn"><i class="fa-solid fa-pen"></i></button>
                <button class="delete-btn"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;

        if (completed) li.classList.add('completed');

        const checkbox = li.querySelector('.checkbox');
        const editBtn = li.querySelector('.edit-btn');
        const span = li.querySelector('span');

        if (completed) {
            span.style.opacity = '0.7';
            editBtn.disabled = true;
            editBtn.style.opacity = '0.5';
            editBtn.style.pointerEvents = 'none';
        }

        checkbox.addEventListener('change', () => {
            const isChecked = checkbox.checked;
            li.classList.toggle('completed', isChecked);
            span.style.opacity = isChecked ? '0.7' : '1';
            editBtn.disabled = isChecked;
            editBtn.style.opacity = isChecked ? '0.5' : '1';
            editBtn.style.pointerEvents = isChecked ? 'none' : 'auto';
            updateProgress();
            saveTaskToLocalStorage();
        });

        editBtn.addEventListener('click', () => {
            if (!checkbox.checked) {
                if (li.classList.contains('editing')) {
                    saveEdit(li, span, editBtn);
                } else {
                    li.classList.add('editing');
                    span.style.display = 'none';
                    
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'edit-input';
                    input.value = span.textContent;
                    input.style.cssText = 'flex: 1; border: none; outline: none; color: white; font-size: inherit; font-family: inherit; margin-left: 10px; padding: 2px 0; background-color: transparent;';
                    
                    li.insertBefore(input, span);
                    input.focus();
                    input.select();
                    editBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
                    
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            saveEdit(li, span, editBtn);
                        }
                    });
                    
                    input.addEventListener('blur', () => {
                        setTimeout(() => {
                            if (li.classList.contains('editing')) {
                                saveEdit(li, span, editBtn);
                            }
                        }, 100);
                    });
                }
            }
        });

        const saveEdit = (li, span, editBtn) => {
            const input = li.querySelector('.edit-input');
            if (!input) return;
            
            const newText = input.value.trim();
            
            if (newText) {
                span.textContent = newText;
                li.classList.remove('editing');
                span.style.display = 'inline';
                input.remove();
                editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
                saveTaskToLocalStorage();
            } else {
                li.remove();
                saveTaskToLocalStorage();
                toggleEmptyState();
                updateProgress();
            }
        };

        li.querySelector('.delete-btn').addEventListener('click', () => {
            li.remove();
            saveTaskToLocalStorage();
            toggleEmptyState();
            updateProgress();
        });

        taskList.appendChild(li);
        
        if (!fromLocalStorage) {
            taskInput.value = '';
            saveTaskToLocalStorage();
        }
        
        toggleEmptyState();
        updateProgress();
    };

    addTaskBtn.addEventListener('click', (e) => {
        e.preventDefault();
        addTask();
    });

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTask();
        }
    });
    
    function updateClock() {
        const now = new Date();
        
        const timeElement = document.getElementById('clock-time');
        if (timeElement) {
            timeElement.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        }
        
        const dateElement = document.getElementById('clock-date');
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        
        const dayElement = document.getElementById('clock-day');
        if (dayElement) {
            dayElement.textContent = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
        }
        
        const timezoneElement = document.getElementById('clock-timezone');
        if (timezoneElement) {
            timezoneElement.textContent = `Local (${Intl.DateTimeFormat().resolvedOptions().timeZone})`;
        }
    }
    
    updateClock();
    setInterval(updateClock, 1000);
    
    function renderMiniCalendar() {
        const calendarElement = document.getElementById('mini-calendar');
        const monthElement = document.getElementById('current-month');
        
        if (!calendarElement || !monthElement) return;
        
        const date = new Date(currentYear, currentMonth, 1);
        monthElement.textContent = `${date.toLocaleDateString('en-US', { month: 'long' })} ${currentYear}`;
        
        const today = new Date();
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weekdaysHTML = weekdays.map(day => `<div class="mini-calendar-weekday">${day}</div>`).join('');
        
        let daysHTML = '';
        for (let i = 0; i < firstDay; i++) {
            daysHTML += `<div class="mini-calendar-day other-month"></div>`;
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            daysHTML += `<div class="mini-calendar-day ${isToday ? 'today' : ''}">${day}</div>`;
        }
        
        calendarElement.innerHTML = `
            <div class="mini-calendar-weekdays">${weekdaysHTML}</div>
            <div class="mini-calendar-days">${daysHTML}</div>
        `;
        
        updateCalendarWithProgress();
    }
    
    document.getElementById('prev-month')?.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderMiniCalendar();
    });
    
    document.getElementById('next-month')?.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderMiniCalendar();
    });
    
    const launchConfetti = () => {
        if (typeof confetti === 'undefined') return;
        
        const defaults = {
            spread: 360,
            ticks: 50,
            gravity: 0,
            decay: 0.94,
            startVelocity: 30,
            shapes: ["star"],
            colors: ["FFE400", "FFBD00", "E89400", "FFCA6C", "FDFFB8"],
        };

        confetti({ ...defaults, particleCount: 40, scalar: 1.2, shapes: ["star"] });
        confetti({ ...defaults, particleCount: 10, scalar: 0.75, shapes: ["circle"] });
    };
    
    loadSavedProgress();
    loadTasksFromLocalStorage();
    renderMiniCalendar();
    
    const saveProgressBtn = document.getElementById('save-progress-btn');
    if (saveProgressBtn) {
        saveProgressBtn.addEventListener('click', saveTodayProgress);
    }

    const clearCalendarIcon = document.getElementById('clear-calendar-icon');
    if (clearCalendarIcon) {
        clearCalendarIcon.addEventListener('click', clearCalendarData);
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});