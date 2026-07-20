  function saveRun({ mode, outcome, bossDefeated = false }) {
    if (lastRunSaved || mode !== "solo") return;
    lastRunSaved = true;
    requestJson("/api/runs", {
      method: "POST",
      body: JSON.stringify({
        name: player.name,
        mode,
        score: Math.floor(player.score),
        kills: player.kills,
        durationMs: Math.floor(runTime * 1000),
        outcome,
        bossDefeated
      })
    }).then(() => loadProfile()).catch(() => showToast("RUN NÃO FOI SALVA // INICIE PELO SERVIDOR LOCAL", 2600));
  }

