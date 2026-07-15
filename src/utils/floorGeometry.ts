export const normalizeColor = (hex: string): string =>
  !hex ? "#000000" : hex.startsWith("#") ? hex : `#${hex}`;

export const calculatePathCentroid = (
  pathData: string
): { x: number; y: number } => {
  const coords: Array<{ x: number; y: number }> = [];
  const hasSVGCommands = /[MmLlHhVvCcSsQqTtAaZz]/.test(pathData);

  if (!hasSVGCommands) {
    const coordRegex = /(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/g;
    let match;

    while ((match = coordRegex.exec(pathData)) !== null) {
      coords.push({
        x: parseFloat(match[1]),
        y: parseFloat(match[2]),
      });
    }
  } else {
    let currentX = 0;
    let currentY = 0;
    let startX = 0;
    let startY = 0;

    const commandRegex = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
    let match;

    while ((match = commandRegex.exec(pathData)) !== null) {
      const command = match[1];
      const argsStr = match[2].trim();
      const args = argsStr
        .replace(/,/g, " ")
        .split(/\s+/)
        .filter((arg) => arg.length > 0)
        .map(parseFloat);

      const isRelative =
        command === command.toLowerCase() && command !== "Z" && command !== "z";

      switch (command.toUpperCase()) {
        case "M":
        case "L":
          for (let i = 0; i < args.length; i += 2) {
            if (isNaN(args[i]) || isNaN(args[i + 1])) continue;
            currentX = isRelative ? currentX + args[i] : args[i];
            currentY = isRelative ? currentY + args[i + 1] : args[i + 1];
            coords.push({ x: currentX, y: currentY });
            if (command.toUpperCase() === "M" && coords.length === 1) {
              startX = currentX;
              startY = currentY;
            }
          }
          break;
        case "H":
          for (let i = 0; i < args.length; i++) {
            if (isNaN(args[i])) continue;
            currentX = isRelative ? currentX + args[i] : args[i];
            coords.push({ x: currentX, y: currentY });
          }
          break;
        case "V":
          for (let i = 0; i < args.length; i++) {
            if (isNaN(args[i])) continue;
            currentY = isRelative ? currentY + args[i] : args[i];
            coords.push({ x: currentX, y: currentY });
          }
          break;
        case "C":
          for (let i = 0; i < args.length; i += 6) {
            if (isNaN(args[i + 4]) || isNaN(args[i + 5])) continue;
            currentX = isRelative ? currentX + args[i + 4] : args[i + 4];
            currentY = isRelative ? currentY + args[i + 5] : args[i + 5];
            coords.push({ x: currentX, y: currentY });
          }
          break;
        case "Q":
          for (let i = 0; i < args.length; i += 4) {
            if (isNaN(args[i + 2]) || isNaN(args[i + 3])) continue;
            currentX = isRelative ? currentX + args[i + 2] : args[i + 2];
            currentY = isRelative ? currentY + args[i + 3] : args[i + 3];
            coords.push({ x: currentX, y: currentY });
          }
          break;
        case "Z":
          currentX = startX;
          currentY = startY;
          break;
      }
    }
  }

  if (coords.length === 0) {
    return { x: 0, y: 0 };
  }

  const minX = Math.min(...coords.map((c) => c.x));
  const maxX = Math.max(...coords.map((c) => c.x));
  const minY = Math.min(...coords.map((c) => c.y));
  const maxY = Math.max(...coords.map((c) => c.y));

  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  };
};

export const normalizePath = (pathData: string): string => {
  if (/[MLHVCSQTAZ]/i.test(pathData)) {
    return pathData;
  }

  const coords = pathData
    .split(/\s+/)
    .filter((segment) => segment.trim().length > 0)
    .map((segment) => segment.split(","))
    .flat();

  if (coords.length < 2) return "";

  let path = `M${coords[0]},${coords[1]}`;

  for (let i = 2; i < coords.length; i += 2) {
    if (coords[i + 1]) {
      path += ` L${coords[i]},${coords[i + 1]}`;
    }
  }

  return `${path} Z`;
};
