const API_URL = "https://pokeapi.co/api/v2/pokemon/";
const regions = {
  all: { min: 1, max: 1010 }, // すべてのポケモン
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

document.addEventListener("DOMContentLoaded", () => {
  const pokemonImage = document.getElementById("pokemon-image");
  const regionSelect = document.getElementById("region-select");
  const languageSelect = document.getElementById("language-select");
  const choicesContainer = document.getElementById("choices-container");
  const resultDisplay = document.getElementById("result");
  const scoreDisplay = document.getElementById("score");
  const timerDisplay = document.getElementById("timer");
  const nextButton = document.getElementById("next-button");

  const fetchPokemonData = async (id) => {
    try {
      const response = await fetch(`${API_URL}${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch Pokemon data: ${response.status}`);
      }
      const data = await response.json();
      const language = languageSelect.value;
      const localizedName =
        data.names?.find((name) => name.language.name === language)?.name ||
        data.name;

      return {
        name: data.name,
        localizedName,
        sprite: data.sprites.front_default,
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
      timeLeft -= 1;
      timerDisplay.textContent = timeLeft;

      if (timeLeft === 0) {
        clearInterval(timerInterval);
        handleTimeout();
      }
    }, 1000);
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

  const nextQuestion = async () => {
    currentQuestion++;
    if (currentQuestion > 15) {
      endGame();
      return;
    }
    setTimeout(startNewQuiz, 2000); // 次の問題を2秒後に開始
  };

  const endGame = () => {
    resultDisplay.textContent = `ゲーム終了！ スコア: ${score}`;
    resultDisplay.style.color = "blue";
    nextButton.style.display = "none"; // 「次の問題」ボタンを非表示
  };

  const startNewQuiz = async () => {
    resultDisplay.textContent = "";
    pokemonImage.style.filter = "contrast(0) grayscale(1)";
    const pokemon = await fetchRandomPokemon();
    if (!pokemon) return;
    const choices = await generateChoices();
    renderChoices(choices);
    startTimer();
  };

  nextButton.addEventListener("click", startNewQuiz);
  regionSelect.addEventListener("change", startNewQuiz);
  languageSelect.addEventListener("change", startNewQuiz);

  startNewQuiz(); // 初期化
});

