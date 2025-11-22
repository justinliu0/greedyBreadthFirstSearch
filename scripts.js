const runButton = document.getElementById("runButton");
const setStart = document.getElementById("setStart");
const setGoal = document.getElementById("setGoal");
const setWall = document.getElementById("setWall");
const gridSize = document.getElementById("gridSize");
const applySize = document.getElementById("apply");
const grid = document.getElementById("grid");

let mode = "wall";

setWall.addEventListener("click", () => mode = "wall");
setStart.addEventListener("click", () => mode = "start");
setGoal.addEventListener("click", () => mode = "goal");

function createGrid(size) {
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = `repeat(${size}, 50px)`;
    grid.style.gridTemplateRows = `repeat(${size}, 50px)`;

    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const box = document.createElement("div");
            box.classList.add("box");
            box.dataset.row = row;
            box.dataset.col = col;

            if (row === 0 && col === 0) {
                box.classList.add("start");
            }
            else if (row === size - 1 && col === size - 1) {
                box.classList.add("goal");
            }

            box.addEventListener("click", () => {
                clearPath();
                
                switch(mode) {
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
                        const prevGoal = document.querySelector(".goal");
                        if (prevGoal) {
                            prevGoal.classList.remove("goal");
                        }
                        box.classList.add("goal");
                        box.classList.remove("wall", "start");
                        break;
                }
            });

            grid.appendChild(box);
        }
    }
}

function getGridSize() {
    let size = parseInt(gridSize.value);
    if (size < 3) {
        size = 3;
    }
    if (size > 16) {
        size = 16;
    }
    return size;
}

function clearPath() {
    document.querySelectorAll(".visited, .path").forEach(box => {
        box.classList.remove("visited", "path");
    });
}

function getGridArray() {
    const size = getGridSize();
    const grid = [];
    let start, goal;

    for (let row = 0; row < size; row++) {
        const r = [];
        for (let col = 0; col < size; col++) {
            const box = document.querySelector(`.box[data-row='${row}'][data-col='${col}']`);
            if (box.classList.contains("start")) {
                r.push(3);
                start = [row, col];
            }
            else if (box.classList.contains("goal")) {
                r.push(2);
                goal = [row, col];
            }
            else if (box.classList.contains("wall")) {
                r.push(1);
            }
            else {
                r.push(0);
            }
        }
        grid.push(r);
    }
    return {grid, start, goal};
}

async function bfs() {
    const {grid, start, goal} = getGridArray();
    const size = getGridSize();
    const visited = [];
    const prev = [];
    const adjacent = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0]
    ]

    clearPath();

    for (let row = 0; row < size; row++) {
        const r = [];
        for (let col = 0; col < size; col++) {
            r.push(false);
        }
        visited.push(r);
    }

    for (let row = 0; row < getGridSize(); row++) {
        const r = [];
        for (let col = 0; col < getGridSize(); col++) {
            r.push(null);
        }
        prev.push(r);
    }

    const queue = [start];
    visited[start[0]][start[1]] = true;

    while (queue.length > 0) {
        const [row, col] = queue.shift();

        if (row === goal[0] && col === goal[1]) {
            break;
        }

        for (const [rowDelta, colDelta] of adjacent) {
            const newRow = row + rowDelta;
            const newCol = col + colDelta;

            if (
                newRow >= 0 && newRow < size &&
                newCol >= 0 && newCol < size &&
                !visited[newRow][newCol] &&
                grid[newRow][newCol] !== 1
            ) {
                queue.push([newRow, newCol]);
                visited[newRow][newCol] = true;
                prev[newRow][newCol] = [row, col];

                const box = document.querySelector(`.box[data-row='${newRow}'][data-col='${newCol}']`);
                if (!box.classList.contains("start") && !box.classList.contains("goal")) {
                    box.classList.add("visited");
                }
                await new Promise(r => setTimeout(r, 50));
            }
        }
    }

    let path = [];
    let current = goal;

    while (current) {
        path.push(current);
        current = prev[current[0]][current[1]];
    }
    path.reverse(); 

    for (const [row, col] of path) {
        const box = document.querySelector(`.box[data-row='${row}'][data-col='${col}']`);
        if (!box.classList.contains("start") && !box.classList.contains("goal")) {
            box.classList.add("path");
            await new Promise(r => setTimeout(r, 50));
        }
    }

}

createGrid(getGridSize());
applySize.addEventListener("click", () => createGrid(getGridSize()));
runButton.addEventListener("click", bfs);