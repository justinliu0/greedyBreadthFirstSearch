const runButton = document.getElementById("runButton");
const setStart = document.getElementById("setStart");
const setGoal = document.getElementById("setGoal");
const setWall = document.getElementById("setWall");
const moveNumber = document.getElementById("moveNumber");
const gridSize = document.getElementById("gridSize");
const applySize = document.getElementById("apply");
const grid = document.getElementById("grid");

let mode = "wall";
let originalGoals = [];
let fullPath = [];

setWall.addEventListener("click", () => mode = "wall");
setStart.addEventListener("click", () => mode = "start");
setGoal.addEventListener("click", () => mode = "goal");

function createGrid(size) {
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = `repeat(${size}, 50px)`;
    grid.style.gridTemplateRows = `repeat(${size}, 50px)`;

    originalGoals = [];
    fullPath = [];

    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const box = document.createElement("div");
            box.classList.add("box");
            box.dataset.row = row;
            box.dataset.col = col;

            if (row === 0 && col === 0) {
                box.classList.add("start");
            } else if (row === size - 1 && col === size - 1) {
                box.classList.add("goal");
                originalGoals.push([row, col]);
            }

            box.addEventListener("click", () => {
                clearPath();

                switch (mode) {
                    case "wall":
                        if (!box.classList.contains("start") && !box.classList.contains("goal")) {
                            box.classList.toggle("wall");
                        }
                        break;
                    case "start":
                        const prevStart = document.querySelector(".start");
                        if (prevStart) {
                            prevStart.classList.remove("start");
                        }
                        box.classList.add("start");
                        box.classList.remove("wall", "goal");
                        break;
                        case "goal":
                            if (box.classList.contains("goal")) {
                                box.classList.remove("goal");
                                originalGoals = originalGoals.filter(g => !(g[0] === row && g[1] === col));
                            } else {
                                box.classList.add("goal");
                                box.classList.remove("wall", "start");

                                if (!originalGoals.some(g => g[0] === row && g[1] === col)) {
                                    originalGoals.push([row, col]);
                                }
                            }
                            break;
                }
            });

            grid.appendChild(box);
        }
    }
}

function getGridSize() {
    let size = parseInt(gridSize.value);
    if (isNaN(size)) {
        size = 5;
    }
    if (size < 3) {
        size = 3;
    }
    if (size > 16) {
        size = 16;
    }
    return size;
}

function clearPath() {
    document.querySelectorAll(".visited, .path").forEach(b => {
        b.classList.remove("visited", "path");
    });
}

function getGridArray() {
    const size = getGridSize();
    const gridArr = [];
    let start = null;
    const goals = [];

    for (let row = 0; row < size; row++) {
        const r = [];
        for (let col = 0; col < size; col++) {
            const box = document.querySelector(`.box[data-row='${row}'][data-col='${col}']`);
            if (box.classList.contains("start")) {
                r.push(3);
                start = [row, col];
            } else if (box.classList.contains("goal")) {
                r.push(2);
                goals.push([row, col]);
            } else if (box.classList.contains("wall")) {
                r.push(1);
            } else {
                r.push(0);
            }
        }
        gridArr.push(r);
    }

    return { grid: gridArr, start, goals };
}

async function bfs(start, maxMoves) {
    const { grid, goals } = getGridArray();
    const size = getGridSize();

    clearPath();

    const visited = Array.from({ length: size }, () => Array(size).fill(false));
    const prev = Array.from({ length: size }, () => Array(size).fill(null));

    const adjacent = [
        [0, 1], 
        [0, -1],
        [1, 0], 
        [-1, 0]
    ];

    const queue = [[start[0], start[1], 0]];
    visited[start[0]][start[1]] = true;

    while (queue.length > 0) {
        const [row, col, dist] = queue.shift();

        if (goals.some(g => g[0] === row && g[1] === col)) {
            const path = [];
            let current = [row, col];

            while (current) {
                path.push(current);
                current = prev[current[0]][current[1]];
            }
            path.reverse();

            for (const [pr, pc] of path) {
                const b = document.querySelector(`.box[data-row='${pr}'][data-col='${pc}']`);
                if (!b.classList.contains("start") && !b.classList.contains("goal")) {
                    b.classList.add("path");
                    await new Promise(r => setTimeout(r, 40));
                }
            }

            return { goalReached: [row, col], distanceUsed: dist, path };
        }

        if (dist >= maxMoves) {
            continue;
        }

        for (const [dr, dc] of adjacent) {
            const nr = row + dr;
            const nc = col + dc;

            if (
                nr >= 0 && nr < size &&
                nc >= 0 && nc < size &&
                !visited[nr][nc] &&
                grid[nr][nc] !== 1
            ) {
                visited[nr][nc] = true;
                prev[nr][nc] = [row, col];
                queue.push([nr, nc, dist + 1]);

                const b = document.querySelector(`.box[data-row='${nr}'][data-col='${nc}']`);
                if (!b.classList.contains("start") && !b.classList.contains("goal")) {
                    b.classList.add("visited");
                }
                await new Promise(r => setTimeout(r, 20));
            }
        }
    }

    return null;
}

async function multiBFS() {
    let { start, goals } = getGridArray();
    let movesLeft = parseInt(moveNumber.value);
    if (isNaN(movesLeft)) {
        movesLeft = 0;
    }
    let currentPos = start;
    fullPath = [];

    while (movesLeft > 0 && goals.length > 0) {
        const result = await bfs(currentPos, movesLeft);
        if (!result) {
            break;
        }

        const { goalReached, distanceUsed, path } = result;

        for (const step of path) {
            const key = step.join(",");
            if (!fullPath.some(p => p.join(",") === key)) {
                fullPath.push(step);
            }
        }

        movesLeft -= distanceUsed;

        goals = goals.filter(g => !(g[0] === goalReached[0] && g[1] === goalReached[1]));

        const reachedBox = document.querySelector(`.box[data-row='${goalReached[0]}'][data-col='${goalReached[1]}']`);
        if (reachedBox) {
            reachedBox.classList.remove("goal");
        }
        
        currentPos = goalReached;

        clearPath();
    }

    highlightFinalPath();
    restoreOriginalGoals();
}

function highlightFinalPath() {
    for (const [r, c] of fullPath) {
        const isOriginalGoal = originalGoals.some(g => g[0] === r && g[1] === c);
        if (isOriginalGoal) {
            continue;
        }

        const box = document.querySelector(`.box[data-row='${r}'][data-col='${c}']`);
        if (box && !box.classList.contains("start")) {
            box.classList.add("path");
        }
    }
}

function restoreOriginalGoals() {
    for (const [r, c] of originalGoals) {
        const box = document.querySelector(`.box[data-row='${r}'][data-col='${c}']`);
        if (!box) {
            continue;
        }
        box.classList.remove("path");
        box.classList.add("goal");
    }
}

createGrid(getGridSize());
applySize.addEventListener("click", () => createGrid(getGridSize()));
runButton.addEventListener("click", multiBFS);