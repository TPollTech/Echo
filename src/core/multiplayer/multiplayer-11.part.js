  function mergeNetworkEntity(current, incoming) {
    const entity = current || { ...incoming, x: incoming.x, y: incoming.y };
    entity.networkX = incoming.x;
    entity.networkY = incoming.y;
    entity.networkVx = incoming.vx;
    entity.networkVy = incoming.vy;
    Object.assign(entity, incoming, { x: entity.x, y: entity.y, vx: entity.vx || incoming.vx, vy: entity.vy || incoming.vy });
    entity.dead = incoming.respawnTimer > 0;
    entity.hitTimer = 0;
    return entity;
  }

