  function redirectBulwarkDamage(target, amount, attacker) {
    const guard = bots.find((candidate) => (
      candidate !== target
      && !candidate.dead
      && candidate.archetype === "bulwark"
      && Math.hypot(candidate.x - target.x, candidate.y - target.y) < 120
    ));
    if (!guard) return amount;
    const absorbed = amount * 0.3;
    guard.health -= absorbed;
    guard.hitTimer = Math.max(guard.hitTimer, 0.16);
    burst(guard.x, guard.y, guard.hue, 4);
    if (guard.health <= 0) killBot(guard, attacker);
    return amount - absorbed;
  }

