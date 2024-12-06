function toggleMenu() {
    const sideMenu = document.getElementById("sideMenu");
    sideMenu.classList.toggle("open"); // メニューの開閉を切り替え
}

const API_URL = "https://pokeapi.co/api/v2/";
const regions = {
    all: { min: 1, max: 1010 },
    kanto: { min: 1, max: 151 },
    johto: { min: 152, max: 251 },
    hoenn: { min: 252, max: 386 },
    sinnoh: { min: 387, max: 493 },
    unova: { min: 494, max: 649 },
    kalos: { min: 650, max: 721 },
    alola: { min: 722, max: 809 },
    galar: { min: 810, max: 898 },
};

let currentPokemon = null;
let score = 0;
let currentQuestion = 0;
let timerInterval = null;
let timeLeft = 10;
let isPaused = false; // 一時停止のフラグ
let isGameStarted = false; // ゲーム開始フラグ

document.addEventListener("DOMContentLoaded", () => {
    const pokemonImage = document.getElementById("pokemon-image");
    const regionSelect = document.getElementById("region-select");
    const languageSelect = document.getElementById("language-select");
    const choicesContainer = document.getElementById("choices-container");
    const resultDisplay = document.getElementById("result");
    const scoreDisplay = document.getElementById("score");
    const progressDisplay = document.getElementById("progress");
    const timerDisplay = document.getElementById("timer");
    const pauseButton = document.getElementById("pause-button");
    const startButton = document.getElementById("start-button");
    const endScreen = document.getElementById("end-screen");
    const finalScore = document.getElementById("final-score");
    const replayButton = document.getElementById("replay-button");

    const fetchPokemonData = async (id) => {
        try {
            const response = await fetch(`${API_URL}pokemon/${id}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch Pokemon data: ${response.status}`);
            }
            const data = await response.json();

            const speciesResponse = await fetch(data.species.url);
            if (!speciesResponse.ok) {
                throw new Error(`Failed to fetch Pokemon species data: ${speciesResponse.status}`);
            }

            const speciesData = await speciesResponse.json();
            const language = languageSelect.value || "en";
            const localizedName = speciesData.names.find(
                (name) => name.language.name === language
            )?.name || data.name;

            return {
                name: data.name,
                localizedName,
                sprite: data.sprites.front_default,
                types: data.types.map((type) => type.type.name),
            };
        } catch (error) {
            console.error("Error fetching Pokemon data:", error);
            resultDisplay.textContent = "エラー: ポケモンデータの取得に失敗しました";
            return null;
        }
    };

    const fetchRandomPokemon = async () => {
        const region = regionSelect.value;
        const { min, max } = regions[region];
        const randomId = Math.floor(Math.random() * (max - min + 1)) + min;
        const pokemon = await fetchPokemonData(randomId);

        if (!pokemon || !pokemon.sprite) {
            console.error("No sprite available for the selected Pokemon");
            resultDisplay.textContent = "エラー: ポケモン画像が見つかりませんでした";
            return null;
        }

        currentPokemon = pokemon;
        pokemonImage.src = pokemon.sprite;
        pokemonImage.style.filter = "contrast(0) grayscale(1)";
        return pokemon;
    };

    const generateChoices = async () => {
        const region = regionSelect.value;
        const { min, max } = regions[region];
        const correctChoice = currentPokemon;
        const choices = new Map();
        choices.set(correctChoice.name, correctChoice.localizedName);

        while (choices.size < 4) {
            const randomId = Math.floor(Math.random() * (max - min + 1)) + min;
            const randomPokemon = await fetchPokemonData(randomId);
            if (randomPokemon && randomPokemon.name && !choices.has(randomPokemon.name)) {
                choices.set(randomPokemon.name, randomPokemon.localizedName);
            }
        }

        return Array.from(choices.entries()).map(([name, localizedName]) => ({
            name,
            localizedName,
        }));
    };

    const renderChoices = (choices) => {
        choicesContainer.innerHTML = "";
        choices.forEach((choice) => {
            const button = document.createElement("button");
            button.textContent = choice.localizedName || choice.name;
            button.classList.add("choice-button");
            button.addEventListener("click", () => handleAnswer(choice));
            choicesContainer.appendChild(button);
        });
    };

    const startTimer = () => {
        clearInterval(timerInterval);
        timeLeft = 10;
        timerDisplay.textContent = timeLeft;

        timerInterval = setInterval(() => {
            if (!isPaused) {
                timeLeft -= 1;
                timerDisplay.textContent = timeLeft;

                if (timeLeft === 0) {
                    clearInterval(timerInterval);
                    handleTimeout();
                }
            }
        }, 1000);
    };

    const togglePause = () => {
        isPaused = !isPaused;
        pauseButton.textContent = isPaused ? "再開" : "一時停止";
    };

    const handleTimeout = () => {
        resultDisplay.textContent = "時間切れ！";
        resultDisplay.style.color = "red";
        pokemonImage.style.filter = "none";
        disableChoices();
        nextQuestion();
    };

    const handleAnswer = (choice) => {
        clearInterval(timerInterval);

        if (choice.name === currentPokemon.name) {
            resultDisplay.textContent = `正解！ ${currentPokemon.localizedName} (${currentPokemon.name})`;
            resultDisplay.style.color = "green";
            score += 10;
            scoreDisplay.textContent = `スコア: ${score}`;
        } else {
            resultDisplay.textContent = "不正解...";
            resultDisplay.style.color = "red";
        }

        pokemonImage.style.filter = "none";
        disableChoices();
        nextQuestion();
    };

    const disableChoices = () => {
        const buttons = document.querySelectorAll(".choice-button");
        buttons.forEach((button) => (button.disabled = true));
    };

    const updateProgress = () => {
        progressDisplay.textContent = `問題: ${currentQuestion} / 15`;
    };

    const nextQuestion = async () => {
        currentQuestion++;
        updateProgress();

        if (currentQuestion > 15) {
            endGame();
            return;
        }
        setTimeout(startNewQuiz, 2000);
    };

    const endGame = () => {
        resultDisplay.textContent = "ゲーム終了！";
        resultDisplay.style.display = "none";
        pauseButton.style.display = "none";
        endScreen.style.display = "block";

        finalScore.textContent = `あなたのスコア: ${score}`;
        isGameStarted = false; // ゲーム終了時フラグをリセット
    };

    const resetGame = () => {
        score = 0;
        currentQuestion = 0;
        resultDisplay.style.display = "block";
        pauseButton.style.display = "block";
        endScreen.style.display = "none";
        scoreDisplay.textContent = "スコア: 0";
        updateProgress();
        startNewQuiz();
    };

    const initGame = () => {
        score = 0;
        currentQuestion = 0;
        timeLeft = 10;
        isPaused = false;
        isGameStarted = true;

        resultDisplay.textContent = "";
        progressDisplay.textContent = "問題: 0 / 15";
        scoreDisplay.textContent = "スコア: 0";

        startButton.style.display = "none";
        pauseButton.style.display = "inline-block";
        endScreen.style.display = "none";

        startNewQuiz();
    };

    const startNewQuiz = async () => {
        if (!isGameStarted) return; // ゲームが開始されていない場合は何もしない
        resultDisplay.textContent = "";
        pokemonImage.style.filter = "contrast(0) grayscale(1)";
        const pokemon = await fetchRandomPokemon();
        if (!pokemon) return;
        const choices = await generateChoices();
        renderChoices(choices);
        startTimer();
    };

    startButton.addEventListener("click", initGame);
    replayButton.addEventListener("click", resetGame);
    pauseButton.addEventListener("click", togglePause);

    // 地域と言語の選択変更時にゲームをリセットしない
    regionSelect.addEventListener("change", () => {
        if (isGameStarted) {
            console.log("地域が変更されましたが、ゲームは継続します");
        }
    });

    languageSelect.addEventListener("change", () => {
        if (isGameStarted) {
            console.log("言語が変更されましたが、ゲームは継続します");
        }
    });

    updateProgress();
});
