from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import random
import time

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    """Main application page"""
    return render_template('index.html')

@app.route('/api/generate-array', methods=['POST'])
def generate_array():
    """Generate a random array for sorting visualization"""
    try:
        data = request.get_json()
        size = data.get('size', 20)
        min_val = data.get('min_val', 1)
        max_val = data.get('max_val', 100)
        
        # Generate random array
        array = [random.randint(min_val, max_val) for _ in range(size)]
        
        return jsonify({
            'success': True,
            'array': array,
            'size': size
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/generate-grid', methods=['POST'])
def generate_grid():
    """Generate a grid for pathfinding visualization"""
    try:
        data = request.get_json()
        rows = data.get('rows', 15)
        cols = data.get('cols', 15)
        obstacle_percentage = data.get('obstacle_percentage', 0.3)
        
        # Generate grid with random obstacles
        grid = []
        for i in range(rows):
            row = []
            for j in range(cols):
                # Start and end points
                if (i == 0 and j == 0) or (i == rows-1 and j == cols-1):
                    row.append(0)  # Free space
                else:
                    # Random obstacles
                    row.append(1 if random.random() < obstacle_percentage else 0)
            grid.append(row)
        
        return jsonify({
            'success': True,
            'grid': grid,
            'rows': rows,
            'cols': cols,
            'start': [0, 0],
            'end': [rows-1, cols-1]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': time.time(),
        'service': 'AlgoViz API'
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001) 