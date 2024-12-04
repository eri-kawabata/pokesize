document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("recordForm");
    const recordItems = document.getElementById("recordItems");
    const ctx = document.getElementById("recordChart").getContext("2d");

    const records = [];

    const fetchPokemonData = async () => {
        const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=151");
        const data = await response.json();
        const pokemonDetails = await Promise.all(
            data.results.map((pokemon) => fetch(pokemon.url).then((res) => res.json()))
        );
        return pokemonDetails.map((pokemon) => ({
            name: pokemon.name,
            image: pokemon.sprites.front_default,
            height: pokemon.height * 10, // dm → cm
            weight: pokemon.weight / 10, // hg → kg
        }));
    };

    const findClosestPokemon = (height, weight, pokemons) => {
        return pokemons.reduce((closest, pokemon) => {
            const heightDiff = Math.abs(pokemon.height - height);
            const weightDiff = Math.abs(pokemon.weight - weight);
            const diff = heightDiff + weightDiff;

            return diff < closest.diff ? { ...pokemon, diff } : closest;
        }, { diff: Infinity });
    };

    const updateChart = () => {
        const labels = records.map((_, index) => `記録${index + 1}`);
        const heights = records.map((record) => record.height);
        const weights = records.map((record) => record.weight);

        new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: "身長 (cm)",
                        data: heights,
                        borderColor: "rgba(75, 192, 192, 1)",
                        fill: false,
                    },
                    {
                        label: "体重 (kg)",
                        data: weights,
                        borderColor: "rgba(255, 99, 132, 1)",
                        fill: false,
                    },
                ],
            },
        });
    };

    const initApp = async () => {
        const pokemons = await fetchPokemonData();

        form.addEventListener("submit", (event) => {
            event.preventDefault();

            const height = parseInt(document.getElementById("height").value);
            const weight = parseInt(document.getElementById("weight").value);

            if (isNaN(height) || isNaN(weight)) return alert("正しい数値を入力してください。");

            const closestPokemon = findClosestPokemon(height, weight, pokemons);
            records.push({ height, weight, pokemon: closestPokemon });

            const listItem = document.createElement("li");
            listItem.innerHTML = `
                <div>
                    <img src="${closestPokemon.image}" alt="${closestPokemon.name}" class="avatar">
                    ${closestPokemon.name}
                </div>
                <div>身長: ${height} cm, 体重: ${weight} kg</div>
            `;
            recordItems.appendChild(listItem);

            updateChart();
        });
    };

    initApp();
});
