// public/js/agents-dashboard.js
// Handles real-time agent dashboard updates and animated status bar

async function fetchAgentTasks() {
  const res = await fetch('/api/agent-tasks');
  if (!res.ok) return null;
  return res.json();
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

async function pollAgentTasks() {
  const data = await fetchAgentTasks();
  if (data && data.agentTasks) updateAgentDashboard(data.agentTasks);
  setTimeout(pollAgentTasks, 2000);
}

document.addEventListener('DOMContentLoaded', pollAgentTasks);
