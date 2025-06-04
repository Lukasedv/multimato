class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.tileCount = {
            x: this.canvas.width / this.gridSize,
            y: this.canvas.height / this.gridSize
        };
        
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameLoop = null;
        
        this.playerSnake = new Snake(5, 5, '#4CAF50', 'player');
        this.aiSnake = new Snake(25, 15, '#FF6B6B', 'ai');
        this.food = [];
        this.foodCount = 3;
        
        this.playerScore = 0;
        this.aiScore = 0;
        this.difficulty = 3;
        
        this.initializeControls();
        this.generateFood();
        this.draw();
    }
    
    initializeControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning) return;
            
            switch(e.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.playerSnake.changeDirection(0, -1);
                    break;
                case 's':
                case 'arrowdown':
                    this.playerSnake.changeDirection(0, 1);
                    break;
                case 'a':
                case 'arrowleft':
                    this.playerSnake.changeDirection(-1, 0);
                    break;
                case 'd':
                case 'arrowright':
                    this.playerSnake.changeDirection(1, 0);
                    break;
            }
        });
        
        // UI Controls
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        
        const difficultySlider = document.getElementById('difficulty');
        difficultySlider.addEventListener('input', (e) => {
            this.difficulty = parseInt(e.target.value);
            this.updateDifficultyLabel();
        });
        
        this.updateDifficultyLabel();
    }
    
    updateDifficultyLabel() {
        const labels = ['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'];
        document.getElementById('difficultyLabel').textContent = labels[this.difficulty];
    }
    
    startGame() {
        if (this.gameRunning) return;
        
        this.gameRunning = true;
        this.gamePaused = false;
        document.getElementById('gameStatus').textContent = 'Game Running!';
        
        const speed = Math.max(80, 180 - (this.difficulty * 20));
        this.gameLoop = setInterval(() => {
            if (!this.gamePaused) {
                this.update();
                this.draw();
            }
        }, speed);
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        document.getElementById('gameStatus').textContent = 
            this.gamePaused ? 'Game Paused' : 'Game Running!';
    }
    
    resetGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        clearInterval(this.gameLoop);
        
        this.playerSnake = new Snake(5, 5, '#4CAF50', 'player');
        this.aiSnake = new Snake(25, 15, '#FF6B6B', 'ai');
        this.playerScore = 0;
        this.aiScore = 0;
        
        this.updateScore();
        this.generateFood();
        document.getElementById('gameStatus').textContent = 'Press Start to begin!';
        document.getElementById('gameOver').style.display = 'none';
        this.draw();
    }
    
    generateFood() {
        this.food = [];
        for (let i = 0; i < this.foodCount; i++) {
            let newFood;
            do {
                newFood = {
                    x: Math.floor(Math.random() * this.tileCount.x),
                    y: Math.floor(Math.random() * this.tileCount.y)
                };
            } while (this.isPositionOccupied(newFood.x, newFood.y));
            
            this.food.push(newFood);
        }
    }
    
    isPositionOccupied(x, y) {
        // Check player snake
        if (this.playerSnake.isPositionInSnake(x, y)) return true;
        
        // Check AI snake
        if (this.aiSnake.isPositionInSnake(x, y)) return true;
        
        // Check existing food
        return this.food.some(f => f.x === x && f.y === y);
    }
    
    update() {
        // Move player snake
        this.playerSnake.move();
        
        // AI decision making
        this.updateAI();
        this.aiSnake.move();
        
        // Check food collisions
        this.checkFoodCollisions();
        
        // Check game over conditions
        this.checkGameOver();
    }
    
    updateAI() {
        const aiHead = this.aiSnake.body[0];
        let bestDirection = this.aiSnake.direction;
        
        // Find nearest food
        let nearestFood = this.findNearestFood(aiHead);
        
        if (nearestFood) {
            if (this.difficulty >= 3) {
                // Use A* pathfinding for medium+ difficulty
                bestDirection = this.findPathToFood(aiHead, nearestFood);
            } else {
                // Simple direction-based AI for easy difficulty
                bestDirection = this.getSimpleDirectionToFood(aiHead, nearestFood);
            }
        }
        
        // Add some randomness for lower difficulties
        if (this.difficulty <= 2 && Math.random() < 0.3) {
            const directions = [
                {x: 0, y: -1}, {x: 0, y: 1}, 
                {x: -1, y: 0}, {x: 1, y: 0}
            ];
            bestDirection = directions[Math.floor(Math.random() * directions.length)];
        }
        
        // Avoid immediate death
        const nextPos = {
            x: aiHead.x + bestDirection.x,
            y: aiHead.y + bestDirection.y
        };
        
        if (this.wouldCauseDeath(nextPos)) {
            bestDirection = this.findSafeDirection(aiHead);
        }
        
        this.aiSnake.changeDirection(bestDirection.x, bestDirection.y);
    }
    
    findNearestFood(position) {
        let nearest = null;
        let minDistance = Infinity;
        
        this.food.forEach(food => {
            const distance = Math.abs(position.x - food.x) + Math.abs(position.y - food.y);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = food;
            }
        });
        
        return nearest;
    }
    
    getSimpleDirectionToFood(head, food) {
        const dx = food.x - head.x;
        const dy = food.y - head.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            return {x: dx > 0 ? 1 : -1, y: 0};
        } else {
            return {x: 0, y: dy > 0 ? 1 : -1};
        }
    }
    
    findPathToFood(start, goal) {
        // Simplified A* pathfinding
        const directions = [
            {x: 0, y: -1}, {x: 0, y: 1}, 
            {x: -1, y: 0}, {x: 1, y: 0}
        ];
        
        let bestDirection = this.aiSnake.direction;
        let bestScore = Infinity;
        
        directions.forEach(dir => {
            if (dir.x === -this.aiSnake.direction.x && dir.y === -this.aiSnake.direction.y) {
                return; // Don't reverse
            }
            
            const nextPos = {
                x: start.x + dir.x,
                y: start.y + dir.y
            };
            
            if (!this.wouldCauseDeath(nextPos)) {
                const distance = Math.abs(nextPos.x - goal.x) + Math.abs(nextPos.y - goal.y);
                const futureCollisionRisk = this.calculateCollisionRisk(nextPos, dir);
                const score = distance + futureCollisionRisk;
                
                if (score < bestScore) {
                    bestScore = score;
                    bestDirection = dir;
                }
            }
        });
        
        return bestDirection;
    }
    
    calculateCollisionRisk(position, direction) {
        let risk = 0;
        const lookahead = Math.min(3, this.difficulty);
        
        for (let i = 1; i <= lookahead; i++) {
            const futurePos = {
                x: position.x + direction.x * i,
                y: position.y + direction.y * i
            };
            
            if (this.wouldCauseDeath(futurePos)) {
                risk += (lookahead - i + 1) * 10;
            }
        }
        
        return risk;
    }
    
    wouldCauseDeath(position) {
        // Check boundaries
        if (position.x < 0 || position.x >= this.tileCount.x || 
            position.y < 0 || position.y >= this.tileCount.y) {
            return true;
        }
        
        // Check collision with player snake
        if (this.playerSnake.isPositionInSnake(position.x, position.y)) {
            return true;
        }
        
        // Check collision with own body (excluding head)
        for (let i = 1; i < this.aiSnake.body.length; i++) {
            if (this.aiSnake.body[i].x === position.x && 
                this.aiSnake.body[i].y === position.y) {
                return true;
            }
        }
        
        return false;
    }
    
    findSafeDirection(head) {
        const directions = [
            {x: 0, y: -1}, {x: 0, y: 1}, 
            {x: -1, y: 0}, {x: 1, y: 0}
        ];
        
        for (let dir of directions) {
            if (dir.x === -this.aiSnake.direction.x && dir.y === -this.aiSnake.direction.y) {
                continue; // Don't reverse
            }
            
            const nextPos = {
                x: head.x + dir.x,
                y: head.y + dir.y
            };
            
            if (!this.wouldCauseDeath(nextPos)) {
                return dir;
            }
        }
        
        return this.aiSnake.direction; // Keep current direction if no safe option
    }
    
    checkFoodCollisions() {
        // Player food collision
        const playerHead = this.playerSnake.body[0];
        for (let i = this.food.length - 1; i >= 0; i--) {
            if (this.food[i].x === playerHead.x && this.food[i].y === playerHead.y) {
                this.playerSnake.grow();
                this.playerScore++;
                this.food.splice(i, 1);
                break;
            }
        }
        
        // AI food collision
        const aiHead = this.aiSnake.body[0];
        for (let i = this.food.length - 1; i >= 0; i--) {
            if (this.food[i].x === aiHead.x && this.food[i].y === aiHead.y) {
                this.aiSnake.grow();
                this.aiScore++;
                this.food.splice(i, 1);
                break;
            }
        }
        
        // Generate new food if needed
        while (this.food.length < this.foodCount) {
            let newFood;
            do {
                newFood = {
                    x: Math.floor(Math.random() * this.tileCount.x),
                    y: Math.floor(Math.random() * this.tileCount.y)
                };
            } while (this.isPositionOccupied(newFood.x, newFood.y));
            
            this.food.push(newFood);
        }
        
        this.updateScore();
    }
    
    checkGameOver() {
        const playerHead = this.playerSnake.body[0];
        const aiHead = this.aiSnake.body[0];
        
        let playerDead = false;
        let aiDead = false;
        
        // Check boundary collisions
        if (playerHead.x < 0 || playerHead.x >= this.tileCount.x || 
            playerHead.y < 0 || playerHead.y >= this.tileCount.y) {
            playerDead = true;
        }
        
        if (aiHead.x < 0 || aiHead.x >= this.tileCount.x || 
            aiHead.y < 0 || aiHead.y >= this.tileCount.y) {
            aiDead = true;
        }
        
        // Check self collision
        if (this.playerSnake.checkSelfCollision()) {
            playerDead = true;
        }
        
        if (this.aiSnake.checkSelfCollision()) {
            aiDead = true;
        }
        
        // Check mutual collision
        if (this.playerSnake.isPositionInSnake(aiHead.x, aiHead.y, 1)) {
            aiDead = true;
        }
        
        if (this.aiSnake.isPositionInSnake(playerHead.x, playerHead.y, 1)) {
            playerDead = true;
        }
        
        // Head-to-head collision
        if (playerHead.x === aiHead.x && playerHead.y === aiHead.y) {
            playerDead = true;
            aiDead = true;
        }
        
        if (playerDead || aiDead) {
            this.endGame(playerDead, aiDead);
        }
    }
    
    endGame(playerDead, aiDead) {
        this.gameRunning = false;
        clearInterval(this.gameLoop);
        
        const gameOverDiv = document.getElementById('gameOver');
        const winnerText = document.getElementById('winnerText');
        const finalScore = document.getElementById('finalScore');
        
        if (playerDead && aiDead) {
            winnerText.textContent = "It's a Tie!";
            winnerText.className = 'winner-text winner-tie';
            document.getElementById('gameStatus').textContent = 'Both snakes crashed!';
        } else if (playerDead) {
            winnerText.textContent = "AI Wins!";
            winnerText.className = 'winner-text winner-ai';
            document.getElementById('gameStatus').textContent = 'Player snake crashed!';
        } else {
            winnerText.textContent = "Player Wins!";
            winnerText.className = 'winner-text winner-player';
            document.getElementById('gameStatus').textContent = 'AI snake crashed!';
        }
        
        finalScore.innerHTML = `Final Score:<br>Player: ${this.playerScore} | AI: ${this.aiScore}`;
        gameOverDiv.style.display = 'block';
    }
    
    updateScore() {
        document.getElementById('playerScore').textContent = this.playerScore;
        document.getElementById('aiScore').textContent = this.aiScore;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 20, 40, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Draw food
        this.food.forEach(food => {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(
                food.x * this.gridSize + this.gridSize / 2,
                food.y * this.gridSize + this.gridSize / 2,
                this.gridSize / 3,
                0,
                2 * Math.PI
            );
            this.ctx.fill();
            
            // Add sparkle effect
            this.ctx.fillStyle = '#FFF';
            this.ctx.beginPath();
            this.ctx.arc(
                food.x * this.gridSize + this.gridSize / 2 - 3,
                food.y * this.gridSize + this.gridSize / 2 - 3,
                2,
                0,
                2 * Math.PI
            );
            this.ctx.fill();
        });
        
        // Draw snakes
        this.playerSnake.draw(this.ctx, this.gridSize);
        this.aiSnake.draw(this.ctx, this.gridSize);
    }
}

