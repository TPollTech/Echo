/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0123__*/
  const MOTE_CELL_SIZE = 180;
  const moteCells = new Map();
  const moteQueryBuffer = [];

  function moteCellCoordinate(value) {
    return Math.floor(value / MOTE_CELL_SIZE);
  }

  function moteCellKey(cellX, cellY) {
    return cellY * 65536 + cellX;
  }

  function indexMote(mote) {
    if (!mote) return;
    const key = moteCellKey(moteCellCoordinate(mote.x), moteCellCoordinate(mote.y));
    let bucket = moteCells.get(key);
    if (!bucket) {
      bucket = [];
      moteCells.set(key, bucket);
    }
    bucket.push(mote);
    mote._spatialCell = key;
  }

  function unindexMote(mote) {
    const key = mote?._spatialCell;
    if (key == null) return;
    const bucket = moteCells.get(key);
    if (!bucket) return;
    const bucketIndex = bucket.indexOf(mote);
    if (bucketIndex >= 0) bucket.splice(bucketIndex, 1);
    if (bucket.length === 0) moteCells.delete(key);
    mote._spatialCell = null;
  }

  function rebuildMoteSpatialIndex() {
    moteCells.clear();
    for (const mote of motes) indexMote(mote);
  }

  function queryMotes(x, y, radius) {
    moteQueryBuffer.length = 0;
    const minX = moteCellCoordinate(x - radius);
    const maxX = moteCellCoordinate(x + radius);
    const minY = moteCellCoordinate(y - radius);
    const maxY = moteCellCoordinate(y + radius);
    const radiusSq = radius * radius;
    for (let cellY = minY; cellY <= maxY; cellY += 1) {
      for (let cellX = minX; cellX <= maxX; cellX += 1) {
        const bucket = moteCells.get(moteCellKey(cellX, cellY));
        if (!bucket) continue;
        for (const mote of bucket) {
          if (distanceSq(x, y, mote.x, mote.y) <= radiusSq) moteQueryBuffer.push(mote);
        }
      }
    }
    return moteQueryBuffer;
  }

  function replaceCollectedMote(mote) {
    const index = motes.indexOf(mote);
    if (index < 0) return null;
    unindexMote(mote);
    motes.splice(index, 1);
    const replacement = createMote();
    motes.push(replacement);
    indexMote(replacement);
    return replacement;
  }

  function appendIndexedMote(mote) {
    motes.push(mote);
    indexMote(mote);
    return mote;
  }

/*__ECHO_SECTION_END:0123__*/
