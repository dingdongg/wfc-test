const images = {};

const grid = [];
const DIMENSION = 4;

const UP = 1;       //      ㅗ
const RIGHT = 2;    //      ㅏ
const DOWN = 4;     //      ㅜ
const LEFT = 8;     //      ㅓ
const BLANK = 16;

const INITIAL_WAVE = UP | RIGHT | DOWN | LEFT | BLANK; // 31
const WAVE_ARRAY = [UP, RIGHT, DOWN, LEFT, BLANK];

const FACING_DOWN = RIGHT | DOWN | LEFT; // 14
const FACING_LEFT = UP | DOWN | LEFT; // 13
const FACING_UP = UP | RIGHT | LEFT; // 11
const FACING_RIGHT = UP | RIGHT | DOWN; // 7

const constraints = {
    [UP]: {
        [UP]: FACING_DOWN,
        [RIGHT]: FACING_LEFT,
        [DOWN]: DOWN | BLANK,
        [LEFT]: FACING_RIGHT,
    },
    [RIGHT]: {
        [UP]: FACING_DOWN,
        [RIGHT]: FACING_LEFT,
        [DOWN]: FACING_UP,
        [LEFT]: LEFT | BLANK,
    },
    [DOWN]: {
        [UP]: UP | BLANK,
        [RIGHT]: FACING_LEFT,
        [DOWN]: FACING_UP,
        [LEFT]: FACING_RIGHT,
    },
    [LEFT]: {
        [UP]: FACING_DOWN,
        [RIGHT]: RIGHT | BLANK,
        [DOWN]: FACING_UP,
        [LEFT]: FACING_RIGHT,
    },
    [BLANK]: {
        [UP]: BLANK | UP,
        [RIGHT]: BLANK | RIGHT,
        [DOWN]: BLANK | DOWN,
        [LEFT]: BLANK | LEFT,
    },
};

const WAVE_STATES = { 0: [] };

function populateNumStates(startNum) {
    for (let i = 1; i <= startNum; i++) {
        const exponent = Math.floor(Math.log2(i));
        const power = Math.pow(2, exponent);

        WAVE_STATES[i] = (i !== power) 
            ? WAVE_STATES[power].concat(WAVE_STATES[i - power])
            : [i];
    }
}

/**
 * Initialize all tiles in `grid` to be fully superimposed 
 */
function initGrid() {
    for (let i = 0; i < DIMENSION; i++) {
        grid.push([]);
        for (let j = 0; j < DIMENSION; j++) {
            grid[i].push({ collapsed: false, wave: INITIAL_WAVE });
        }
    }
}

const text = {
    [UP]: "ㅗ ",
    [RIGHT]: "ㅏ ",
    [DOWN]: "ㅜ ",
    [LEFT]: "ㅓ ",
    [BLANK]: "🟩 ",
    [INITIAL_WAVE]: "??",
}

/**
 * print wave state of the grid
 */
function printGridState() {
    let ret = "";
    for (const row of grid) {
        const formattedRow = row.map(v => text[v.wave] || v.wave).join("  ").toString();
        ret += `${formattedRow}\n\n`;
    }
    console.log(ret);
}

/**
 * returns a random `row` and `offset` index pair for `grid`
 */
function getRandomGridIndex() {
    const randomNumber = Math.floor(Math.random() * DIMENSION * DIMENSION);
    const row = Math.floor(randomNumber / DIMENSION);
    const offset = randomNumber % DIMENSION;

    return { row, offset };
}

function yieldOneState(wave = WAVE_ARRAY) {
    const randomIndex = Math.floor(Math.random() * wave.length);
    return wave[randomIndex];
}

