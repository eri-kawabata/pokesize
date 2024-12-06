function toggleMenu() {
    const sideMenu = document.getElementById("sideMenu");
    sideMenu.classList.toggle("open"); // メニューの開閉を切り替え
}

// 初期設定
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let ranking = JSON.parse(localStorage.getItem("ranking")) || [];
let currentPokemon = "";
let timeRemaining = 60;
let mode = "english"; // デフォルトモードは英語
let isPaused = false; // 一時停止状態を管理
let timerInterval = null; // タイマーのIDを管理

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
const pauseButton = document.getElementById("pause-button"); // HTML内の一時停止ボタンを取得
const replayButton = document.createElement("button"); // リプレイボタンを生成

// リプレイボタンの設定
replayButton.id = "replay-button";
replayButton.innerText = "もう一度プレイ";
replayButton.classList.add("hidden");
rankingArea.appendChild(replayButton); // ランキングエリアに追加

// ハイスコアの表示
highScoreDisplay.innerText = highScore;

// モード切り替えのラベル更新
function updateModeSelection() {
    const labels = document.querySelectorAll("#mode-selection label");
    labels.forEach((label) => {
        const input = label.querySelector("input");
        if (input.checked) {
            label.classList.add("selected"); // 選択中のラベルにクラスを付加
        } else {
            label.classList.remove("selected"); // 他のラベルのクラスを削除
        }
    });
}

// 初回ロード時に状態を設定
updateModeSelection();

// モード切り替え
modeSelection.addEventListener("change", (e) => {
    mode = e.target.value; // 選択されたモードを更新
    updateModeSelection(); // ラベルの選択状態を更新
});

// ひらがなをカタカナに変換する関数
function toKatakana(text) {
    return text.normalize("NFKC").replace(/[\u3041-\u3096]/g, (ch) =>
        String.fromCharCode(ch.charCodeAt(0) + 0x60)
    );
}

// ランダムなポケモンをAPIから取得
async function fetchPokemon() {
    const randomId = Math.floor(Math.random() * 151) + 1; // 初代151ポケモンからランダム取得
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
    if (response.ok) {
        const data = await response.json();
        const pokemonImageURL = data.sprites.front_default; // 表示画像

        if (mode === "japanese") {
            // 日本語名を取得するために追加リクエスト
            const speciesResponse = await fetch(data.species.url);
            if (speciesResponse.ok) {
                const speciesData = await speciesResponse.json();
                const japaneseNameEntry = speciesData.names.find(name => name.language.name === "ja");
                const pokemonName = japaneseNameEntry ? japaneseNameEntry.name : "???";
                return { name: pokemonName, image: pokemonImageURL };
            }
        }

        // 英語モードまたは日本語名取得失敗時
        const pokemonName = data.name;
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
    clearInterval(timerInterval); // タイマーをクリア
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
    replayButton.classList.remove("hidden"); // リプレイボタンを表示
    pauseButton.classList.add("hidden"); // 一時停止ボタンを非表示
}

// タイマーを開始
function startTimer() {
    timerInterval = setInterval(() => {
        if (!isPaused) { // 一時停止中でない場合のみタイマーを動かす
            timeRemaining--;
            timerDisplay.innerText = timeRemaining;
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                endGame();
            }
        }
    }, 1000);
}

// ゲーム開始
function startGame() {
    score = 0;
    timeRemaining = 60;
    isPaused = false;
    typingInput.disabled = false;
    typingInput.value = "";
    scoreDisplay.innerText = score;
    timerDisplay.innerText = timeRemaining;
    gameArea.classList.remove("hidden");
    rankingArea.classList.add("hidden");
    replayButton.classList.add("hidden"); // リプレイボタンを非表示
    pauseButton.classList.remove("hidden"); // 一時停止ボタンを表示
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
    let userInput = typingInput.value.trim();
    let correctAnswer = currentPokemon.trim();

    if (mode === "japanese") {
        // ひらがなをカタカナに変換して比較
        userInput = toKatakana(userInput);
        correctAnswer = toKatakana(correctAnswer);
    }

    if (userInput === correctAnswer) {
        score++;
        scoreDisplay.innerText = score;
        typingInput.value = "";
        showNextPokemon();
    }
});

// リプレイボタンのクリックイベント
replayButton.addEventListener("click", startGame);

// 一時停止ボタンのクリックイベント
pauseButton.addEventListener("click", () => {
    isPaused = !isPaused; // 状態を切り替える
    if (isPaused) {
        pauseButton.innerText = "再開"; // ボタンのテキストを更新
    } else {
        pauseButton.innerText = "一時停止";
    }
});

// 初回ランキング表示
displayRanking();
