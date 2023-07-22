const images = {};

const grid = [];
let DIMENSION = 104; // max dimensions = 104, before it uses up the entire stack memory with recursions lol

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

function populateWaveStates(startNum) {
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
    // (ret);
}

function yieldOneState(wave = WAVE_ARRAY) {
    const randomIndex = Math.floor(Math.random() * wave.length);
    return wave[randomIndex];
}

/**
 * Propagate changes in a single direction
 * @param {number} row 0-indexed row in grid
 * @param {number} offset 0-indexed offset in row
 * @param {UP | RIGHT | DOWN | LEFT} direction Propagation direction
 */
function updateNeighbors(row, offset, direction) {
    // ("updateNeighbors(), direction = ", direction);
    const root = grid[row][offset];
    let coords = [row, offset];

    if (direction === UP && (row - 1 >= 0)) coords[0] -= 1;
    else if (direction === RIGHT && (offset + 1 < DIMENSION)) coords[1] += 1;
    else if (direction === DOWN && (row + 1 < DIMENSION)) coords[0] += 1;
    else if (direction === LEFT && (offset - 1 >= 0)) coords[1] -= 1;
    else return;

    const cell = grid[coords[0]][coords[1]];
    const newConstraint = constraints[root.wave][direction];

    if (!cell.collapsed) cell.wave &= newConstraint;
    else return;

    const newState = WAVE_STATES[cell.wave];

    if (newState.length === 1) collapse(coords[0], coords[1]);
}

/**
 * Collapse a given cell
 * 
 * @param {number} row Row index
 * @param {number} offset Offset index in a row
 * @param {number} state Image index
*/
function collapse(row, offset) {
    // (`collapse(${row}, ${offset})`);

    let cell = grid[row][offset];
    const imgIndex = yieldOneState(WAVE_STATES[cell.wave]);
    grid[row][offset] = { collapsed: true, wave: imgIndex };

    const img = images[imgIndex];
    if (WAVE_STATES[cell.wave].length !== 0) {
        image(img, img.width * offset, img.height * row);
    }

    // propagate outwards radially from the root collapsed cell
    updateNeighbors(row, offset, UP);
    updateNeighbors(row, offset, RIGHT);
    updateNeighbors(row, offset, DOWN);
    updateNeighbors(row, offset, LEFT);
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
    // ("observe()");
    const [row, offset] = getMinEntropyCell();

    if (row === -1 && offset === -1) return;

    collapse(row, offset);
    observe();
}

function waveFunctionCollapse() {
    // ("waveFunctionCollapse()");

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
    console.time("TIMING sketch.js");
    const imageSize = 32;
    const canvasSize = imageSize * DIMENSION;
    populateWaveStates(INITIAL_WAVE);

    createCanvas(canvasSize, canvasSize);
    rect(0, 0, canvasSize, canvasSize);

    Object.values(images).forEach(image => image.resize(imageSize, imageSize));

    initGrid();
    // insertRandomImages(1);
    waveFunctionCollapse();
    console.timeEnd("TIMING sketch.js");
    printGridState();
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

module.exports = { 
    grid, DIMENSION, INITIAL_WAVE, WAVE_ARRAY,
    constraints, FACING_DOWN, FACING_LEFT, FACING_RIGHT, FACING_UP,
    WAVE_STATES, populateWaveStates, initGrid, text, printGridState,
    waveFunctionCollapse,
};