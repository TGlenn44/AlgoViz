// Base Visualizer class
class BaseVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.animationId = null;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    drawText(text, x, y, options = {}) {
        const {
            fontSize = 16,
            fontFamily = 'Inter, sans-serif',
            color = '#333',
            textAlign = 'left',
            textBaseline = 'top'
        } = options;

        this.ctx.font = `${fontSize}px ${fontFamily}`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = textAlign;
        this.ctx.textBaseline = textBaseline;
        this.ctx.fillText(text, x, y);
    }

    drawRect(x, y, width, height, options = {}) {
        const {
            fillColor = '#667eea',
            strokeColor = '#333',
            strokeWidth = 1,
            borderRadius = 0
        } = options;

        this.ctx.save();
        
        if (borderRadius > 0) {
            this.ctx.beginPath();
            this.ctx.roundRect(x, y, width, height, borderRadius);
            this.ctx.closePath();
        } else {
            this.ctx.rect(x, y, width, height);
        }

        if (fillColor) {
            this.ctx.fillStyle = fillColor;
            this.ctx.fill();
        }

        if (strokeColor && strokeWidth > 0) {
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = strokeWidth;
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    drawCircle(x, y, radius, options = {}) {
        const {
            fillColor = '#667eea',
            strokeColor = '#333',
            strokeWidth = 1
        } = options;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        
        if (fillColor) {
            this.ctx.fillStyle = fillColor;
            this.ctx.fill();
        }

        if (strokeColor && strokeWidth > 0) {
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = strokeWidth;
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    drawLine(x1, y1, x2, y2, options = {}) {
        const {
            color = '#333',
            width = 1,
            dashArray = []
        } = options;

        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        
        if (dashArray.length > 0) {
            this.ctx.setLineDash(dashArray);
        }

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        this.ctx.restore();
    }

    animate(callback) {
        const animate = () => {
            callback();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// Sorting Visualizer
class SortingVisualizer extends BaseVisualizer {
    constructor(canvas) {
        super(canvas);
        this.array = [];
        this.originalArray = [];
        this.comparisons = 0;
        this.swaps = 0;
        this.highlightedIndices = [];
        this.sortedIndices = [];
        this.cancelRequested = false;
    }

    setArray(array) {
        this.array = [...array];
        this.originalArray = [...array];
        this.comparisons = 0;
        this.swaps = 0;
        this.highlightedIndices = [];
        this.sortedIndices = [];
        this.draw();
    }

    reset() {
        this.array = [...this.originalArray];
        this.comparisons = 0;
        this.swaps = 0;
        this.highlightedIndices = [];
        this.sortedIndices = [];
        this.draw();
    }

    draw() {
        this.clear();
        
        if (this.array.length === 0) return;

        const titleHeight = 40; // Space for the title
        const barWidth = (this.width - 100) / this.array.length;
        const maxValue = Math.max(...this.array);
        const barHeightRatio = (this.height - 100 - titleHeight) / maxValue;

        // Draw title
        this.drawText('Array Visualization', this.width/2, 28, {
            fontSize: 28,
            textAlign: 'center',
            color: '#333'
        });

        // Draw bars
        this.array.forEach((value, index) => {
            const x = 50 + index * barWidth;
            const barHeight = value * barHeightRatio;
            const y = this.height - 50 - barHeight;
            const yWithTitle = y + titleHeight / 2;

            let fillColor = '#667eea';
            
            if (this.highlightedIndices.includes(index)) {
                fillColor = '#ff6b6b';
            } else if (this.sortedIndices.includes(index)) {
                fillColor = '#51cf66';
            }

            this.drawRect(x, yWithTitle, barWidth - 2, barHeight, {
                fillColor: fillColor,
                strokeColor: '#333',
                strokeWidth: 1,
                borderRadius: 4
            });

            // Draw value on top of bar
            this.drawText(value.toString(), x + barWidth/2, yWithTitle - 20, {
                fontSize: 14,
                textAlign: 'center',
                color: '#333'
            });
        });
    }

    highlightIndices(indices) {
        this.highlightedIndices = indices;
        this.draw();
    }

    markSorted(index) {
        this.sortedIndices.push(index);
        this.draw();
    }

    updateStats(comparisons, swaps) {
        this.comparisons = comparisons;
        this.swaps = swaps;
    }

    async runAlgorithm(algorithm, speed, pauseCallback) {
        const delay = (11 - speed) * 15; // Speed up: 150ms to 15ms
        this.paused = false;
        this.pauseCallback = pauseCallback;
        switch (algorithm) {
            case 'bubble':
                return await this.bubbleSort(delay, pauseCallback);
            case 'quick':
                return await this.quickSort(delay, pauseCallback);
            case 'merge':
                return await this.mergeSort(delay, pauseCallback);
            case 'heap':
                return await this.heapSort(delay, pauseCallback);
            default:
                throw new Error(`Unknown algorithm: ${algorithm}`);
        }
    }

    async bubbleSort(delay, pauseCallback) {
        this.comparisons = 0;
        this.swaps = 0;
        this.sortedIndices = [];
        const n = this.array.length;
        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                if (this.cancelRequested) return { comparisons: this.comparisons, swaps: this.swaps };
                if (pauseCallback) await pauseCallback();
                this.comparisons++;
                this.highlightIndices([j, j + 1]);
                await sleep(delay);
                if (this.array[j] > this.array[j + 1]) {
                    [this.array[j], this.array[j + 1]] = [this.array[j + 1], this.array[j]];
                    this.swaps++;
                    this.draw();
                    await sleep(delay);
                }
            }
            this.sortedIndices.push(n - i - 1);
        }
        this.sortedIndices.push(0);
        this.highlightIndices([]);
        this.draw();
        return { comparisons: this.comparisons, swaps: this.swaps };
    }

    async quickSort(delay, pauseCallback) {
        this.comparisons = 0;
        this.swaps = 0;
        this.sortedIndices = [];
        await this.quickSortHelper(0, this.array.length - 1, delay, pauseCallback);
        this.sortedIndices = this.array.map((_, i) => i);
        this.highlightIndices([]);
        this.draw();
        return { comparisons: this.comparisons, swaps: this.swaps };
    }

    async quickSortHelper(low, high, delay, pauseCallback) {
        if (low < high) {
            const pi = await this.partition(low, high, delay, pauseCallback);
            await this.quickSortHelper(low, pi - 1, delay, pauseCallback);
            await this.quickSortHelper(pi + 1, high, delay, pauseCallback);
        }
    }

    async partition(low, high, delay, pauseCallback) {
        const pivot = this.array[high];
        let i = low - 1;
        for (let j = low; j < high; j++) {
            if (pauseCallback) await pauseCallback();
            this.comparisons++;
            this.highlightIndices([j, high]);
            await sleep(delay);
            if (this.array[j] < pivot) {
                i++;
                if (i !== j) {
                    [this.array[i], this.array[j]] = [this.array[j], this.array[i]];
                    this.swaps++;
                    this.draw();
                    await sleep(delay);
                }
            }
        }
        [this.array[i + 1], this.array[high]] = [this.array[high], this.array[i + 1]];
        this.swaps++;
        this.draw();
        await sleep(delay);
        return i + 1;
    }

    async mergeSort(delay, pauseCallback) {
        this.comparisons = 0;
        this.swaps = 0;
        this.sortedIndices = [];
        await this.mergeSortHelper(0, this.array.length - 1, delay, pauseCallback);
        this.sortedIndices = this.array.map((_, i) => i);
        this.highlightIndices([]);
        this.draw();
        return { comparisons: this.comparisons, swaps: this.swaps };
    }

    async mergeSortHelper(low, high, delay, pauseCallback) {
        if (low < high) {
            const mid = Math.floor((low + high) / 2);
            await this.mergeSortHelper(low, mid, delay, pauseCallback);
            await this.mergeSortHelper(mid + 1, high, delay, pauseCallback);
            await this.merge(low, mid, high, delay, pauseCallback);
        }
    }

    async merge(low, mid, high, delay, pauseCallback) {
        const left = this.array.slice(low, mid + 1);
        const right = this.array.slice(mid + 1, high + 1);
        let i = 0, j = 0, k = low;
        while (i < left.length && j < right.length) {
            if (pauseCallback) await pauseCallback();
            this.comparisons++;
            this.highlightIndices([low + i, mid + 1 + j]);
            await sleep(delay);
            if (left[i] <= right[j]) {
                this.array[k] = left[i];
                i++;
            } else {
                this.array[k] = right[j];
                j++;
            }
            this.swaps++;
            k++;
            this.draw();
            await sleep(delay);
        }
        while (i < left.length) {
            if (pauseCallback) await pauseCallback();
            this.array[k] = left[i];
            i++;
            k++;
            this.swaps++;
            this.draw();
            await sleep(delay);
        }
        while (j < right.length) {
            if (pauseCallback) await pauseCallback();
            this.array[k] = right[j];
            j++;
            k++;
            this.swaps++;
            this.draw();
            await sleep(delay);
        }
    }

    async heapSort(delay, pauseCallback) {
        this.comparisons = 0;
        this.swaps = 0;
        this.sortedIndices = [];
        for (let i = Math.floor(this.array.length / 2) - 1; i >= 0; i--) {
            await this.heapify(this.array.length, i, delay, pauseCallback);
        }
        for (let i = this.array.length - 1; i > 0; i--) {
            if (pauseCallback) await pauseCallback();
            [this.array[0], this.array[i]] = [this.array[i], this.array[0]];
            this.swaps++;
            this.sortedIndices.push(i);
            this.draw();
            await sleep(delay);
            await this.heapify(i, 0, delay, pauseCallback);
        }
        this.sortedIndices.push(0);
        this.highlightIndices([]);
        this.draw();
        return { comparisons: this.comparisons, swaps: this.swaps };
    }

    async heapify(n, i, delay, pauseCallback) {
        let largest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        if (left < n) {
            if (pauseCallback) await pauseCallback();
            this.comparisons++;
            this.highlightIndices([i, left]);
            await sleep(delay);
            if (this.array[left] > this.array[largest]) {
                largest = left;
            }
        }
        if (right < n) {
            if (pauseCallback) await pauseCallback();
            this.comparisons++;
            this.highlightIndices([largest, right]);
            await sleep(delay);
            if (this.array[right] > this.array[largest]) {
                largest = right;
            }
        }
        if (largest !== i) {
            if (pauseCallback) await pauseCallback();
            [this.array[i], this.array[largest]] = [this.array[largest], this.array[i]];
            this.swaps++;
            this.draw();
            await sleep(delay);
            await this.heapify(n, largest, delay, pauseCallback);
        }
    }
}

// Pathfinding Visualizer
class PathfindingVisualizer extends BaseVisualizer {
    constructor(canvas) {
        super(canvas);
        this.grid = [];
        this.rows = 0;
        this.cols = 0;
        this.start = [0, 0];
        this.end = [0, 0];
        this.cellSize = 0;
        this.visited = new Set();
        this.path = [];
        this.frontier = [];
        this.cancelRequested = false;
    }

    setGrid(grid, start, end) {
        const titleHeight = 28; // Match the value in draw()
        const bottomBuffer = 32; // Space below the grid
        this.grid = grid.map(row => [...row]);
        this.rows = grid.length;
        this.cols = grid[0].length;
        this.start = start;
        this.end = end;
        this.cellSize = Math.min(
            this.width / this.cols,
            (this.height - titleHeight - bottomBuffer) / this.rows
        ) - 2;
        this.visited.clear();
        this.path = [];
        this.frontier = [];
        this.draw();
    }

    reset() {
        this.visited.clear();
        this.path = [];
        this.frontier = [];
        this.draw();
    }

    draw() {
        this.clear();
        
        if (this.grid.length === 0) return;

        const titleHeight = 28; // Space for the title
        const offsetX = (this.width - this.cols * this.cellSize) / 2;
        const offsetY = ((this.height - this.rows * this.cellSize) / 2) + titleHeight;

        // Draw title
        this.drawText('Pathfinding Visualization', this.width/2, 28, {
            fontSize: 24,
            textAlign: 'center',
            color: '#333'
        });

        // Draw grid
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const x = offsetX + col * this.cellSize;
                const y = offsetY + row * this.cellSize;
                
                let fillColor = '#ffffff';
                let strokeColor = '#ddd';
                
                // Obstacle
                if (this.grid[row][col] === 1) {
                    fillColor = '#333';
                    strokeColor = '#333';
                }
                // Start
                else if (row === this.start[0] && col === this.start[1]) {
                    fillColor = '#51cf66';
                    strokeColor = '#51cf66';
                }
                // End
                else if (row === this.end[0] && col === this.end[1]) {
                    fillColor = '#ff6b6b';
                    strokeColor = '#ff6b6b';
                }
                // Visited
                else if (this.visited.has(`${row},${col}`)) {
                    fillColor = '#74c0fc';
                    strokeColor = '#74c0fc';
                }
                // Path
                else if (this.path.some(([r, c]) => r === row && c === col)) {
                    fillColor = '#ffd43b';
                    strokeColor = '#ffd43b';
                }
                // Frontier
                else if (this.frontier.some(([r, c]) => r === row && c === col)) {
                    fillColor = '#ffec99';
                    strokeColor = '#ffec99';
                }

                this.drawRect(x, y, this.cellSize, this.cellSize, {
                    fillColor: fillColor,
                    strokeColor: strokeColor,
                    strokeWidth: 1,
                    borderRadius: 2
                });
            }
        }
    }

    async runAlgorithm(algorithm, _, pauseCallback) {
        this.visited.clear();
        this.path = [];
        this.frontier = [];
        this.cancelRequested = false;
        this.paused = false;
        this.pauseCallback = pauseCallback;
        switch (algorithm) {
            case 'dijkstra':
                return await this.dijkstra(pauseCallback);
            case 'astar':
                return await this.astar(pauseCallback);
            case 'bfs':
                return await this.bfs(pauseCallback);
            case 'dfs':
                return await this.dfs(pauseCallback);
            default:
                throw new Error(`Unknown algorithm: ${algorithm}`);
        }
    }

    getNeighbors(row, col) {
        const neighbors = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Up, Down, Left, Right
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (newRow >= 0 && newRow < this.rows && 
                newCol >= 0 && newCol < this.cols && 
                this.grid[newRow][newCol] === 0) {
                neighbors.push([newRow, newCol]);
            }
        }
        
        return neighbors;
    }

    async dijkstra(pauseCallback) {
        const distances = {};
        const previous = {};
        const queue = [];
        
        // Initialize distances
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                distances[`${row},${col}`] = Infinity;
            }
        }
        
        distances[`${this.start[0]},${this.start[1]}`] = 0;
        queue.push([0, this.start[0], this.start[1]]);
        
        let nodesExplored = 0;
        
        while (queue.length > 0) {
            if (this.cancelRequested) return { nodesExplored, pathLength: 0 };
            if (pauseCallback) await pauseCallback();
            queue.sort((a, b) => a[0] - b[0]);
            const [dist, row, col] = queue.shift();
            
            if (this.visited.has(`${row},${col}`)) continue;
            
            this.visited.add(`${row},${col}`);
            nodesExplored++;
            this.draw();
            await sleep(15);
            
            if (row === this.end[0] && col === this.end[1]) {
                // Reconstruct path
                this.path = this.reconstructPath(previous, this.end);
                this.draw();
                return { nodesExplored, pathLength: this.path.length };
            }
            
            for (const [nr, nc] of this.getNeighbors(row, col)) {
                if (!this.visited.has(`${nr},${nc}`)) {
                    const newDist = dist + 1;
                    if (newDist < distances[`${nr},${nc}`]) {
                        distances[`${nr},${nc}`] = newDist;
                        previous[`${nr},${nc}`] = [row, col];
                        queue.push([newDist, nr, nc]);
                        this.frontier.push([nr, nc]);
                    }
                }
            }
        }
        
        return { nodesExplored, pathLength: 0 };
    }

    async astar(pauseCallback) {
        const openSet = new Set([`${this.start[0]},${this.start[1]}`]);
        const cameFrom = {};
        const gScore = {};
        const fScore = {};
        
        gScore[`${this.start[0]},${this.start[1]}`] = 0;
        fScore[`${this.start[0]},${this.start[1]}`] = this.heuristic(this.start, this.end);
        
        let nodesExplored = 0;
        
        while (openSet.size > 0) {
            if (this.cancelRequested) return { nodesExplored, pathLength: 0 };
            if (pauseCallback) await pauseCallback();
            // Find node with lowest fScore
            let current = null;
            let lowestF = Infinity;
            
            for (const pos of openSet) {
                const [row, col] = pos.split(',').map(Number);
                if (fScore[pos] < lowestF) {
                    lowestF = fScore[pos];
                    current = [row, col];
                }
            }
            
            if (!current) break;
            
            const currentPos = `${current[0]},${current[1]}`;
            
            if (current[0] === this.end[0] && current[1] === this.end[1]) {
                // Reconstruct path
                this.path = this.reconstructPath(cameFrom, this.end);
                this.draw();
                return { nodesExplored, pathLength: this.path.length };
            }
            
            openSet.delete(currentPos);
            this.visited.add(currentPos);
            nodesExplored++;
            this.draw();
            await sleep(15);
            
            for (const [nr, nc] of this.getNeighbors(current[0], current[1])) {
                const neighborPos = `${nr},${nc}`;
                if (this.visited.has(neighborPos)) continue;
                
                const tentativeG = gScore[currentPos] + 1;
                
                if (!openSet.has(neighborPos)) {
                    openSet.add(neighborPos);
                } else if (tentativeG >= gScore[neighborPos]) {
                    continue;
                }
                
                cameFrom[neighborPos] = current;
                gScore[neighborPos] = tentativeG;
                fScore[neighborPos] = gScore[neighborPos] + this.heuristic([nr, nc], this.end);
                this.frontier.push([nr, nc]);
            }
        }
        
        return { nodesExplored, pathLength: 0 };
    }

    async bfs(pauseCallback) {
        const queue = [[this.start[0], this.start[1]]];
        const visited = new Set();
        const cameFrom = {};
        
        let nodesExplored = 0;
        
        while (queue.length > 0) {
            if (this.cancelRequested) return { nodesExplored, pathLength: 0 };
            if (pauseCallback) await pauseCallback();
            const [row, col] = queue.shift();
            const pos = `${row},${col}`;
            
            if (visited.has(pos)) continue;
            
            visited.add(pos);
            this.visited.add(pos);
            nodesExplored++;
            this.draw();
            await sleep(15);
            
            if (row === this.end[0] && col === this.end[1]) {
                // Reconstruct path
                this.path = this.reconstructPath(cameFrom, this.end);
                this.draw();
                return { nodesExplored, pathLength: this.path.length };
            }
            
            for (const [nr, nc] of this.getNeighbors(row, col)) {
                const neighborPos = `${nr},${nc}`;
                if (!visited.has(neighborPos)) {
                    queue.push([nr, nc]);
                    cameFrom[neighborPos] = [row, col];
                    this.frontier.push([nr, nc]);
                }
            }
        }
        
        return { nodesExplored, pathLength: 0 };
    }

    async dfs(pauseCallback) {
        const stack = [[this.start[0], this.start[1]]];
        const visited = new Set();
        const cameFrom = {};
        
        let nodesExplored = 0;
        
        while (stack.length > 0) {
            if (this.cancelRequested) return { nodesExplored, pathLength: 0 };
            if (pauseCallback) await pauseCallback();
            const [row, col] = stack.pop();
            const pos = `${row},${col}`;
            
            if (visited.has(pos)) continue;
            
            visited.add(pos);
            this.visited.add(pos);
            nodesExplored++;
            this.draw();
            await sleep(15);
            
            if (row === this.end[0] && col === this.end[1]) {
                // Reconstruct path
                this.path = this.reconstructPath(cameFrom, this.end);
                this.draw();
                return { nodesExplored, pathLength: this.path.length };
            }
            
            for (const [nr, nc] of this.getNeighbors(row, col)) {
                const neighborPos = `${nr},${nc}`;
                if (!visited.has(neighborPos)) {
                    stack.push([nr, nc]);
                    cameFrom[neighborPos] = [row, col];
                    this.frontier.push([nr, nc]);
                }
            }
        }
        
        return { nodesExplored, pathLength: 0 };
    }

    heuristic(a, b) {
        return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]); // Manhattan distance
    }

    reconstructPath(cameFrom, end) {
        const path = [end];
        let current = end;
        
        while (cameFrom[`${current[0]},${current[1]}`]) {
            current = cameFrom[`${current[0]},${current[1]}`];
            path.unshift(current);
        }
        
        return path;
    }
}

// Export classes for use in other modules
window.BaseVisualizer = BaseVisualizer;
window.SortingVisualizer = SortingVisualizer;
window.PathfindingVisualizer = PathfindingVisualizer; 