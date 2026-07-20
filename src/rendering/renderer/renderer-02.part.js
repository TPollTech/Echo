  function visible(x, y, padding = 80) {
    const point = toScreen(x, y);
    return point.x > -padding && point.x < width + padding && point.y > -padding && point.y < height + padding;
  }

