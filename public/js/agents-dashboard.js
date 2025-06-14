// public/js/agents-dashboard.js
// Handles real-time agent dashboard updates and animated status bar

async function fetchAgentTasks() {
  const res = await fetch('/api/agent-tasks');
  if (!res.ok) return null;
  return res.json();
}

async function fetchTextScripts() {
  try {
    const res = await fetch('/api/agent/text-scripts');
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Failed to fetch text scripts:', error);
    return null;
  }
}

function animateStatusBar(bar, percent) {
  bar.style.width = percent + '%';
  bar.classList.add('progress-animated');
}

function updateAgentDashboard(tasks) {
  if (!tasks || !tasks.length) return;
  // Update main agent summary
  const main = tasks[0];
  document.querySelector('.agent-summary .progress-bar').style.width = main.completion + '%';
  document.querySelector('.agent-summary .agent-completion').textContent = `Completion: ${main.completion}%`;
  document.querySelector('.agent-summary [data-status]').textContent = main.status;
  // Update tool tasks
  document.querySelectorAll('.agent-task-detailed').forEach((el, i) => {
    if (tasks[i]) {
      el.querySelector('.progress-bar').style.width = tasks[i].completion + '%';
      el.querySelector('.agent-task-status').innerHTML = `<b>Status:</b> ${tasks[i].status} &mdash; ${tasks[i].completion}% complete`;
    }
  });
}

function updateTextScriptsDisplay(scripts) {
  if (!scripts || !scripts.length) return;
  
  // Update text scripts count in dashboard
  const textScriptsCount = document.getElementById('text-scripts-count');
  if (textScriptsCount) {
    textScriptsCount.textContent = scripts.length;
  }
  
  // Create or update text scripts preview
  const textPreview = document.getElementById('text-scripts-preview');
  if (textPreview) {
    textPreview.innerHTML = '';
    scripts.slice(0, 5).forEach(script => {
      const scriptElement = document.createElement('div');
      scriptElement.className = 'text-script-item';
      scriptElement.innerHTML = `
        <div class="script-title">${script.title}</div>
        <div class="script-meta">${script.category} • ${script.wordCount} words • Relevance: ${script.relevance}/10</div>
        <div class="script-preview">${script.description}</div>
      `;
      textPreview.appendChild(scriptElement);
    });
  }
}

async function pollAgentTasks() {
  const data = await fetchAgentTasks();
  if (data && data.agentTasks) updateAgentDashboard(data.agentTasks);
  
  // Also fetch and update text scripts
  const textScripts = await fetchTextScripts();
  if (textScripts) updateTextScriptsDisplay(textScripts);
  
  setTimeout(pollAgentTasks, 2000);
}

document.addEventListener('DOMContentLoaded', pollAgentTasks);