// TODO
function updateNeighborEntropy(row, offset) {
    console.log(`updateNeighborEntropy(${row}, ${offset})`);
    // horizontally and vertically
    if (row < 0 || row >= DIMENSION || offset < 0 || offset >= DIMENSION) {
        return;
    }

    const collapsedCell = grid[row][offset];

    const getEntropy = ({ wave }) => WAVE_STATES[wave].length;

    // vertically down a column
    for (let i = 0; i < DIMENSION; i++) {
        if (i === row || grid[i][offset].collapsed) continue;
        printGridState();

        const cell = grid[i][offset];
        cell.wave &= constraints[collapsedCell.wave][i < row ? UP : DOWN];

        if (getEntropy(cell) === 1) collapse(i, offset);
        if (getEntropy(cell) === 0) {
            // look at the immediate neighboring cells (up, right, down, left)
            const above = (i - 1 >= 0) ? grid[i - 1][offset] : null;
            const right = (offset + 1 < DIMENSION) ? grid[i][offset + 1] : null;
            const below = (i + 1 < DIMENSION) ? grid[i + 1][offset] : null;
            const left = (offset - 1 >= 0) ? grid[i][offset - 1] : null;
            const adjacent = [above, right, below, left];
            const bruh = adjacent.reduce((res, adj) => {
                if (adj?.collapsed) return res & adj.wave;
                return res;
            }, INITIAL_WAVE);

            console.log("BRUH", getEntropy({ wave: bruh }));

            if (getEntropy({ wave: bruh}) === 0) {
                console.log("COL ERROR", cell, `row = ${i}, offset = ${offset}`);
                // throw new Error ("COL CONTRADICTION");
                return;
            } else {
                cell.wave = bruh;
            }
        } 
    }

    // horizontally across a row
    for (let j = 0; j < DIMENSION; j++) {
        if (j === offset || grid[row][j].collapsed) continue;
        printGridState();

        const cell = grid[row][j];
        cell.wave &= constraints[collapsedCell.wave][j < offset ? LEFT : RIGHT];

        if (getEntropy(cell) === 1) collapse(row, j);
        if (getEntropy(cell) === 0) {
            // look at the immediate neighboring cells (up, right, down, left)
            const above = (row - 1 >= 0) ? grid[row - 1][j] : null;
            const right = (j + 1 < DIMENSION) ? grid[row][j + 1] : null;
            const below = (row + 1 < DIMENSION) ? grid[row + 1][j] : null;
            const left = (j - 1 >= 0) ? grid[row][j - 1] : null;
            const adjacent = [above, right, below, left];
            const bruh = adjacent.reduce((res, adj) => {
                if (adj?.collapsed) return res & adj.wave;
                return res;
            }, INITIAL_WAVE);
            
            if (getEntropy({ wave: bruh }) === 0) {
                console.log("ROW ERROR", cell, `row = ${row}, offset = ${j}`);
                // throw new Error ("ROW CONTRADICTION");
                return;
            } else {
                cell.wave = bruh;
            }
        } 
    }
}

function updateAdjacentEntropy(row, offset) {
    if (row < 0 || row >= DIMENSION || offset < 0 || offset >= DIMENSION) return;

    const collapsed = grid[row][offset];
    // cell above collapsed cell
    // cell to the right of collapsed cell
    // cell below collapsed cell
    // cell to the left of collapsed cell
    const above = (row - 1 >= 0) ? grid[row - 1][offset] : null;
    const right = (offset + 1 < DIMENSION) ? grid[row][offset + 1] : null;
    const below = (row + 1 < DIMENSION) ? grid[row + 1][offset] : null;
    const left = (offset - 1 >= 0) ? grid[row][offset - 1] : null;

    above.wave &= constraints[collapsed.wave][UP];
    right.wave &= constraints[collapsed.wave][RIGHT];
    below.wave &= constraints[collapsed.wave][DOWN];
    left.wave &= constraints[collapsed.wave][LEFT];
}

/**
 * Propagate changes in a single direction
 * @param {number} row 0-indexed row in grid
 * @param {number} offset 0-indexed offset in row
 * @param {UP | RIGHT | DOWN | LEFT} direction Propagation direction
 */
function updateNeighbors(row, offset, direction) {
    const root = grid[row][offset];
    let coords;

    if (direction === UP && (row - 1 >= 0)) {
        coords = [row - 1, offset];
    } else if (direction === RIGHT && (offset + 1 < DIMENSION)) {
        coords = [row, offset + 1];
    } else if (direction === DOWN && (row + 1 < DIMENSION)) {
        coords = [row + 1, offset];
    } else if (direction === LEFT && (offset - 1 >= 0)) {
        coords = [row, offset - 1];
    } else return;

    console.log(coords);
    const cell = grid[coords[0]][coords[1]];
    const newConstraint = constraints[root.wave][direction];

    if (!cell.collapsed) cell.wave &= newConstraint;
    else return;

    const newState = WAVE_STATES[cell.wave];

    if (newState.length === 1) cell.collapsed = true;

    updateNeighbors(coords[0], coords[1], direction);
}

// TODO
/**
 * Collapse a given cell
 * 
 * @param {number} row Row index
 * @param {number} offset Offset index in a row
 * @param {number} state Image index
*/
function collapse(row, offset) {
    console.log(`collapse(${row}, ${offset})`);

    let cell = grid[row][offset];
    const imgIndex = yieldOneState(WAVE_STATES[cell.wave]);
    grid[row][offset] = { collapsed: true, wave: imgIndex };

    const img = images[imgIndex];
    if (WAVE_STATES[cell.wave].length !== 0) {
        image(img, img.width * offset, img.height * row);
    }

    updateNeighbors(row, offset, UP);
    updateNeighbors(row, offset, RIGHT);
    updateNeighbors(row, offset, DOWN);
    updateNeighbors(row, offset, LEFT);

    printGridState();
}

