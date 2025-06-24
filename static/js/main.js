// Main application controller
class AlgoVizApp {
    constructor() {
        this.currentTab = 'sorting';
        this.sortingVisualizer = null;
        this.pathfindingVisualizer = null;
        this.isRunning = false;
        this.isPaused = false;
        this.pauseResolver = null;
        this.currentMode = null; // 'sorting' or 'pathfinding'
        
        this.initializeApp();
    }

    initializeApp() {
        this.setupEventListeners();
        this.initializeVisualizers();
        this.loadInitialData();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Sorting controls
        document.getElementById('array-size').addEventListener('input', (e) => {
            document.getElementById('array-size-value').textContent = e.target.value;
        });

        document.getElementById('sort-speed').addEventListener('input', (e) => {
            document.getElementById('sort-speed-value').textContent = e.target.value;
        });

        document.getElementById('generate-array').addEventListener('click', () => {
            this.generateNewArray();
        });

        document.getElementById('start-sort').addEventListener('click', async () => {
            if (!this.isRunning) {
                this.currentMode = 'sorting';
                await this.startSorting();
            } else {
                this.togglePause();
            }
        });

        document.getElementById('reset-sort').addEventListener('click', () => {
            this.resetSorting();
        });

        // Pathfinding controls
        document.getElementById('grid-size').addEventListener('input', (e) => {
            const size = e.target.value;
            document.getElementById('grid-size-value').textContent = `${size}x${size}`;
        });

        document.getElementById('obstacle-percentage').addEventListener('input', (e) => {
            document.getElementById('obstacle-percentage-value').textContent = `${e.target.value}%`;
        });

        document.getElementById('generate-grid').addEventListener('click', () => {
            this.generateNewGrid();
        });

        document.getElementById('start-pathfinding').addEventListener('click', async () => {
            if (!this.isRunning) {
                this.currentMode = 'pathfinding';
                await this.startPathfinding();
            } else {
                this.togglePause();
            }
        });

        document.getElementById('reset-pathfinding').addEventListener('click', () => {
            this.resetPathfinding();
        });

    }

    initializeVisualizers() {
        // Initialize sorting visualizer
        const sortingCanvas = document.getElementById('sorting-canvas');
        this.sortingVisualizer = new SortingVisualizer(sortingCanvas);

        // Initialize pathfinding visualizer
        const pathfindingCanvas = document.getElementById('pathfinding-canvas');
        this.pathfindingVisualizer = new PathfindingVisualizer(pathfindingCanvas);
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // Reset visualizers when switching tabs
        if (tabName === 'sorting') {
            this.resetSorting();
        } else {
            this.resetPathfinding();
        }
    }

    async loadInitialData() {
        // Generate initial array and grid
        await this.generateNewArray();
        await this.generateNewGrid();
    }

