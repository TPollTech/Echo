  function openWorkshop() {
    updateWorkshopUI();
    ui.workshop.classList.remove("is-hidden");
    sound(262, 0.3, "sine", 0.03);
  }

  function closeWorkshop() {
    ui.workshop.classList.add("is-hidden");
    loadProfile();
  }