class Snake {
    constructor(x, y, color, type) {
        this.body = [{x: x, y: y}];
        this.direction = {x: 1, y: 0};
        this.color = color;
        this.type = type;
        this.nextDirection = {x: 1, y: 0};
    }
    
    changeDirection(x, y) {
        // Prevent reversing into itself
        if (x !== -this.direction.x || y !== -this.direction.y) {
            this.nextDirection = {x: x, y: y};
        }
    }
    
    move() {
        this.direction = this.nextDirection;
        
        const head = {
            x: this.body[0].x + this.direction.x,
            y: this.body[0].y + this.direction.y
        };
        
        this.body.unshift(head);
        this.body.pop();
    }
    
    grow() {
        const tail = {...this.body[this.body.length - 1]};
        this.body.push(tail);
    }
    
    checkSelfCollision() {
        const head = this.body[0];
        for (let i = 1; i < this.body.length; i++) {
            if (head.x === this.body[i].x && head.y === this.body[i].y) {
                return true;
            }
        }
        return false;
    }
    
    isPositionInSnake(x, y, startIndex = 0) {
        for (let i = startIndex; i < this.body.length; i++) {
            if (this.body[i].x === x && this.body[i].y === y) {
                return true;
            }
        }
        return false;
    }
    
    draw(ctx, gridSize) {
        this.body.forEach((segment, index) => {
            ctx.fillStyle = this.color;
            
            if (index === 0) {
                // Draw head with eyes
                ctx.fillRect(
                    segment.x * gridSize + 1,
                    segment.y * gridSize + 1,
                    gridSize - 2,
                    gridSize - 2
                );
                
                // Draw eyes
                ctx.fillStyle = '#FFF';
                const eyeSize = 3;
                const eyeOffset = 5;
                
                if (this.direction.x === 1) { // Moving right
                    ctx.fillRect(segment.x * gridSize + gridSize - eyeOffset, segment.y * gridSize + 4, eyeSize, eyeSize);
                    ctx.fillRect(segment.x * gridSize + gridSize - eyeOffset, segment.y * gridSize + gridSize - 7, eyeSize, eyeSize);
                } else if (this.direction.x === -1) { // Moving left
                    ctx.fillRect(segment.x * gridSize + 2, segment.y * gridSize + 4, eyeSize, eyeSize);
                    ctx.fillRect(segment.x * gridSize + 2, segment.y * gridSize + gridSize - 7, eyeSize, eyeSize);
                } else if (this.direction.y === -1) { // Moving up
                    ctx.fillRect(segment.x * gridSize + 4, segment.y * gridSize + 2, eyeSize, eyeSize);
                    ctx.fillRect(segment.x * gridSize + gridSize - 7, segment.y * gridSize + 2, eyeSize, eyeSize);
                } else { // Moving down
                    ctx.fillRect(segment.x * gridSize + 4, segment.y * gridSize + gridSize - eyeOffset, eyeSize, eyeSize);
                    ctx.fillRect(segment.x * gridSize + gridSize - 7, segment.y * gridSize + gridSize - eyeOffset, eyeSize, eyeSize);
                }
            } else {
                // Draw body with gradient effect
                const gradient = ctx.createRadialGradient(
                    segment.x * gridSize + gridSize / 2,
                    segment.y * gridSize + gridSize / 2,
                    0,
                    segment.x * gridSize + gridSize / 2,
                    segment.y * gridSize + gridSize / 2,
                    gridSize / 2
                );
                
                gradient.addColorStop(0, this.color);
                gradient.addColorStop(1, this.darkenColor(this.color, 0.3));
                
                ctx.fillStyle = gradient;
                ctx.fillRect(
                    segment.x * gridSize + 2,
                    segment.y * gridSize + 2,
                    gridSize - 4,
                    gridSize - 4
                );
            }
        });
    }
    
    darkenColor(color, factor) {
        // Simple color darkening
        const hex = color.replace('#', '');
        const r = Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - factor));
        const g = Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - factor));
        const b = Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - factor));
        
        return `rgb(${r}, ${g}, ${b})`;
    }
}

// Global functions for HTML
function resetGame() {
    game.resetGame();
}

// Initialize game when page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});
