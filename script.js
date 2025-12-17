// ゲーム要素の取得
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const speedSelect = document.getElementById('speed');
const scoreDisplay = document.getElementById('score');
const ngCountDisplay = document.getElementById('ngCount');
const messageDisplay = document.getElementById('message');

// 定数
const TILE_SIZE = 20; // 1タイルのサイズ
const CANVAS_SIZE = canvas.width; // 400
const MAX_NG = 10;
const INITIAL_SPEED = 100; // 初期速度 (ms)

// ゲームの状態
let snake;
let food;
let dx, dy; // 進行方向 (x, y)
let score;
let ngCount;
let gameLoopInterval;
let gameSpeed = INITIAL_SPEED;
let isGameOver = true;
let isGameRunning = false;
let lastKeyPressed = { x: 1, y: 0 }; // 最後に押されたキーの方向

// ----------------------
// 初期設定とリセット
// ----------------------

function initGame() {
    // 蛇の初期位置と長さ
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dx = 1; // 右向き
    dy = 0;
    score = 0;
    ngCount = 0;
    scoreDisplay.textContent = `スコア: ${score}`;
    ngCountDisplay.textContent = `NG回数: ${ngCount} / ${MAX_NG}`;
    isGameOver = false;
    isGameRunning = true;
    lastKeyPressed = { x: 1, y: 0 }; 

    // 餌の配置
    placeFood();
    
    // メッセージの更新
    messageDisplay.classList.add('hidden');
    
    // 描画
    drawGame();

    // ゲームループの開始
    clearInterval(gameLoopInterval);
    gameSpeed = parseInt(speedSelect.value);
    gameLoopInterval = setInterval(gameLoop, gameSpeed);
}

// ----------------------
// 描画関数
// ----------------------

function drawTile(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = '#aad751';
    ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function drawSnake() {
    // 蛇の頭
    drawTile(snake[0].x, snake[0].y, '#388e3c'); // 濃い緑
    
    // 蛇の体
    for (let i = 1; i < snake.length; i++) {
        drawTile(snake[i].x, snake[i].y, '#66bb6a'); // 通常の緑
    }
}

function drawFood() {
    drawTile(food.x, food.y, 'red');
}

function drawGame() {
    // キャンバスをクリア
    ctx.fillStyle = '#aad751'; // 背景色
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    drawFood();
    drawSnake();
}

// ----------------------
// ゲームロジック
// ----------------------

function gameLoop() {
    if (isGameOver) {
        clearInterval(gameLoopInterval);
        return;
    }

    // 方向の適用
    dx = lastKeyPressed.x;
    dy = lastKeyPressed.y;

    // 新しい頭の位置
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // 衝突判定
    if (checkCollision(head)) {
        handleNG();
        return;
    }

    // 蛇の移動
    snake.unshift(head); // 頭を追加

    // 餌を食べたか
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreDisplay.textContent = `スコア: ${score}`;
        placeFood(); // 新しい餌を配置
    } else {
        snake.pop(); // 餌を食べていない場合は、尾を削除
    }

    // 描画の更新
    drawGame();
}

function checkCollision(head) {
    const maxCoord = CANVAS_SIZE / TILE_SIZE - 1;

    // 1. 壁との衝突
    if (head.x < 0 || head.x > maxCoord || head.y < 0 || head.y > maxCoord) {
        return true;
    }

    // 2. 自身との衝突
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

function handleNG() {
    ngCount++;
    ngCountDisplay.textContent = `NG回数: ${ngCount} / ${MAX_NG}`;

    if (ngCount >= MAX_NG) {
        isGameOver = true;
        messageDisplay.textContent = `ゲームオーバー！スコア: ${score}`;
        messageDisplay.classList.remove('hidden');
        clearInterval(gameLoopInterval);
    } else {
        // NGになったが、ゲームオーバーではない場合
        messageDisplay.textContent = `壁にぶつかった！残りNG回数: ${MAX_NG - ngCount}`;
        messageDisplay.classList.remove('hidden');

        // 一時的にゲームを停止し、再開
        clearInterval(gameLoopInterval);

        // 衝突したため、元の位置に戻し、再スタート
        isGameRunning = false;
        
        // NG後のペナルティとして一時停止し、自動で再開
        setTimeout(() => {
            if (!isGameOver) {
                // 蛇を初期位置に戻す
                initGameAfterNG();
            }
        }, 1000); // 1秒停止
    }
}

function initGameAfterNG() {
    // 蛇の初期位置と方向リセット
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dx = 1; 
    dy = 0;
    lastKeyPressed = { x: 1, y: 0 }; 

    // 描画
    drawGame();

    // メッセージの非表示
    messageDisplay.classList.add('hidden');
    
    // ゲームループの再開
    isGameRunning = true;
    gameSpeed = parseInt(speedSelect.value);
    gameLoopInterval = setInterval(gameLoop, gameSpeed);
}

function placeFood() {
    const maxCoord = CANVAS_SIZE / TILE_SIZE - 1;
    let newFood;
    
    do {
        // ランダムな位置を生成
        newFood = {
            x: Math.floor(Math.random() * (maxCoord + 1)),
            y: Math.floor(Math.random() * (maxCoord + 1))
        };
        // 蛇の体と同じ位置でないか確認
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));

    food = newFood;
}

// ----------------------
// イベントハンドラ
// ----------------------

// キーボード操作
document.addEventListener('keydown', (e) => {
    if (isGameOver || !isGameRunning) return;

    // 最後に押されたキーの方向を保存
    // 180度反転を禁止
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
            if (dy === 0) lastKeyPressed = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
        case 's':
            if (dy === 0) lastKeyPressed = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
        case 'a':
            if (dx === 0) lastKeyPressed = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
        case 'd':
            if (dx === 0) lastKeyPressed = { x: 1, y: 0 };
            break;
    }
});

// スタート/再開ボタン
startButton.addEventListener('click', () => {
    initGame();
});

// 速度変更
speedSelect.addEventListener('change', (e) => {
    gameSpeed = parseInt(e.target.value);
    // ゲームが実行中の場合は、速度を即時反映させる
    if (isGameRunning && !isGameOver) {
        clearInterval(gameLoopInterval);
        gameLoopInterval = setInterval(gameLoop, gameSpeed);
    }
});

// ----------------------
// 初期起動時の処理
// ----------------------

// 初期画面の描画
function setupInitialScreen() {
    ctx.fillStyle = '#aad751';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    ctx.fillStyle = '#333';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('「ゲーム開始」ボタンを押してください', CANVAS_SIZE / 2, CANVAS_SIZE / 2);

    messageDisplay.textContent = 'ゲームを開始してください。';
    messageDisplay.classList.remove('hidden');
}

setupInitialScreen();