// ゲーム要素の取得
const board = document.getElementById('gameBoard');
const playerElement = document.getElementById('player');
const ballElement = document.getElementById('ball');
const startButton = document.getElementById('startButton');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const messageDisplay = document.getElementById('message');

// 定数
const BOARD_WIDTH = 600;
const BOARD_HEIGHT = 300;
const PLAYER_SIZE = 30;
const BALL_SIZE = 20;
const MOVE_SPEED = 5; // プレイヤーの移動速度 (px)
const MAX_TIME = 60; // 制限時間 (秒)
const GOAL_WIDTH = 20;

// ゲームの状態
let player = { x: 50, y: BOARD_HEIGHT / 2 - PLAYER_SIZE / 2 };
let ball = { x: BOARD_WIDTH / 2 - BALL_SIZE / 2, y: BOARD_HEIGHT / 2 - BALL_SIZE / 2, vx: 0, vy: 0, friction: 0.98 };
let score = 0;
let timeLeft = MAX_TIME;
let isGameRunning = false;
let timerInterval;
let keysPressed = {}; // 押されているキーの状態

// ----------------------
// 初期化とリセット
// ----------------------

function initGame() {
    // スコアとタイマーのリセット
    score = 0;
    timeLeft = MAX_TIME;
    scoreDisplay.textContent = `スコア: ${score}`;
    timerDisplay.textContent = `時間: ${timeLeft}秒`;
    
    // プレイヤーとボールの位置リセット
    player = { x: 50, y: BOARD_HEIGHT / 2 - PLAYER_SIZE / 2 };
    ball = { x: BOARD_WIDTH / 2 - BALL_SIZE / 2, y: BOARD_HEIGHT / 2 - BALL_SIZE / 2, vx: 0, vy: 0, friction: 0.98 };
    
    // UI更新
    messageDisplay.classList.add('hidden');
    startButton.textContent = 'リセット';
    isGameRunning = true;
    keysPressed = {};

    // ゲームループ開始
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
    
    // 描画ループ開始
    requestAnimationFrame(gameLoop);
}

// ----------------------
// タイマー管理
// ----------------------

function updateTimer() {
    if (!isGameRunning) return;

    timeLeft--;
    timerDisplay.textContent = `時間: ${timeLeft}秒`;

    if (timeLeft <= 0) {
        endGame();
    }
}

function endGame() {
    isGameRunning = false;
    clearInterval(timerInterval);
    messageDisplay.textContent = `ゲーム終了！最終スコア: ${score}`;
    messageDisplay.classList.remove('hidden');
    startButton.textContent = '再スタート';
}

// ----------------------
// ゲームループと描画
// ----------------------

function drawEntities() {
    // プレイヤーの描画
    playerElement.style.left = `${player.x}px`;
    playerElement.style.top = `${player.y}px`;

    // ボールの描画
    ballElement.style.left = `${ball.x}px`;
    ballElement.style.top = `${ball.y}px`;
}

function gameLoop() {
    if (!isGameRunning) return;

    // 1. プレイヤーの移動処理
    movePlayer();
    
    // 2. ボールの移動と摩擦
    moveBall();

    // 3. 衝突判定 (プレイヤーとボール)
    checkCollisionPlayerBall();

    // 4. 壁の反射判定 (ボール)
    checkBallWallCollision();

    // 5. ゴール判定
    checkGoal();
    
    // 6. 描画更新
    drawEntities();

    // 次のフレームを要求
    requestAnimationFrame(gameLoop);
}

// ----------------------
// 移動と衝突判定
// ----------------------

function movePlayer() {
    let nextX = player.x;
    let nextY = player.y;

    if (keysPressed['ArrowLeft'] || keysPressed['a']) nextX -= MOVE_SPEED;
    if (keysPressed['ArrowRight'] || keysPressed['d']) nextX += MOVE_SPEED;
    if (keysPressed['ArrowUp'] || keysPressed['w']) nextY -= MOVE_SPEED;
    if (keysPressed['ArrowDown'] || keysPressed['s']) nextY += MOVE_SPEED;

    // 壁との衝突（プレイヤー）
    player.x = Math.max(0, Math.min(nextX, BOARD_WIDTH - PLAYER_SIZE));
    player.y = Math.max(0, Math.min(nextY, BOARD_HEIGHT - PLAYER_SIZE));
}

function moveBall() {
    ball.vx *= ball.friction;
    ball.vy *= ball.friction;
    
    ball.x += ball.vx;
    ball.y += ball.vy;

    // 速度が非常に遅くなったら停止
    if (Math.abs(ball.vx) < 0.1) ball.vx = 0;
    if (Math.abs(ball.vy) < 0.1) ball.vy = 0;
}


