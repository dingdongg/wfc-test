# Wave Function Collapse demo

Basic implementation of the wave function collapse algorithm, using 5 images (found in `/images`). I am playing around with this to get a better understanding of the algorithm, instead of blindly relying on it as a black box.

## Advantages
* Uses bits to store information about directions. In `sketch.js`, the directions `UP`, `RIGHT`, `DOWN`, `LEFT`, and `BLANK` are represented as powers of 2 (a single bit in a unique position)
* This bit-representation is a lot faster than array manipulations since we can perform bitwise operations instead of array operations

## Shortcomings
* The current code for WFC is tightly coupled with the nature of the adjacency relationships of the images. This means that it doesn't scale well to arbitrary tilesheets
* The adjacency relationship must be configured manually for different tilesheets. In other words, this implementation of WFC lacks the ability to *procedurally* generate an adjacency relationship among the tiles used.