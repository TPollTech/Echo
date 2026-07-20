  function setStartStatus(message = "", isError = false) {
    ui.startStatus.textContent = message;
    ui.startStatus.classList.toggle("is-error", isError);
  }

