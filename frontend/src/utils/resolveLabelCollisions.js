export const resolveLabelCollisions = (
    users,
    labelRefs
  ) => {
    const entries = users
      .filter(
        (user) =>
          user.latitude != null &&
          user.longitude != null
      )
      .map((user) => {
        const element =
          labelRefs.current[user.user_id];
  
        if (!element) {
          return null;
        }
  
        const rect =
          element.getBoundingClientRect();
  
        const pin =
          element.closest(".map-pin");
  
        if (!pin) {
          return null;
        }
  
        const pinRect =
          pin.getBoundingClientRect();
  
        const anchorX =
          pinRect.left +
          pinRect.width / 2;
  
        const anchorY =
          pinRect.top +
          pinRect.height / 2;
  
        return {
          id: user.user_id,
          width: rect.width,
          height: rect.height,
          anchorX,
          anchorY,
          offsetX: 0,
          offsetY: 0,
        };
      })
      .filter(Boolean);
  
    if (entries.length === 0) {
      return {};
    }
  
    const clusterDistance = 140;
  
    // Give crowded labels an initial direction
    // away from the center of nearby pins.
    for (const entry of entries) {
      const neighbors = entries.filter(
        (other) => {
          if (other.id === entry.id) {
            return false;
          }
  
          return (
            Math.hypot(
              other.anchorX - entry.anchorX,
              other.anchorY - entry.anchorY
            ) < clusterDistance
          );
        }
      );
  
      if (neighbors.length === 0) {
        continue;
      }
  
      const cluster = [
        entry,
        ...neighbors,
      ];
  
      const centerX =
        cluster.reduce(
          (sum, item) =>
            sum + item.anchorX,
          0
        ) / cluster.length;
  
      const centerY =
        cluster.reduce(
          (sum, item) =>
            sum + item.anchorY,
          0
        ) / cluster.length;
  
      let dx =
        entry.anchorX - centerX;
  
      let dy =
        entry.anchorY - centerY;
  
      let distance =
        Math.hypot(dx, dy);
  
      if (distance < 1) {
        const index =
          entries.indexOf(entry);
  
        const angle =
          index * 2.399963229728653;
  
        dx = Math.cos(angle);
        dy = Math.sin(angle);
        distance = 1;
      }
  
      const initialSpread = 18;
  
      entry.offsetX =
        (dx / distance) *
        initialSpread;
  
      entry.offsetY =
        (dy / distance) *
        initialSpread;
    }
  
    const iterations = 60;
  
    const paddingX = 12;
    const paddingY = 8;
  
    const maxDistance = 85;
  
    const springStrength = 0.015;
  
    for (
      let iteration = 0;
      iteration < iterations;
      iteration++
    ) {
      let moved = false;
  
      for (
        let i = 0;
        i < entries.length;
        i++
      ) {
        for (
          let j = i + 1;
          j < entries.length;
          j++
        ) {
          const a = entries[i];
          const b = entries[j];
  
          const ax =
            a.anchorX + a.offsetX;
  
          const ay =
            a.anchorY + a.offsetY;
  
          const bx =
            b.anchorX + b.offsetX;
  
          const by =
            b.anchorY + b.offsetY;
  
          const dx = ax - bx;
          const dy = ay - by;
  
          const overlapX =
            (a.width + b.width) / 2 +
            paddingX -
            Math.abs(dx);
  
          const overlapY =
            (a.height + b.height) / 2 +
            paddingY -
            Math.abs(dy);
  
          if (
            overlapX > 0 &&
            overlapY > 0
          ) {
            moved = true;
  
            const distance =
              Math.hypot(dx, dy);
  
            let nx;
            let ny;
  
            if (distance < 0.1) {
              const index =
                entries.indexOf(a);
  
              const angle =
                index *
                2.399963229728653;
  
              nx = Math.cos(angle);
              ny = Math.sin(angle);
            } else {
              nx = dx / distance;
              ny = dy / distance;
            }
  
            const push =
              Math.min(
                overlapX,
                overlapY
              ) * 0.55;
  
            a.offsetX +=
              nx * push;
  
            a.offsetY +=
              ny * push;
  
            b.offsetX -=
              nx * push;
  
            b.offsetY -=
              ny * push;
          }
        }
      }
  
      // Pull displaced labels gently back
      // toward their geographic pin.
      for (const entry of entries) {
        entry.offsetX -=
          entry.offsetX *
          springStrength;
  
        entry.offsetY -=
          entry.offsetY *
          springStrength;
  
        const distance =
          Math.hypot(
            entry.offsetX,
            entry.offsetY
          );
  
        // Prevent a label from wandering
        // too far away from its pin.
        if (
          distance > maxDistance
        ) {
          const scale =
            maxDistance /
            distance;
  
          entry.offsetX *= scale;
          entry.offsetY *= scale;
        }
      }
  
      if (!moved) {
        break;
      }
    }
  
    const nextOffsets = {};
  
    for (const entry of entries) {
      nextOffsets[entry.id] = {
        x: entry.offsetX,
        y: entry.offsetY,
      };
    }
  
    return nextOffsets;
  };