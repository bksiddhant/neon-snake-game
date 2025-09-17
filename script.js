// Modern Snake Game with Flashy Animations
class ModernSnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.levelElement = document.getElementById('level');
        this.gameStateElement = document.getElementById('gameState');
        this.backgroundParticlesContainer = document.getElementById('backgroundParticles');
        // Game configuration
        this.gridSize = 20;
        this.cellSize = 20;
        this.canvas.width = this.gridSize * this.cellSize;
        this.canvas.height = this.gridSize * this.cellSize;
        // Game state
        this.gameState = 'start'; // start, playing, paused, gameOver
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.level = 1;
        this.speed = 150; // ms between moves
        this.baseSpeed = 150;
        this.speedDecrease = 20; // ms to decrease per level
        this.foodsEatenForLevelUp = 5;
        // Snake properties
        this.snake = [];
        this.direction = { x: 1, y: 0 }; // Start moving right
        this.nextDirection = { x: 1, y: 0 };
        this.snakeLength = 3;
        
        // Food properties
        this.food = { x: 0, y: 0 };
        this.powerUp = null;
        this.powerUpTypes = [
            { type: 'speedBoost', duration: 5000, color: '#FF57AE', glow: '#FF57AE' },
            { type: 'shrink', duration: 0, color: '#57D9FF', glow: '#57D9FF' },
            { type: 'invincibility', duration: 8000, color: '#FFD166', glow: '#FFD166' }
        ];
        
        // Particle system
        this.particles = [];
        this.eatParticles = [];
        this.levelUpParticles = [];
        
        // Game loop
        this.gameLoopId = null;
        this.lastRender = 0;
        this.powerUpActive = false;
        this.powerUpEndTime = 0;
        this.powerUpType = '';
        // Difficulty settings
        this.difficulty = 'medium'; // easy, medium, hard
        this.difficultySettings = {
            easy: { initialSpeed: 200, gridSize: 20 },
            medium: { initialSpeed: 150, gridSize: 20 },
            hard: { initialSpeed: 100, gridSize: 25 }
        };
        // Theme settings
        this.theme = 'modern'; // modern, neon, cyberpunk, retro
        this.themes = {
            modern: {
                background: '#0f0f1a',
                snakeBody: '#00ff88',
                snakeHead: '#00cc66',
                food: '#ff4d88',
                wall: '#333344',
                powerUp: '#ffcc00',
                neonGlow: 'rgba(0, 255, 136, 0.7)'
            },
            neon: {
                background: '#000000',
                snakeBody: '#39ff14',
                snakeHead: '#00ff00',
                food: '#ff10f0',
                wall: '#ffffff',
                powerUp: '#ffff00',
                neonGlow: 'rgba(57, 255, 20, 0.8)'
            },
            cyberpunk: {
                background: '#100025',
                snakeBody: '#ff2a6d',
                snakeHead: '#ff006e',
                food: '#05d9e8',
                wall: '#fbdd7e',
                powerUp: '#f3f3f3',
                neonGlow: 'rgba(255, 42, 109, 0.8)'
            },
            retro: {
                background: '#1a1a1a',
                snakeBody: '#00ff00',
                snakeHead: '#00aa00',
                food: '#ff0000',
                wall: '#ffffff',
                powerUp: '#ffff00',
                neonGlow: 'rgba(0, 255, 0, 0.6)'
            }
        };
        // Audio context
        this.audioContext = null;
        this.initAudio();
        
        // Initialize background animations
        this.initBackgroundAnimations();
        // Initialize the game
        this.init();
    }
    
    init() {
        // Set up event listeners
        this.setupEventListeners();
        // Load high score
        this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        this.updateScoreDisplay();
        
        // Show start screen
        this.showStartScreen();
    }
    
    initAudio() {
        try {
            // Initialize Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    initBackgroundAnimations() {
        // Create floating background particles
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.width = `${Math.random() * 5 + 2}px`;
            particle.style.height = particle.style.width;
            particle.style.backgroundColor = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            // Use the 'float' animation defined in the CSS, but with varied duration and delay
            particle.style.animation = `float ${Math.random() * 20 + 15}s linear infinite`;
            particle.style.animationDelay = `${Math.random() * 15}s`;
            
            this.backgroundParticlesContainer.appendChild(particle);
        }
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.gameState === 'playing') {
                switch(e.key) {
                    case 'ArrowUp':
                    case 'w':
                    case 'W':
                        if (this.direction.y === 0) {
                            this.nextDirection = { x: 0, y: -1 };
                            this.createDirectionParticles('up');
                        }
                        break;
                    case 'ArrowDown':
                    case 's':
                    case 'S':
                        if (this.direction.y === 0) {
                            this.nextDirection = { x: 0, y: 1 };
                            this.createDirectionParticles('down');
                        }
                        break;
                    case 'ArrowLeft':
                    case 'a':
                    case 'A':
                        if (this.direction.x === 0) {
                            this.nextDirection = { x: -1, y: 0 };
                            this.createDirectionParticles('left');
                        }
                        break;
                    case 'ArrowRight':
                    case 'd':
                    case 'D':
                        if (this.direction.x === 0) {
                            this.nextDirection = { x: 1, y: 0 };
                            this.createDirectionParticles('right');
                        }
                        break;
                    case ' ':
                        this.togglePause();
                        break;
                }
            } else if (this.gameState === 'start' && (e.key === 'Enter' || e.key === ' ')) {
                this.startGame();
            } else if (this.gameState === 'gameOver' && (e.key === 'Enter' || e.key === ' ')) {
                this.restartGame();
            }
        });
        // Touch controls for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.gameState !== 'playing') return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            // Determine swipe direction based on which axis had the greater movement
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal swipe
                if (dx > 0 && this.direction.x === 0) {
                    this.nextDirection = { x: 1, y: 0 };
                    this.createDirectionParticles('right');
                } else if (dx < 0 && this.direction.x === 0) {
                    this.nextDirection = { x: -1, y: 0 };
                    this.createDirectionParticles('left');
                }
            } else {
                // Vertical swipe
                if (dy > 0 && this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: 1 };
                    this.createDirectionParticles('down');
                } else if (dy < 0 && this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: -1 };
                    this.createDirectionParticles('up');
                }
            }
        }, { passive: false });

        // Button controls
        document.getElementById('startButton')?.addEventListener('click', () => {
            if (this.gameState === 'start' || this.gameState === 'gameOver') this.startGame();
        });
        document.getElementById('restartButton')?.addEventListener('click', () => {
            this.restartGame();
        });
        document.getElementById('pauseButton')?.addEventListener('click', () => {
            this.togglePause();
        });
        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });
        // Difficulty selector
        document.getElementById('difficultySelector')?.addEventListener('change', (e) => {
            this.difficulty = e.target.value;
        });
    }
    
    createDirectionParticles(direction) {
        // Create particles that show direction change
        const head = this.snake[0];
        const centerX = head.x * this.cellSize + this.cellSize / 2;
        const centerY = head.y * this.cellSize + this.cellSize / 2;
        // Create 5-10 particles in the opposite direction of movement
        const particleCount = 5 + Math.floor(Math.random() * 5);
        const color = this.themes[this.theme].snakeBody;
        
        for (let i = 0; i < particleCount; i++) {
            let vx, vy;
            switch(direction) {
                case 'up':
                    vx = (Math.random() - 0.5) * 4;
                    vy = Math.random() * 3 + 2; // Downward
                    break;
                case 'down':
                    vx = (Math.random() - 0.5) * 4;
                    vy = -(Math.random() * 3 + 2); // Upward
                    break;
                case 'left':
                    vx = Math.random() * 3 + 2; // Rightward
                    vy = (Math.random() - 0.5) * 4;
                    break;
                case 'right':
                    vx = -(Math.random() * 3 + 2); // Leftward
                    vy = (Math.random() - 0.5) * 4;
                    break;
            }
            
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: vx,
                vy: vy,
                radius: Math.random() * 3 + 2,
                color: color,
                alpha: 1,
                life: 30 + Math.random() * 20
            });
        }
    }
    
    playSound(frequency, duration = 0.1, type = 'sine') {
        if (!this.audioContext) return;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        gainNode.gain.value = 0.1;
        gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
        // Mobile haptics
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    }
    
    playEatSound() {
        if (!this.audioContext) return;
        // Create a more complex "eat" sound with multiple oscillators
        const frequencies = [523, 659, 784]; // C5, E5, G5
        
        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
        
            oscillator.type = 'sine';
            oscillator.frequency.value = freq;
            
            gainNode.gain.value = 0.05;
            gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + 0.1 + index * 0.05);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start(this.audioContext.currentTime + index * 0.02);
            oscillator.stop(this.audioContext.currentTime + 0.15 + index * 0.05);
        });
        // Mobile haptics
        if ('vibrate' in navigator) {
            navigator.vibrate([20, 10, 20]);
        }
    }
    
    playLevelUpSound() {
        if (!this.audioContext) return;
        // Create a rising arpeggio for level up
        const frequencies = [261, 329, 392, 523, 659, 784, 1046]; // C4 to C6
        
        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
        
            oscillator.type = 'sine';
            oscillator.frequency.value = freq;
            
            gainNode.gain.value = 0.08;
            gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + 0.1 + index * 0.05);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start(this.audioContext.currentTime + index * 0.05);
            oscillator.stop(this.audioContext.currentTime + 0.15 + index * 0.05);
        });
        // Mobile haptics
        if ('vibrate' in navigator) {
            navigator.vibrate([50, 30, 50, 30, 50]);
        }
    }
    
    playGameOverSound() {
        if (!this.audioContext) return;
        // Create a descending "fail" sound
        const context = this.audioContext;
        const startTime = context.currentTime;
        
        // Low tone that fades out
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(220, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(55, startTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.5);
        
        // Mobile haptics
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
    }
    
    toggleTheme() {
        const themes = Object.keys(this.themes);
        const currentIndex = themes.indexOf(this.theme);
        this.theme = themes[(currentIndex + 1) % themes.length];
        // Update CSS variables for theme
        document.documentElement.style.setProperty('--background-color', this.themes[this.theme].background);
        document.documentElement.style.setProperty('--snake-body-color', this.themes[this.theme].snakeBody);
        document.documentElement.style.setProperty('--snake-head-color', this.themes[this.theme].snakeHead);
        document.documentElement.style.setProperty('--food-color', this.themes[this.theme].food);
        document.documentElement.style.setProperty('--wall-color', this.themes[this.theme].wall);
        document.documentElement.style.setProperty('--powerup-color', this.themes[this.theme].powerUp);
        document.documentElement.style.setProperty('--neon-glow', `0 0 20px ${this.themes[this.theme].neonGlow}`);
        // Save theme preference
        localStorage.setItem('snakeTheme', this.theme);
    }
    
    showStartScreen() {
        this.gameState = 'start';
        this.gameStateElement.textContent = '';
        
        // Create start screen overlay
        const startScreen = document.createElement('div');
        startScreen.className = 'start-screen';
        startScreen.innerHTML = `
            <h1 class="game-title">NEON SNAKE</h1>
            <p class="instructions">
                Use <strong>ARROW KEYS</strong> or <strong>WASD</strong> to move<br>
                Collect food to grow and earn points<br>
                Avoid hitting walls and yourself!<br>
                Watch out for special power-ups!
            </p>
            <button class="start-button" id="mainStartButton">START GAME</button>
        `;
        this.canvas.parentNode.appendChild(startScreen);
        
        // Add event listener to the start button
        document.getElementById('mainStartButton').addEventListener('click', () => {
            this.startGame();
        });
    }
    
    startGame() {
        // Remove start screen if it exists
        const startScreen = document.querySelector('.start-screen');
        if (startScreen) {
            startScreen.remove();
        }
        
        // Apply difficulty settings
        const settings = this.difficultySettings[this.difficulty];
        this.speed = settings.initialSpeed;
        this.baseSpeed = settings.initialSpeed;
        
        // Reset game state
        this.score = 0;
        this.level = 1;
        this.gameState = 'playing';
        this.powerUpActive = false;
        this.powerUp = null;
        this.particles = [];
        this.eatParticles = [];
        // Initialize snake in the middle of the board
        const startX = Math.floor(this.gridSize / 2);
        const startY = Math.floor(this.gridSize / 2);
        
        this.snake = [];
        for (let i = 0; i < this.snakeLength; i++) {
            this.snake.push({ x: startX - i, y: startY });
        }
        
        // Set initial direction (right)
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        
        // Generate first food
        this.generateFood();
        // Update display
        this.updateScoreDisplay();
        this.gameStateElement.textContent = '';
        
        // Start game loop
        this.lastRender = performance.now();
        this.gameLoop();
        
        // Play start sound
        this.playSound(440, 0.2);
        this.playSound(660, 0.2);
    }
    
    gameLoop(timestamp) {
        if (this.gameState !== 'playing') return;
        const elapsed = timestamp - this.lastRender;
        
        if (elapsed > this.speed) {
            this.lastRender = timestamp;
            this.update();
            this.draw();
        }
        
        this.gameLoopId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }
    
    update() {
        // Update particles
        this.updateParticles();
        // Update direction
        this.direction = { ...this.nextDirection };
        // Calculate new head position
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // Check for wall collisions (unless invincibility is active)
        if (!this.powerUpActive || this.powerUpType !== 'invincibility') {
            if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
                this.gameOver();
                return;
            }
        } else {
            // Wrap around for invincibility mode
            if (head.x < 0) head.x = this.gridSize - 1;
            if (head.x >= this.gridSize) head.x = 0;
            if (head.y < 0) head.y = this.gridSize - 1;
            if (head.y >= this.gridSize) head.y = 0;
        }
        
        // Check for self collision (unless invincibility is active)
        if (!this.powerUpActive || this.powerUpType !== 'invincibility') {
            for (let i = 0; i < this.snake.length; i++) {
                if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                    this.gameOver();
                    return;
                }
            }
        }
        
        // Add new head
        this.snake.unshift(head);
        // Check if snake ate food
        if (head.x === this.food.x && head.y === this.food.y) {
            // Play eat sound
            this.playEatSound();
            // Create explosion particles
            this.createEatParticles(head.x, head.y);
            // Increase score
            this.score += 10;
            this.updateScoreDisplay();
            
            // Check for level up
            if (this.score > 0 && this.score % (this.foodsEatenForLevelUp * 10) === 0) {
                this.levelUp();
            }
            
            // Generate new food
            this.generateFood();
            // Maybe generate a power-up
            if (Math.random() < 0.15) { // 15% chance
                this.generatePowerUp();
            }
        } else {
            // Remove tail if no food was eaten
            this.snake.pop();
        }
        
        // Check if snake ate power-up
        if (this.powerUp && head.x === this.powerUp.x && head.y === this.powerUp.y) {
            this.activatePowerUp(this.powerUp.type);
            this.powerUp = null;
        }
        
        // Check if power-up duration has expired
        if (this.powerUpActive && Date.now() > this.powerUpEndTime) {
            this.deactivatePowerUp();
        }
    }
    
    updateParticles() {
        // Update regular particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.02;
            p.life--;
            if (p.life <= 0 || p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Update eat particles
        for (let i = this.eatParticles.length - 1; i >= 0; i--) {
            const p = this.eatParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.98; // friction
            p.vy *= 0.98;
            p.vy += 0.1; // gravity
            p.alpha -= 0.01;
            p.scale += 0.01;
            p.life--;
            
            if (p.life <= 0 || p.alpha <= 0) {
                this.eatParticles.splice(i, 1);
            }
        }
        
        // Update level up particles
        for (let i = this.levelUpParticles.length - 1; i >= 0; i--) {
            const p = this.levelUpParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.99; // slight friction
            p.vy *= 0.99;
            p.alpha -= 0.005;
            p.size += 0.05;
            p.life--;
            
            if (p.life <= 0 || p.alpha <= 0) {
                this.levelUpParticles.splice(i, 1);
            }
        }
    }
    
    createEatParticles(x, y) {
        // Create explosion effect at food position
        const centerX = x * this.cellSize + this.cellSize / 2;
        const centerY = y * this.cellSize + this.cellSize / 2;
        const color = this.themes[this.theme].food;
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            
            this.eatParticles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                alpha: 1,
                scale: 1,
                life: 50 + Math.random() * 30
            });
        }
    }
    
    createLevelUpParticles() {
        // Create particles that emanate from the entire snake
        const color = this.themes[this.theme].powerUp;
        this.snake.forEach(segment => {
            const centerX = segment.x * this.cellSize + this.cellSize / 2;
            const centerY = segment.y * this.cellSize + this.cellSize / 2;
            
            for (let i = 0; i < 3; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 3 + 1;
                
                this.levelUpParticles.push({
                    x: centerX,
                    y: centerY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: color,
                    alpha: 1,
                    size: Math.random() * 3 + 2,
                    life: 100 + Math.random() * 50
                });
            }
        });
    }
    
    draw() {
        // Clear canvas with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, this.adjustColorBrightness(this.themes[this.theme].background, 10));
        gradient.addColorStop(1, this.themes[this.theme].background);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // Draw grid with subtle lines
        this.ctx.strokeStyle = this.themes[this.theme].wall;
        this.ctx.lineWidth = 0.5;
        this.ctx.globalAlpha = 0.2;
        
        for (let i = 0; i <= this.gridSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize, 0);
            this.ctx.lineTo(i * this.cellSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.cellSize);
            this.ctx.lineTo(this.canvas.width, i * this.cellSize);
            this.ctx.stroke();
        }
        
        // Reset alpha
        this.ctx.globalAlpha = 1.0;
        // Draw particles
        this.drawParticles();
        // Draw snake with gradient effect
        this.drawSnake();
        // Draw food with advanced animation
        this.drawFood();
        // Draw power-up if exists
        if (this.powerUp) {
            this.drawPowerUp();
        }
    }
    
    drawParticles() {
        // Draw regular particles
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw eat particles
        this.eatParticles.forEach(p => {
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            
            // Create glow effect
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 10 * p.scale;
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.scale * 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Reset shadow
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
        });
        // Draw level up particles
        this.levelUpParticles.forEach(p => {
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            
            // Create glow effect
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 15;
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Reset shadow
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
        });
        // Reset alpha
        this.ctx.globalAlpha = 1.0;
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            const segmentSize = this.cellSize - 2;
            const x = segment.x * this.cellSize + 1;
            const y = segment.y * this.cellSize + 1;
            
            if (index === 0) {
                // Draw head with gradient
                const headGradient = this.ctx.createRadialGradient(
                    x + segmentSize/2, y + segmentSize/2, 0,
                    x + segmentSize/2, y + segmentSize/2, segmentSize
                );
                headGradient.addColorStop(0, this.adjustColorBrightness(this.themes[this.theme].snakeHead, 20));
                headGradient.addColorStop(1, this.themes[this.theme].snakeHead);
                
                this.ctx.fillStyle = headGradient;
                
                // Add glow effect for head
                if (this.powerUpActive && this.powerUpType === 'invincibility') {
                    this.ctx.shadowColor = this.themes[this.theme].powerUp;
                    this.ctx.shadowBlur = 20;
                } else {
                    this.ctx.shadowColor = this.themes[this.theme].snakeHead;
                    this.ctx.shadowBlur = 10;
                }
                
                // Draw rounded rectangle for modern look
                this.drawRoundedRect(x, y, segmentSize, segmentSize, 4);
                // Reset shadow
                this.ctx.shadowColor = 'transparent';
                this.ctx.shadowBlur = 0;
                
                // Draw eyes with glow
                this.drawModernSnakeEyes(segment);
            } else {
                // Draw body with gradient
                const bodyGradient = this.ctx.createRadialGradient(
                    x + segmentSize/2, y + segmentSize/2, 0,
                    x + segmentSize/2, y + segmentSize/2, segmentSize
                );
                const brightness = Math.max(0, 100 - (index / this.snake.length) * 50);
                bodyGradient.addColorStop(0, this.adjustColorBrightness(this.themes[this.theme].snakeBody, brightness));
                bodyGradient.addColorStop(1, this.themes[this.theme].snakeBody);
                
                this.ctx.fillStyle = bodyGradient;
                // Add subtle glow
                this.ctx.shadowColor = this.themes[this.theme].snakeBody;
                this.ctx.shadowBlur = 5 * (1 - index / this.snake.length);
                
                // Draw rounded rectangle
                this.drawRoundedRect(x, y, segmentSize, segmentSize, 3);
                // Reset shadow
                this.ctx.shadowColor = 'transparent';
                this.ctx.shadowBlur = 0;
            }
        });
    }
    
    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawModernSnakeEyes(head) {
        const eyeSize = this.cellSize / 5;
        const eyeOffset = this.cellSize / 3.5;
        const pupilSize = eyeSize / 2;
        // Eye color based on theme
        const eyeColor = this.adjustColorBrightness(this.themes[this.theme].background, -20);
        const pupilColor = '#FFFFFF';
        
        // Position eyes based on direction with animation
        const blinkFactor = 0.8 + 0.2 * Math.sin(Date.now() / 500);
        if (this.direction.x === 1) { // Right
            // Left eye
            this.drawEye(head.x * this.cellSize + this.cellSize - eyeOffset - eyeSize, head.y * this.cellSize + eyeOffset, eyeSize * blinkFactor, eyeColor, pupilColor, 0.3);
            // Right eye
            this.drawEye(head.x * this.cellSize + this.cellSize - eyeOffset - eyeSize, head.y * this.cellSize + this.cellSize - eyeOffset - eyeSize, eyeSize * blinkFactor, eyeColor, pupilColor, 0.7);
        } else if (this.direction.x === -1) { // Left
            // Left eye
            this.drawEye(head.x * this.cellSize + eyeOffset, head.y * this.cellSize + eyeOffset, eyeSize * blinkFactor, eyeColor, pupilColor, 0.3);
            // Right eye
            this.drawEye(head.x * this.cellSize + eyeOffset, head.y * this.cellSize + this.cellSize - eyeOffset - eyeSize, eyeSize * blinkFactor, eyeColor, pupilColor, 0.7);
        } else if (this.direction.y === -1) { // Up
            // Left eye
            this.drawEye(head.x * this.cellSize + eyeOffset, head.y * this.cellSize + eyeOffset, eyeSize * blinkFactor, eyeColor, pupilColor, 0.3);
            // Right eye
            this.drawEye(head.x * this.cellSize + this.cellSize - eyeOffset - eyeSize, head.y * this.cellSize + eyeOffset, eyeSize * blinkFactor, eyeColor, pupilColor, 0.7);
        } else if (this.direction.y === 1) { // Down
            // Left eye
            this.drawEye(head.x * this.cellSize + eyeOffset, head.y * this.cellSize + this.cellSize - eyeOffset - eyeSize, eyeSize * blinkFactor, eyeColor, pupilColor, 0.3);
            // Right eye
            this.drawEye(head.x * this.cellSize + this.cellSize - eyeOffset - eyeSize, head.y * this.cellSize + this.cellSize - eyeOffset - eyeSize, eyeSize * blinkFactor, eyeColor, pupilColor, 0.7);
        }
    }
    
    drawEye(x, y, size, color, pupilColor, pupilOffset) {
        // Draw eye
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        this.ctx.fill();
        // Draw pupil with offset based on position (for cuteness)
        this.ctx.fillStyle = pupilColor;
        this.ctx.beginPath();
        this.ctx.arc(
            x + size/2 + (pupilOffset - 0.5) * size/3, 
            y + size/2, 
            size/4, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // Add reflection
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.beginPath();
        this.ctx.arc(
            x + size/2 + (pupilOffset - 0.5) * size/3 - size/8, 
            y + size/2 - size/8, 
            size/10, 0, Math.PI * 2
        );
        this.ctx.fill();
    }
    
    drawFood() {
        // Pulsing and rotating animation
        const pulseFactor = 0.8 + 0.2 * Math.sin(Date.now() / 200);
        const rotateAngle = (Date.now() / 1000) % (Math.PI * 2);
        
        this.ctx.save();
        const foodX = this.food.x * this.cellSize + this.cellSize / 2;
        const foodY = this.food.y * this.cellSize + this.cellSize / 2;
        this.ctx.translate(foodX, foodY);
        this.ctx.rotate(rotateAngle);
        
        // Create gradient for food
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, (this.cellSize - 4) / 2 * pulseFactor);
        gradient.addColorStop(0, this.adjustColorBrightness(this.themes[this.theme].food, 30));
        gradient.addColorStop(0.7, this.themes[this.theme].food);
        gradient.addColorStop(1, this.adjustColorBrightness(this.themes[this.theme].food, -20));
        
        this.ctx.fillStyle = gradient;
        // Add intense glow effect
        this.ctx.shadowColor = this.themes[this.theme].food;
        this.ctx.shadowBlur = 20 * pulseFactor;
        
        // Draw star shape
        this.ctx.beginPath();
        const outerRadius = (this.cellSize - 4) / 2 * pulseFactor;
        const innerRadius = outerRadius / 2;
        for (let i = 0; i < 10; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI * i) / 5;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        
        // Reset shadow and transform
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
        
        // Add floating effect
        this.ctx.save();
        this.ctx.translate(foodX, foodY + 5 * Math.sin(Date.now() / 300));
        this.ctx.globalAlpha = 0.3;
        // Draw floating rings
        for (let i = 1; i <= 2; i++) {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, outerRadius + i * 5, 0, Math.PI * 2);
            this.ctx.strokeStyle = this.themes[this.theme].food;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        this.ctx.restore();
        this.ctx.globalAlpha = 1.0;
    }
    
    drawPowerUp() {
        const powerUpData = this.powerUpTypes.find(p => p.type === this.powerUp.type);
        if (!powerUpData) return;

        const pulseFactor = 0.9 + 0.1 * Math.sin(Date.now() / 150);
        const floatFactor = 3 * Math.sin(Date.now() / 250);
        
        this.ctx.save();
        const centerX = this.powerUp.x * this.cellSize + this.cellSize / 2;
        const centerY = this.powerUp.y * this.cellSize + this.cellSize / 2 + floatFactor;
        
        this.ctx.translate(centerX, centerY);
        // Create gradient for power-up
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, (this.cellSize - 4) / 2 * pulseFactor);
        gradient.addColorStop(0, this.adjustColorBrightness(powerUpData.color, 30));
        gradient.addColorStop(0.7, powerUpData.color);
        gradient.addColorStop(1, this.adjustColorBrightness(powerUpData.color, -20));
        
        this.ctx.fillStyle = gradient;
        // Add glow effect
        this.ctx.shadowColor = powerUpData.glow;
        this.ctx.shadowBlur = 15 * pulseFactor;
        
        // Draw shape based on power-up type
        this.ctx.beginPath();
        switch(this.powerUp.type) {
            case 'speedBoost':
                // Lightning bolt
                this.drawLightningBolt(0, 0, (this.cellSize - 4) / 2 * pulseFactor);
                break;
            case 'shrink':
                // A different shape, like a simple circle
                this.ctx.arc(0, 0, (this.cellSize - 6) / 2 * pulseFactor, 0, Math.PI * 2);
                break;
            case 'invincibility':
                // Star
                this.drawStar(0, 0, (this.cellSize - 4) / 2 * pulseFactor, 5, 2);
                break;
        }
        
        this.ctx.fill();
        // Reset shadow and transform
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }
    
    drawLightningBolt(x, y, size) {
        this.ctx.moveTo(x + size * -0.2, y - size);
        this.ctx.lineTo(x + size * 0.4, y);
        this.ctx.lineTo(x + size * 0.1, y);
        this.ctx.lineTo(x + size * 0.6, y + size);
        this.ctx.lineTo(x - size * 0.4, y - size * -0.1);
        this.ctx.lineTo(x - size * 0.1, y - size * -0.1);
        this.ctx.closePath();
    }

    drawStar(x, y, size, points = 5, innerRatio = 0.5) {
        const outerRadius = size;
        theadInnerRadius = size * innerRatio;
        let angle = Math.PI / points;

        this.ctx.moveTo(x, y - outerRadius);
        for (let i = 0; i < 2 * points; i++) {
            const radius = (i & 1) === 0 ? outerRadius : theadInnerRadius;
            const pointX = x + radius * Math.sin(angle);
            const pointY = y - radius * Math.cos(angle);
            this.ctx.lineTo(pointX, pointY);
            angle += Math.PI / points;
        }
        this.ctx.closePath();
    }
    
    generateFood() {
        let newFood;
        let overlap;
        
        do {
            overlap = false;
            newFood = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
            // Check if food overlaps with snake
            for (let segment of this.snake) {
                if (segment.x === newFood.x && segment.y === newFood.y) {
                    overlap = true;
                    break;
                }
            }
            
            // Check if food overlaps with power-up
            if (this.powerUp && this.powerUp.x === newFood.x && this.powerUp.y === newFood.y) {
                overlap = true;
            }
        } while (overlap);
        
        this.food = newFood;
    }
    
    generatePowerUp() {
        let newPowerUp;
        let overlap;
        
        do {
            overlap = false;
            newPowerUp = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize),
                type: this.powerUpTypes[Math.floor(Math.random() * this.powerUpTypes.length)].type
            };
            
            // Check if power-up overlaps with snake
            for (let segment of this.snake) {
                if (segment.x === newPowerUp.x && segment.y === newPowerUp.y) {
                    overlap = true;
                    break;
                }
            }
            
            // Check if power-up overlaps with food
            if (this.food.x === newPowerUp.x && this.food.y === newPowerUp.y) {
                overlap = true;
            }
        } while (overlap);
        
        this.powerUp = newPowerUp;
    }
    
    activatePowerUp(type) {
        const powerUpData = this.powerUpTypes.find(p => p.type === type);
        if (!powerUpData) return;

        this.powerUpType = type;
        this.powerUpActive = true;
        this.powerUpEndTime = Date.now() + powerUpData.duration;
        // Create activation particles
        const head = this.snake[0];
        const centerX = head.x * this.cellSize + this.cellSize / 2;
        const centerY = head.y * this.cellSize + this.cellSize / 2;
        
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 3;
            
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 4 + 2,
                color: powerUpData.color,
                alpha: 1,
                life: 40 + Math.random() * 30
            });
        }
        
        // Apply power-up effects
        switch(type) {
            case 'speedBoost':
                this.speed = Math.max(50, this.speed - 50);
                this.playSound(880, 0.2); // A5 note
                break;
            case 'shrink':
                // Remove half the snake's length (but keep at least 3 segments)
                const removeCount = Math.floor(this.snake.length / 2);
                if (this.snake.length - removeCount >= 3) {
                   for (let i = 0; i < removeCount; i++) {
                        this.snake.pop();
                    }
                }
                this.playSound(659, 0.2); // E5 note
                // Since this is instant, deactivate immediately
                this.powerUpActive = false;
                break;
            case 'invincibility':
                this.playSound(784, 0.2); // G5 note
                break;
        }
    }
    
    deactivatePowerUp() {
        const oldPowerUpType = this.powerUpType;
        this.powerUpActive = false;
        this.powerUpType = '';
        
        // Create deactivation particles
        const head = this.snake[0];
        const centerX = head.x * this.cellSize + this.cellSize / 2;
        const centerY = head.y * this.cellSize + this.cellSize / 2;
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 2;
            
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 3 + 1,
                color: this.themes[this.theme].snakeHead,
                alpha: 1,
                life: 30 + Math.random() * 20
            });
        }
        
        // Reset any temporary effects
        if (oldPowerUpType === 'speedBoost') {
            this.speed = this.baseSpeed - (this.level - 1) * this.speedDecrease;
        }
    }
    
    levelUp() {
        this.level++;
        this.speed = Math.max(50, this.baseSpeed - (this.level - 1) * this.speedDecrease);
        // Create level up animation on screen
        this.createLevelUpAnimation();
        this.createLevelUpParticles();
        
        // Play level up sound
        this.playLevelUpSound();
        // Update display
        this.updateScoreDisplay();
    }
    
    createLevelUpAnimation() {
        // Create level up text overlay
        const levelUpElement = document.createElement('div');
        levelUpElement.className = 'level-up-animation';
        levelUpElement.textContent = `LEVEL ${this.level}`;
        document.querySelector('.game-container').appendChild(levelUpElement);
        
        // Remove after animation completes
        setTimeout(() => {
            if (levelUpElement.parentNode) {
                levelUpElement.parentNode.removeChild(levelUpElement);
            }
        }, 1000);
    }
    
    updateScoreDisplay() {
        this.scoreElement.textContent = this.score;
        this.highScoreElement.textContent = this.highScore;
        this.levelElement.textContent = this.level;
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.gameStateElement.textContent = 'PAUSED';
            cancelAnimationFrame(this.gameLoopId);
            this.playSound(330, 0.1); // E4 note
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.gameStateElement.textContent = '';
            this.lastRender = performance.now();
            this.gameLoop();
            this.playSound(440, 0.1); // A4 note
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        cancelAnimationFrame(this.gameLoopId);
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
        }
        
        // Play game over sound
        this.playGameOverSound();
        // Show game over screen
        this.showGameOverScreen();
    }
    
    showGameOverScreen() {
        // Create game over screen overlay
        const gameOverScreen = document.createElement('div');
        gameOverScreen.className = 'game-over-screen';
        gameOverScreen.innerHTML = `
            <h1 class="game-over-title">GAME OVER</h1>
            <div class="score-display">Final Score: ${this.score}</div>
            <div class="score-display">High Score: ${this.highScore}</div>
            <div class="score-display">Level Reached: ${this.level}</div>
            <button class="restart-button" id="mainRestartButton">PLAY AGAIN</button>
        `;
        this.canvas.parentNode.appendChild(gameOverScreen);
        
        // Add event listener to the restart button
        document.getElementById('mainRestartButton').addEventListener('click', () => {
            this.restartGame();
        });
    }
    
    restartGame() {
        // Remove game over screen if it exists
        const gameOverScreen = document.querySelector('.game-over-screen');
        if (gameOverScreen) {
            gameOverScreen.remove();
        }
        
        // Cancel any existing animation frame
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
        }
        
        // Reset power-up if active
        if (this.powerUpActive) {
            this.deactivatePowerUp();
        }
        
        // Clear all particles
        this.particles = [];
        this.eatParticles = [];
        this.levelUpParticles = [];
        
        // Start a new game
        this.startGame();
    }
    
    // Helper function to adjust color brightness
    adjustColorBrightness(color, percent) {
        // If color is in hex format
        if (color.startsWith('#')) {
            let R = parseInt(color.substring(1, 3), 16);
            let G = parseInt(color.substring(3, 5), 16);
            let B = parseInt(color.substring(5, 7), 16);
            
            R = Math.round(Math.max(0, Math.min(255, R + (percent / 100) * 255)));
            G = Math.round(Math.max(0, Math.min(255, G + (percent / 100) * 255)));
            B = Math.round(Math.max(0, Math.min(255, B + (percent / 100) * 255)));
            
            const RR = R.toString(16).padStart(2, '0');
            const GG = G.toString(16).padStart(2, '0');
            const BB = B.toString(16).padStart(2, '0');

            return `#${RR}${GG}${BB}`;
        }
        // Return the color unchanged if not in hex format
        return color;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the game
    const game = new ModernSnakeGame();
    
    // Make game accessible globally for debugging
    window.snakeGame = game;
});