function checkCollisionPlayerBall() {
    const pCenter = { x: player.x + PLAYER_SIZE / 2, y: player.y + PLAYER_SIZE / 2 };
    const bCenter = { x: ball.x + BALL_SIZE / 2, y: ball.y + BALL_SIZE / 2 };
    
    const dx = pCenter.x - bCenter.x;
    const dy = pCenter.y - bCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const minDistance = PLAYER_SIZE / 2 + BALL_SIZE / 2; // 接触距離

    if (distance < minDistance) {
        // 衝突が発生した場合
        
        // 1. 重なりを解消 (単純化のため、プレイヤーから離す)
        const overlap = minDistance - distance;
        const angle = Math.atan2(dy, dx);
        
        // ボールを押し出す
        ball.x -= Math.cos(angle) * overlap;
        ball.y -= Math.sin(angle) * overlap;
        
        // 2. 速度を伝える (プレイヤーの移動方向と速さをボールに与える)
        let pvX = 0;
        let pvY = 0;
        if (keysPressed['ArrowLeft'] || keysPressed['a']) pvX -= MOVE_SPEED;
        if (keysPressed['ArrowRight'] || keysPressed['d']) pvX += MOVE_SPEED;
        if (keysPressed['ArrowUp'] || keysPressed['w']) pvY -= MOVE_SPEED;
        if (keysPressed['ArrowDown'] || keysPressed['s']) pvY += MOVE_SPEED;

        // 速度をボールの速度として適用
        const pushFactor = 0.5; // 押し出す力の調整
        ball.vx = pvX * pushFactor;
        ball.vy = pvY * pushFactor;
    }
}

function checkBallWallCollision() {
    // X軸の壁
    if (ball.x < GOAL_WIDTH || ball.x > BOARD_WIDTH - BALL_SIZE - GOAL_WIDTH) {
        // ゴールエリア内では反射させない (ゴール判定に任せる)
    } else if (ball.x < 0 || ball.x > BOARD_WIDTH - BALL_SIZE) {
        ball.vx *= -1; // 反転
        ball.x = Math.max(0, Math.min(ball.x, BOARD_WIDTH - BALL_SIZE)); // 補正
    }

    // Y軸の壁
    if (ball.y < 0 || ball.y > BOARD_HEIGHT - BALL_SIZE) {
        ball.vy *= -1; // 反転
        ball.y = Math.max(0, Math.min(ball.y, BOARD_HEIGHT - BALL_SIZE)); // 補正
    }
}

function checkGoal() {
    // 右ゴール（得点エリア）
    if (ball.x + BALL_SIZE >= BOARD_WIDTH - GOAL_WIDTH) {
        score++;
        scoreDisplay.textContent = `スコア: ${score}`;
        
        // ゴール後のリセット
        messageDisplay.textContent = `GOAL! ${score}点目！`;
        messageDisplay.classList.remove('hidden');
        
        setTimeout(() => {
            messageDisplay.classList.add('hidden');
            // 中央にリセット
            player.x = 50; 
            player.y = BOARD_HEIGHT / 2 - PLAYER_SIZE / 2;
            ball = { x: BOARD_WIDTH / 2 - BALL_SIZE / 2, y: BOARD_HEIGHT / 2 - BALL_SIZE / 2, vx: 0, vy: 0, friction: 0.98 };
        }, 1000);
        
        return;
    }
    
    // 左ゴール（相手がいないので、ペナルティはなし。壁として扱う）
    if (ball.x <= GOAL_WIDTH) {
        // ボールを押し戻す (壁としての反射)
        ball.vx *= -1;
        ball.x = GOAL_WIDTH;
    }
}


// ----------------------
// イベントハンドラ
// ----------------------

// キーボード操作
document.addEventListener('keydown', (e) => {
    if (!isGameRunning) return;
    
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        keysPressed[e.key] = true;
        e.preventDefault(); // スクロール防止
    }
});

document.addEventListener('keyup', (e) => {
    if (!isGameRunning) return;
    
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        keysPressed[e.key] = false;
    }
});

// スタート/リセットボタン
startButton.addEventListener('click', () => {
    initGame();
});

// ----------------------
// 初期起動時の処理
// ----------------------

function setupInitialScreen() {
    // 要素を初期位置に配置
    drawEntities();
    messageDisplay.textContent = '「ゲーム開始」ボタンを押してください。';
    messageDisplay.classList.remove('hidden');
    startButton.textContent = 'ゲーム開始';
}

setupInitialScreen();