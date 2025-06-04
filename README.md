# 🐍 Snake Battle: Human vs AI

A modern web-based Snake game where you play against an intelligent AI opponent with adjustable difficulty levels.

## Features

- **Human vs AI Gameplay**: Control your green snake while competing against a red AI-controlled snake
- **Adjustable AI Difficulty**: 5 difficulty levels from "Very Easy" to "Very Hard"
  - Easy levels: Simple movement patterns, slower speed
  - Hard levels: Advanced pathfinding (A*), faster speed, collision avoidance
- **Beautiful UI**: Modern gradient design with glassmorphism effects
- **Real-time Scoring**: Track your performance against the AI
- **Multiple Food Items**: 3 food pieces on the field at all times
- **Smart AI Behaviors**:
  - Pathfinding to nearest food
  - Collision avoidance
  - Strategic positioning
  - Difficulty-based decision making

## How to Play

1. Open `index.html` in a web browser
2. Adjust the AI difficulty slider (1-5)
3. Click "Start Game" to begin
4. Use **WASD** or **Arrow Keys** to control your snake (green)
5. Eat golden food to grow and score points
6. Avoid collisions with walls, yourself, or the AI snake
7. Try to outscore the AI!

## Controls

- **W / ↑**: Move Up
- **S / ↓**: Move Down  
- **A / ←**: Move Left
- **D / →**: Move Right
- **Start**: Begin the game
- **Pause**: Pause/Resume gameplay
- **Reset**: Restart the game

## AI Difficulty Levels

1. **Very Easy**: Slow movement, basic AI, lots of random decisions
2. **Easy**: Slow movement, simple pathfinding
3. **Medium**: Moderate speed, basic A* pathfinding
4. **Hard**: Fast movement, advanced pathfinding with collision prediction
5. **Very Hard**: Very fast, smart pathfinding with future collision risk analysis

## Technical Features

- Canvas-based rendering with smooth animations
- Intelligent AI using A* pathfinding algorithm
- Collision detection and prevention
- Responsive design
- Modern CSS with gradients and backdrop filters
- Object-oriented JavaScript architecture

## Game Rules

- Both snakes start at different positions
- 3 food items are always available on the field
- Eating food increases your score and snake length
- Game ends when any snake hits a wall, itself, or the other snake
- Head-to-head collisions result in a tie
- Winner is determined by survival, not just score

Enjoy the challenge of competing against an intelligent AI opponent!