document.addEventListener('DOMContentLoaded', function () {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
  
    addTaskBtn.addEventListener('click', addTask);
  
    // Load tasks from storage on extension popup open
    chrome.storage.local.get(['tasks'], function (result) {
      if (result.tasks) {
        result.tasks.forEach(task => {
          addTaskToList(task);
        });
      }
    });
  
    function addTask() {
      const taskText = taskInput.value.trim();
      if (taskText !== '') {
        addTaskToList(taskText);
        saveTasks();
        taskInput.value = '';
      }
    }
  
    function addTaskToList(taskText) {
      const listItem = document.createElement('li');
      listItem.innerHTML = `
        <div class="checkbox-label">
          <input type="checkbox" id="taskCheckbox" />
          <label>${taskText}</label>
        </div>
      `;
  
      taskList.appendChild(listItem);
  
      // Automatically remove completed tasks after 2 seconds
      setTimeout(() => {
        if (listItem.querySelector('#taskCheckbox').checked) {
          listItem.remove();
          saveTasks();
        }
      }, 2000);
  
      // Update storage when checkbox state changes
      listItem.querySelector('#taskCheckbox').addEventListener('change', saveTasks);
    }
  
    function saveTasks() {
      const tasks = Array.from(document.querySelectorAll('#taskList li'))
        .map(li => ({
          text: li.querySelector('label').innerText,
          completed: li.querySelector('#taskCheckbox').checked
        }));
  
      chrome.storage.local.set({ tasks: tasks });
    }
  });
  