// 初期設定
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let ranking = JSON.parse(localStorage.getItem("ranking")) || [];
let currentPokemon = "";
let timeRemaining = 60;
let mode = "english"; // デフォルトモードは英語

// DOM要素
const pokemonDisplay = document.getElementById("pokemon-display");
const pokemonImage = document.getElementById("pokemon-image");
const typingInput = document.getElementById("typing-input");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const highScoreDisplay = document.getElementById("high-score");
const startButton = document.getElementById("start-button");
const gameArea = document.getElementById("game-area");
const modeSelection = document.getElementById("mode-selection");
const rankingArea = document.getElementById("ranking-area");
const rankingList = document.getElementById("ranking-list");

// ハイスコアの表示
highScoreDisplay.innerText = highScore;

// モード切り替え
modeSelection.addEventListener("change", (e) => {
    mode = e.target.value;
});

// ランダムなポケモンをAPIから取得
async function fetchPokemon() {
    const randomId = Math.floor(Math.random() * 151) + 1; // 初代151ポケモンからランダム取得
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
    if (response.ok) {
        const data = await response.json();
        const pokemonName = mode === "english" ? data.name : data.species.name; // 英語名 or 日本語名
        const pokemonImageURL = data.sprites.front_default; // 表示画像
        return { name: pokemonName, image: pokemonImageURL };
    } else {
        console.error("Failed to fetch Pokémon data");
        return { name: "???", image: "" };
    }
}

// 次のポケモンを表示
async function showNextPokemon() {
    const pokemon = await fetchPokemon();
    currentPokemon = pokemon.name;
    pokemonDisplay.innerText = currentPokemon;
    pokemonImage.src = pokemon.image;
}

// ランキングの更新
function updateRanking() {
    ranking.push(score);
    ranking.sort((a, b) => b - a); // 降順でソート
    ranking = ranking.slice(0, 5); // トップ5を保持
    localStorage.setItem("ranking", JSON.stringify(ranking));
}

// ランキングの表示
function displayRanking() {
    rankingList.innerHTML = ""; // ランキングをクリア
    ranking.forEach((score, index) => {
        const listItem = document.createElement("li");
        listItem.textContent = `#${index + 1}: ${score}点`;
        rankingList.appendChild(listItem);
    });
}

// ゲーム終了
function endGame() {
    typingInput.disabled = true;
    pokemonDisplay.innerText = "ゲーム終了!";
    pokemonImage.src = "";
    if (score > highScore) {
        localStorage.setItem("highScore", score);
        highScoreDisplay.innerText = score;
        alert(`新しいハイスコア！ ${score}点を記録しました！`);
    } else {
        alert(`ゲーム終了！ スコア: ${score}点`);
    }
    updateRanking();
    displayRanking();
    gameArea.classList.add("hidden");
    rankingArea.classList.remove("hidden");
}

// タイマーを開始
function startTimer() {
    const timerInterval = setInterval(() => {
        timeRemaining--;
        timerDisplay.innerText = timeRemaining;
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
}

// ゲーム開始
function startGame() {
    score = 0;
    timeRemaining = 60;
    typingInput.disabled = false;
    typingInput.value = "";
    scoreDisplay.innerText = score;
    timerDisplay.innerText = timeRemaining;
    gameArea.classList.remove("hidden");
    rankingArea.classList.add("hidden");
    showNextPokemon();
    startTimer();
}

// スタートボタンのクリックイベント
startButton.addEventListener("click", () => {
    startButton.classList.add("hidden");
    modeSelection.classList.add("hidden");
    startGame();
});

// タイピング入力の処理
typingInput.addEventListener("input", function () {
    if (typingInput.value.toLowerCase() === currentPokemon.toLowerCase()) {
        score++;
        scoreDisplay.innerText = score;
        typingInput.value = "";
        showNextPokemon();
    }
});

// 初回ランキング表示
displayRanking();