    async generateNewArray() {
        if (this.isRunning) return;

        const size = parseInt(document.getElementById('array-size').value);
        
        try {
            const response = await fetch('/api/generate-array', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    size: size,
                    min_val: 1,
                    max_val: 100
                })
            });

            const data = await response.json();
            console.log('Array data:', data); // Debug log
            
            if (data.success) {
                this.sortingVisualizer.setArray(data.array);
                this.updateSortingStats(0, 0, 0);
            } else {
                console.error('Failed to generate array:', data.error);
            }
        } catch (error) {
            console.error('Error generating array:', error);
        }
    }

    async generateNewGrid() {
        if (this.isRunning) return;

        const size = parseInt(document.getElementById('grid-size').value);
        const obstaclePercentage = parseInt(document.getElementById('obstacle-percentage').value) / 100;
        
        try {
            const response = await fetch('/api/generate-grid', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rows: size,
                    cols: size,
                    obstacle_percentage: obstaclePercentage
                })
            });

            const data = await response.json();
            console.log('Grid data:', data); // Debug log
            
            if (data.success) {
                this.pathfindingVisualizer.setGrid(data.grid, data.start, data.end);
                this.updatePathfindingStats(0, 0, 0);
            } else {
                console.error('Failed to generate grid:', data.error);
            }
        } catch (error) {
            console.error('Error generating grid:', error);
        }
    }

    async startSorting() {
        if (this.isRunning) return;
        this.isPaused = false;
        this.updatePlayPauseButton('sorting');
        const algorithm = document.getElementById('sort-algorithm').value;
        const speed = parseInt(document.getElementById('sort-speed').value);
        this.isRunning = true;
        this.sortingVisualizer.cancelRequested = false;
        this.sortingVisualizer.paused = false;
        this.updateButtonStates(true);
        try {
            const startTime = performance.now();
            const stats = await this.sortingVisualizer.runAlgorithm(algorithm, speed, () => this.waitIfPaused());
            const endTime = performance.now();
            this.updateSortingStats(stats.comparisons, stats.swaps, endTime - startTime);
        } catch (error) {
            console.error('Error during sorting:', error);
        } finally {
            this.isRunning = false;
            this.isPaused = false;
            this.updateButtonStates(false);
            this.updatePlayPauseButton('sorting');
        }
    }

    async startPathfinding() {
        if (this.isRunning) return;
        this.isPaused = false;
        this.updatePlayPauseButton('pathfinding');
        const algorithm = document.getElementById('path-algorithm').value;
        this.isRunning = true;
        this.pathfindingVisualizer.cancelRequested = false;
        this.pathfindingVisualizer.paused = false;
        this.updateButtonStates(true);
        try {
            const startTime = performance.now();
            const stats = await this.pathfindingVisualizer.runAlgorithm(algorithm, null, () => this.waitIfPaused());
            const endTime = performance.now();
            this.updatePathfindingStats(stats.nodesExplored, stats.pathLength, endTime - startTime);
        } catch (error) {
            console.error('Error during pathfinding:', error);
        } finally {
            this.isRunning = false;
            this.isPaused = false;
            this.updateButtonStates(false);
            this.updatePlayPauseButton('pathfinding');
        }
    }

    resetSorting() {
        if (this.isRunning) return;
        this.generateNewArray();
        this.updateSortingStats(0, 0, 0);
    }

    resetPathfinding() {
        if (this.isRunning) return;
        this.generateNewGrid();
        this.updatePathfindingStats(0, 0, 0);
    }

    updateSortingStats(comparisons, swaps, time) {
        document.getElementById('comparisons').textContent = comparisons;
        document.getElementById('swaps').textContent = swaps;
        document.getElementById('sort-time').textContent = `${Math.round(time)}ms`;
    }

    updatePathfindingStats(nodesExplored, pathLength, time) {
        document.getElementById('nodes-explored').textContent = nodesExplored;
        document.getElementById('path-length').textContent = pathLength;
        document.getElementById('path-time').textContent = `${Math.round(time)}ms`;
    }

    updateButtonStates(isRunning) {
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            // Keep play/pause button enabled during running
            if (button.id === 'start-sort' || button.id === 'start-pathfinding') {
                button.disabled = false;
                button.classList.remove('loading');
            } else {
                button.disabled = isRunning;
                if (isRunning) {
                    button.classList.add('loading');
                } else {
                    button.classList.remove('loading');
                }
            }
        });
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.updatePlayPauseButton(this.currentMode);
        if (!this.isPaused && this.pauseResolver) {
            this.pauseResolver();
            this.pauseResolver = null;
        }
    }

    async waitIfPaused() {
        if (this.isPaused) {
            await new Promise(resolve => {
                this.pauseResolver = resolve;
            });
        }
    }

    updatePlayPauseButton(mode) {
        if (mode === 'sorting') {
            const btn = document.getElementById('start-sort');
            if (this.isRunning) {
                if (this.isPaused) {
                    btn.innerHTML = '<i class="fas fa-play"></i> Resume';
                } else {
                    btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
                }
            } else {
                btn.innerHTML = '<i class="fas fa-play"></i> Start Sorting';
            }
        } else if (mode === 'pathfinding') {
            const btn = document.getElementById('start-pathfinding');
            if (this.isRunning) {
                if (this.isPaused) {
                    btn.innerHTML = '<i class="fas fa-play"></i> Resume';
                } else {
                    btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
                }
            } else {
                btn.innerHTML = '<i class="fas fa-play"></i> Find Path';
            }
        }
    }
}

// Utility functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.algoVizApp = new AlgoVizApp();
});

// Export for use in other modules
window.AlgoVizApp = AlgoVizApp;
window.sleep = sleep;
window.getRandomColor = getRandomColor; 