/**
 * Returns the index of a random image
 * @param {any[]} collection
 */
function getRandomIndex(collection) {
    return Math.floor(Math.random() * collection.length);
}

/**
 * Try to insert `n` random images into `n` random places.
 * 
 * Index collisions are ignored, so there may be `<= n` image renders.
 * 
 * @param {number} n Number of inserts
 */
function insertRandomImages(n) {
    console.log("insertRandomImages()");

    for (let i = 0; i < n; i++) {
        const { row, offset } = getRandomGridIndex();
        collapse(row, offset);
    }
}

/**
 * Fill entire `DIMENSION * DIMENSION` grid with random images
 */
function fillGridWithImages() {
    for (let i = 0; i < DIMENSION; i++) {
        for (let j = 0; j < DIMENSION; j++) {
            const randomIndex = getRandomIndex(images);
            const img = images[randomIndex];
            // image(img, img.width * j, img.height * i);
            collapse(i, j, randomIndex);
        }
    }
}

function renderImages(full, numInserts = DIMENSION) {
    full ? fillGridWithImages() : insertRandomImages(numInserts);
}

function getMinEntropyCell() {
    let minSoFar = WAVE_ARRAY.length + 1;
    let index = [-1, -1];

    const getEntropy = ({ wave }) => WAVE_STATES[wave].length;

    for (let i = 0; i < DIMENSION; i++) {
        for (let j = 0; j < DIMENSION; j++) {
            const entropy = getEntropy(grid[i][j]);
            if (!grid[i][j].collapsed && entropy < minSoFar) {
                minSoFar = entropy;
                index = [i, j];
            }
        }
    }

    return index;
}

/**
 * PSEUDOCODE
 * 1. find grid cell with the lowest entropy
 * 2. if there is a contradiction, throw error and quit process
 * 3. if all cells have an entropy of 0, render all images and quit process
 * 4. else, 
 */
function observe() {
    console.log("observe()");
    const [row, offset] = getMinEntropyCell();

    console.log(row, offset);

    if (row === -1 && offset === -1) return;

    collapse(row, offset);
    observe();
    
    // const cell = grid[row][offset];
    // if (cell.wave.length === 0) throw new Error("BROOOOO");

    // const randomState = getRandomIndex(cell.wave);
    // collapse(row, offset, cell.wave[randomState]);
}

function waveFunctionCollapse() {
    console.log("waveFunctionCollapse()");

    let oneDimGrid = [];
    for (const row of grid) {
        oneDimGrid = oneDimGrid.concat(row);
    }

    observe();
    // while (uncollapsed.size > 0) {
    //     observe(uncollapsed); // (collapse a cell according to constraints)
    //     // propagate (update entropy for all neighboring cells and recursively propagate it)
    // }
}

/**
 * p5.js specific functions
 */

/**
 * load images into scope
 */
function preload() {
    images[UP] = loadImage("images/up.png");
    images[RIGHT] = loadImage("images/right.png");
    images[DOWN] = loadImage("images/down.png");
    images[LEFT] = loadImage("images/left.png");
    images[BLANK] = loadImage("images/blank.png");
}

function setup() {
    const imageSize = 128;
    const canvasSize = imageSize * DIMENSION;
    populateNumStates(INITIAL_WAVE);

    createCanvas(canvasSize, canvasSize);
    rect(0, 0, canvasSize, canvasSize);

    Object.values(images).forEach(image => image.resize(imageSize, imageSize));

    initGrid();
    // insertRandomImages(1);
    // renderImages(false, 1);
    // printGridState();
    waveFunctionCollapse();
}

function draw() {
    background(51, 0.4);   
}
/**
 * PSEUDOCODE
 * 1. find grid cell with the lowest entropy
 * 2. if there is a contradiction, throw error and quit process
 * 3. if all cells have an entropy of 0, render all images and quit process
 * 4. else, 
 */

/**
 * ENTROPY DEFINITION
 * 
 * empty wave function :: contradiction
 * 1 item in wave function :: entropy = 0
 * 2 items in wave function :: entropy = 2
 * 3 items in wave function :: entropy = 3
 * 4 items in wave function :: entropy = 4
 * 5 items in wave function :: entropy = 5
 * n items in wave function :: entropy = n (n > 1)
 */