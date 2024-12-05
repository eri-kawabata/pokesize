function toggleMenu() {
    const sideMenu = document.getElementById("sideMenu");
    sideMenu.classList.toggle("open"); // メニューの開閉を切り替え
}

const form = document.getElementById("pokemonForm");
const resultDiv = document.getElementById("result");
const modal = document.getElementById("modal");
const modalName = document.getElementById("modal-name");
const modalDescription = document.getElementById("modal-description");
const modalImage = document.getElementById("modal-image");
const modalHeight = document.getElementById("modal-height");
const modalWeight = document.getElementById("modal-weight");
const modalTypes = document.getElementById("modal-types");
const closeModal = document.querySelector(".close");

// 地域ごとのポケモン範囲を定義
const regionRanges = {
    kanto: { start: 1, end: 151 },
    johto: { start: 152, end: 251 },
    hoenn: { start: 252, end: 386 },
    sinnoh: { start: 387, end: 493 },
    unova: { start: 494, end: 649 },
    kalos: { start: 650, end: 721 },
    alola: { start: 722, end: 809 },
    galar: { start: 810, end: 898 }
};

const typeTranslations = {
    normal: "ノーマル",
    fire: "ほのお",
    water: "みず",
    electric: "でんき",
    grass: "くさ",
    ice: "こおり",
    fighting: "かくとう",
    poison: "どく",
    ground: "じめん",
    flying: "ひこう",
    psychic: "エスパー",
    bug: "むし",
    rock: "いわ",
    ghost: "ゴースト",
    dragon: "ドラゴン",
    dark: "あく",
    steel: "はがね",
    fairy: "フェアリー",
};


// モーダルを閉じる
const closeModalHandler = () => {
    modal.style.display = "none";
    document.body.style.overflow = "auto"; // 背景スクロール再有効化
};

closeModal.addEventListener("click", closeModalHandler);

// 外側をクリックしたらモーダルを閉じる
window.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});


const createPokemonCard = (pokemon, japaneseName, description) => {
    const primaryType = pokemon.types[0].type.name; // タイプを取得

    return `
        <div class="pokemon-card ${primaryType}" 
             data-name="${japaneseName}" 
             data-description="${description}" 
             data-height="${pokemon.height * 10}" 
             data-weight="${pokemon.weight / 10}" 
             data-types="${pokemon.types.map((type) => type.type.name).join(", ")}" 
             data-image="${pokemon.sprites.front_default}" 
             data-back-image="${pokemon.sprites.back_default || ''}" 
             data-front-shiny="${pokemon.sprites.front_shiny || ''}" 
             data-back-shiny="${pokemon.sprites.back_shiny || ''}">
            <h2>${japaneseName} (${pokemon.name.toUpperCase()})</h2>
            <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
            <p>身長: ${pokemon.height * 10} cm</p>
            <p>体重: ${pokemon.weight / 10} kg</p>
        </div>
    `;
};



// モーダルに詳細情報を表示
resultDiv.addEventListener("click", (event) => {
    const card = event.target.closest(".pokemon-card");
    if (card) {
        modalName.textContent = card.getAttribute("data-name");
        modalDescription.textContent = card.getAttribute("data-description");
        modalHeight.textContent = `身長: ${card.getAttribute("data-height")} cm`;
        modalWeight.textContent = `体重: ${card.getAttribute("data-weight")} kg`;

        // 英語タイプ名を日本語に変換
        const typesEnglish = card.getAttribute("data-types").split(", ");
        const typesJapanese = typesEnglish.map((type) => typeTranslations[type] || type).join(", ");
        modalTypes.textContent = `タイプ: ${typesJapanese}`;

        // 画像を反映
        modalImage.src = card.getAttribute("data-image");
        modalImage.alt = "ポケモン正面画像";

        const backImage = card.getAttribute("data-back-image");
        const frontShiny = card.getAttribute("data-front-shiny");
        const backShiny = card.getAttribute("data-back-shiny");

        // 後ろ姿
        const modalBackImage = document.getElementById("modal-back-image");
        if (backImage) {
            modalBackImage.src = backImage;
            modalBackImage.style.display = "inline-block";
        } else {
            modalBackImage.style.display = "none";
        }

        // 色違い正面
        const modalFrontShiny = document.getElementById("modal-front-shiny");
        if (frontShiny) {
            modalFrontShiny.src = frontShiny;
            modalFrontShiny.style.display = "inline-block";
        } else {
            modalFrontShiny.style.display = "none";
        }

        // 色違い後ろ
        const modalBackShiny = document.getElementById("modal-back-shiny");
        if (backShiny) {
            modalBackShiny.src = backShiny;
            modalBackShiny.style.display = "inline-block";
        } else {
            modalBackShiny.style.display = "none";
        }

        modal.style.display = "flex";
    }
});


// 検索処理
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // ユーザーの入力と地域を取得
    const selectedRegion = document.getElementById("region").value;
    const userHeightInput = document.getElementById("height").value;
    const userWeightInput = document.getElementById("weight").value;

    if (isNaN(userHeightInput) || isNaN(userWeightInput) || userHeightInput <= 0 || userWeightInput <= 0) {
        resultDiv.innerHTML = `<p style="color: red;">正しい身長と体重を入力してください。</p>`;
        return;
    }

    const userHeight = parseFloat(userHeightInput) / 10; // cm → dm
    const userWeight = parseFloat(userWeightInput) * 10; // kg → hg

    try {
        // APIリクエスト
        const { start, end } = regionRanges[selectedRegion];
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${end - start + 1}&offset=${start - 1}`);
        const data = await response.json();

        const pokemonDetailsPromises = data.results.map((pokemon) =>
            fetch(pokemon.url).then((res) => res.json())
        );
        const allPokemonDetails = await Promise.all(pokemonDetailsPromises);

        const pokemonDifferences = allPokemonDetails.map((pokemonData) => {
            const diffHeight = Math.abs(userHeight - pokemonData.height);
            const diffWeight = Math.abs(userWeight - pokemonData.weight);
            return {
                pokemon: pokemonData,
                difference: diffHeight + diffWeight,
            };
        });

        // 差分でソートして上位3つを取得
        pokemonDifferences.sort((a, b) => a.difference - b.difference);
        const closestPokemons = pokemonDifferences.slice(0, 3);

        // ポケモンの日本語名と説明を取得しカードを作成
        const cardPromises = closestPokemons.map(async (entry) => {
            const speciesResponse = await fetch(entry.pokemon.species.url);
            const speciesData = await speciesResponse.json();
            const japaneseName = speciesData.names.find((name) => name.language.name === "ja").name;
            const descriptionEntry = speciesData.flavor_text_entries.find(
                (entry) => entry.language.name === "ja"
            );
            const description = descriptionEntry ? descriptionEntry.flavor_text.replace(/\n/g, " ") : "説明がありません。";

            return createPokemonCard(entry.pokemon, japaneseName, description);
        });

        const cards = await Promise.all(cardPromises);
        resultDiv.innerHTML = cards.join("");
    } catch (error) {
        console.error("ポケモン情報の取得中にエラーが発生しました:", error);
        resultDiv.innerHTML = `<p style="color: red;">ポケモン情報の取得中にエラーが発生しました。再試行してください。</p>`;
    }
});

