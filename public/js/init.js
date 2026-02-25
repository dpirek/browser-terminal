const content = document.getElementById('content');
let commandLine = document.querySelector('.command-line');
let cursor = document.querySelector('.cursor');
let currentLine = '';

function renderCurrentLine() {
  commandLine.textContent = currentLine;
}

function appendOutput(text) {
  const outputLine = document.createElement('div');
  outputLine.textContent = text;
  content.appendChild(outputLine);
}

function appendPrompt() {
  const prompt = document.createElement('div');
  prompt.innerHTML = '$ <span class="command-line"></span><span class="cursor" aria-hidden="true">_</span>';
  content.appendChild(prompt);
  commandLine = prompt.querySelector('.command-line');
  cursor = prompt.querySelector('.cursor');
  renderCurrentLine();
}

function deactivateCursor() {
  if (!cursor) {
    return;
  }
  cursor.remove();
  cursor = null;
}

async function executeCommand(command) {
  try {
    const response = await fetch('/api/console', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ command })
    });

    const data = await response.json();
    const output = typeof data.output === 'string' ? data.output : (data.error || 'No output');
    const lines = output.replace(/\r/g, '').split('\n').filter(Boolean);

    if (lines.length === 0) {
      appendOutput('');
      return;
    }

    lines.forEach((line) => {
      appendOutput(line);
    });
  } catch (error) {
    appendOutput('Request failed: ' + error.message);
  }
}

document.addEventListener('keydown', async (event) => {
  if (event.key === 'Enter') {
    const command = currentLine;
    deactivateCursor();
    currentLine = '';

    await executeCommand(command);
    appendPrompt();
    return;
  }

  if (event.key === 'Backspace') {
    event.preventDefault();
    currentLine = currentLine.slice(0, -1);
    renderCurrentLine();
    return;
  }

  if (event.key.length === 1) {
    currentLine += event.key;
    renderCurrentLine();
  }
});

renderCurrentLine();
