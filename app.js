(function () {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const preview = document.getElementById('preview');
  const runBtn = document.getElementById('runBtn');
  const langSel = document.getElementById('lang');
  const status = document.getElementById('status');
  const progressBar = document.getElementById('progressBar');
  const resultCard = document.getElementById('resultCard');
  const output = document.getElementById('output');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');

  let currentFile = null;

  function setFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    currentFile = file;
    const url = URL.createObjectURL(file);
    preview.src = url;
    preview.style.display = 'block';
    runBtn.disabled = false;
    status.textContent = 'Image ready. Click "Extract Text" to run OCR.';
  }

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => setFile(e.target.files[0]));

  ['dragenter', 'dragover'].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.add('drag');
    })
  );
  ['dragleave', 'drop'].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag');
    })
  );
  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    setFile(file);
  });

  runBtn.addEventListener('click', async () => {
    if (!currentFile) return;
    runBtn.disabled = true;
    progressBar.style.display = 'block';
    progressBar.value = 0;
    resultCard.style.display = 'none';
    status.textContent = 'Loading OCR engine...';

    try {
      const worker = await Tesseract.createWorker(langSel.value, 1, {
        logger: (m) => {
          if (m.status) {
            status.textContent = m.status + (m.progress ? ' - ' + Math.round(m.progress * 100) + '%' : '');
          }
          if (typeof m.progress === 'number') {
            progressBar.value = m.progress;
          }
        },
      });
      const { data } = await worker.recognize(currentFile);
      await worker.terminate();
      output.value = data.text.trim();
      resultCard.style.display = 'block';
      status.textContent = 'Done.';
    } catch (err) {
      status.textContent = 'Error: ' + err.message;
      console.error(err);
    } finally {
      runBtn.disabled = false;
      progressBar.style.display = 'none';
    }
  });

  copyBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(output.value);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => (copyBtn.textContent = 'Copy to clipboard'), 1500);
  });

  downloadBtn.addEventListener('click', () => {
    const blob = new Blob([output.value], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'extracted-text.txt';
    a.click();
  });
})();
