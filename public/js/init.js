(function () {
  var content = document.getElementById('content');
  var commandLine = document.querySelector('.command-line');
  var currentLine = '';

  function renderCurrentLine() {
    commandLine.textContent = currentLine;
  }

  function appendOutput(text) {
    var outputLine = document.createElement('div');
    outputLine.textContent = text;
    content.appendChild(outputLine);
  }

  function appendPrompt() {
    var prompt = document.createElement('div');
    prompt.innerHTML = '$ <span class="command-line"></span>';
    content.appendChild(prompt);
    commandLine = prompt.querySelector('.command-line');
    renderCurrentLine();
  }

  async function executeCommand(command) {
    try {
      var response = await fetch('/api/console', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command: command })
      });

      var data = await response.json();
      var output = typeof data.output === 'string' ? data.output : (data.error || 'No output');
      var lines = output.replace(/\r/g, '').split('\n').filter(Boolean);

      if (lines.length === 0) {
        appendOutput('');
      } else {
        lines.forEach(function (line) {
          appendOutput(line);
        });
      }
    } catch (error) {
      appendOutput('Request failed: ' + error.message);
    }
  }

  document.addEventListener('keydown', async function (event) {
    if (event.key === 'Enter') {
      var command = currentLine;
      currentLine = '';
      renderCurrentLine();

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
}());
