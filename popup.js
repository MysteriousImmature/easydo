document.addEventListener('DOMContentLoaded', function () {
  // DOM Elements
  const taskInput = document.getElementById('taskInput');
  const addTaskBtn = document.getElementById('addTaskBtn');
  const taskList = document.getElementById('taskList');
  const searchInput = document.getElementById('searchInput');
  const prioritySelect = document.getElementById('prioritySelect');
  const dueDate = document.getElementById('dueDate');
  const categoryInput = document.getElementById('categoryInput');
  const themeToggle = document.getElementById('themeToggle');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const statElements = {
    total: document.getElementById('totalTasks'),
    completed: document.getElementById('completedTasks'),
    pending: document.getElementById('pendingTasks')
  };

  // State
  let currentFilter = 'all';
  let tasks = [];
  let categories = new Set();

  // Initialize
  initTheme();
  loadTasks();
  setupEventListeners();

  function initTheme() {
    const isDark = localStorage.getItem('theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
  }

  function setupEventListeners() {
    // Task input
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', e => e.key === 'Enter' && addTask());

    // Search
    searchInput.addEventListener('input', filterTasks);

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Filters
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        filterTasks();
      });
    });

    // Category input
    categoryInput.addEventListener('input', updateCategoriesList);
  }

  function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', newTheme);
  }

  function updateCategoriesList() {
    const categoriesList = document.getElementById('categories');
    categoriesList.innerHTML = '';
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      categoriesList.appendChild(option);
    });
  }

  function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText !== '') {
      const category = categoryInput.value.trim();
      if (category) {
        categories.add(category);
        updateCategoriesList();
      }

      const task = {
        id: Date.now(),
        text: taskText,
        completed: false,
        priority: prioritySelect.value,
        dueDate: dueDate.value,
        category: category,
        createdAt: new Date().toISOString()
      };

      tasks.push(task);
      saveTasks();
      addTaskToList(task);
      updateStats();
      filterTasks();
      
      // Reset inputs
      taskInput.value = '';
      categoryInput.value = '';
      dueDate.value = '';
      prioritySelect.value = 'low';
      taskInput.focus();
    }
  }

  function addTaskToList(task) {
    const listItem = document.createElement('li');
    listItem.classList.add(`priority-${task.priority}`);
    if (task.completed) listItem.classList.add('completed');

    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '';
    const category = task.category ? `<span class="task-category">${task.category}</span>` : '';

    listItem.innerHTML = `
      <div class="checkbox-label">
        <input type="checkbox" ${task.completed ? 'checked' : ''} />
        <div class="task-content">
          <span class="task-title">${task.text}</span>
          <div class="task-meta">
            ${category}
            ${dueDate ? `<span>Due: ${dueDate}</span>` : ''}
          </div>
        </div>
      </div>
      <button class="delete-btn" title="Delete task">×</button>
    `;

    taskList.appendChild(listItem);

    // Handle checkbox changes
    const checkbox = listItem.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', function() {
      task.completed = this.checked;
      listItem.classList.toggle('completed');
      saveTasks();
      updateStats();
      filterTasks();
    });

    // Handle delete button
    const deleteBtn = listItem.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', function() {
      listItem.style.transform = 'translateX(-100%)';
      listItem.style.opacity = '0';
      setTimeout(() => {
        tasks = tasks.filter(t => t.id !== task.id);
        listItem.remove();
        saveTasks();
        updateStats();
        filterTasks();
      }, 200);
    });
  }

  function filterTasks() {
    const searchTerm = searchInput.value.toLowerCase();
    const today = new Date().toISOString().split('T')[0];
    
    const filteredTasks = tasks.filter(task => {
      const matchesSearch = task.text.toLowerCase().includes(searchTerm);
      const matchesFilter = 
        currentFilter === 'all' ||
        (currentFilter === 'completed' && task.completed) ||
        (currentFilter === 'high' && task.priority === 'high') ||
        (currentFilter === 'today' && task.dueDate === today);
      
      return matchesSearch && matchesFilter;
    });

    taskList.innerHTML = '';
    filteredTasks.forEach(addTaskToList);
  }

  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    statElements.total.textContent = total;
    statElements.completed.textContent = completed;
    statElements.pending.textContent = pending;
  }

  function loadTasks() {
    chrome.storage.local.get(['tasks', 'categories'], function (result) {
      if (result.tasks) {
        tasks = result.tasks;
        tasks.forEach(task => {
          if (task.category) {
            categories.add(task.category);
          }
        });
        updateCategoriesList();
        tasks.forEach(addTaskToList);
        updateStats();
        filterTasks();
      }
    });
  }

  function saveTasks() {
    chrome.storage.local.set({ 
      tasks: tasks,
      categories: Array.from(categories)
    });
  }
});
  