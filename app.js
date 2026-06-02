const TYPES = [
  { id: "normal", name: "Normal", color: "#9fa19f" },
  { id: "fire", name: "Feuer", color: "#e66b2e" },
  { id: "water", name: "Wasser", color: "#337fca" },
  { id: "electric", name: "Elektro", color: "#d9a51d" },
  { id: "grass", name: "Pflanze", color: "#4f9d45" },
  { id: "ice", name: "Eis", color: "#63b6b3" },
  { id: "fighting", name: "Kampf", color: "#c4453a" },
  { id: "poison", name: "Gift", color: "#9b59b6" },
  { id: "ground", name: "Boden", color: "#b77933" },
  { id: "flying", name: "Flug", color: "#6f91d7" },
  { id: "psychic", name: "Psycho", color: "#dd5d82" },
  { id: "bug", name: "Käfer", color: "#8aa62f" },
  { id: "rock", name: "Gestein", color: "#a38c55" },
  { id: "ghost", name: "Geist", color: "#6556a6" },
  { id: "dragon", name: "Drache", color: "#596fc9" },
  { id: "dark", name: "Unlicht", color: "#5d5362" },
  { id: "steel", name: "Stahl", color: "#6594a1" },
  { id: "fairy", name: "Fee", color: "#d978ad" },
];

const TYPE_CHART = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 2,
    bug: 2,
    rock: 0.5,
    dragon: 0.5,
    steel: 2,
  },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: {
    water: 2,
    electric: 0.5,
    grass: 0.5,
    ground: 0,
    flying: 2,
    dragon: 0.5,
  },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: {
    fire: 2,
    electric: 2,
    grass: 0.5,
    poison: 2,
    flying: 0,
    bug: 0.5,
    rock: 2,
    steel: 2,
  },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: {
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    ice: 2,
    rock: 2,
    steel: 0.5,
    fairy: 2,
  },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

const $ = (selector) => document.querySelector(selector);

const typeById = Object.fromEntries(TYPES.map((type) => [type.id, type]));
const multipliers = [0, 0.25, 0.5, 1, 2, 4];
const themeStorageKey = "pokemon-type-trainer-theme";
const roundQuestionCount = 50;
let quizMode = "practice";
let quizTargetMode = "mixed";
let allQuestions = [];
let allIndex = 0;
let allResults = [];
let currentQuestion = null;
let score = { correct: 0, total: 0 };

const targetModeLabels = {
  mixed: "Gemischt",
  single: "Einzeltyp",
  double: "Doppeltyp",
};

function typeName(typeId) {
  return typeById[typeId]?.name ?? "Kein Typ";
}

function getInitialTheme() {
  const savedTheme = localStorage.getItem(themeStorageKey);
  if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = theme;
  $("#themeToggle").setAttribute("aria-pressed", String(isDark));
  $("#themeToggle").setAttribute("aria-label", isDark ? "Hellmodus einschalten" : "Darkmode einschalten");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", isDark ? "#101316" : "#197d7a");
}

function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(themeStorageKey, nextTheme);
  applyTheme(nextTheme);
}

function baseEffectiveness(attackType, defenseType) {
  return TYPE_CHART[attackType]?.[defenseType] ?? 1;
}

function selectedDefenseTypes(firstType, secondType) {
  return [firstType, secondType].filter(Boolean).filter((type, index, list) => list.indexOf(type) === index);
}

function totalEffectiveness(attackType, defenseTypes) {
  return defenseTypes.reduce((total, defenseType) => total * baseEffectiveness(attackType, defenseType), 1);
}

function formatMultiplier(value) {
  return `x${Number.isInteger(value) ? value : value.toString().replace(".", ",")}`;
}

function multiplierLabel(value) {
  if (value === 0) return "Keine Wirkung";
  if (value === 0.25) return "Viertel Schaden";
  if (value === 0.5) return "Halb effektiv";
  if (value === 1) return "Normal effektiv";
  if (value === 2) return "Sehr effektiv";
  return "Extrem effektiv";
}

const matchupNotes = {
  normal: {
    rock: "Merksatz: Normale Treffer prallen an hartem Gestein ab.",
    ghost: "Merksatz: Normale Treffer gehen durch Geister hindurch.",
    steel: "Merksatz: Stahl ist zu hart für einfache Treffer.",
  },
  fire: {
    fire: "Merksatz: Mehr Feuer macht Feuer nicht besonders kaputt.",
    water: "Merksatz: Wasser löscht Feuer.",
    grass: "Merksatz: Pflanzen brennen leicht.",
    ice: "Merksatz: Feuer schmilzt Eis.",
    bug: "Merksatz: Kleine Käfer sind sehr hitzeempfindlich.",
    rock: "Merksatz: Stein brennt kaum.",
    dragon: "Merksatz: Drachen halten Elementarkräfte gut aus.",
    steel: "Merksatz: Hitze macht Metall weich.",
  },
  water: {
    fire: "Merksatz: Wasser löscht Feuer.",
    water: "Merksatz: Wasser verschwindet nicht einfach in Wasser.",
    grass: "Merksatz: Pflanzen trinken Wasser.",
    ground: "Merksatz: Wasser weicht Erde und Boden auf.",
    rock: "Merksatz: Wasser schleift Gestein ab.",
    dragon: "Merksatz: Drachen halten Elementarkräfte gut aus.",
  },
  electric: {
    water: "Merksatz: Wasser leitet Strom.",
    electric: "Merksatz: Strom gegen Strom verpufft.",
    grass: "Merksatz: Pflanzen erden Strom recht gut.",
    ground: "Merksatz: Boden leitet Strom in die Erde ab.",
    flying: "Merksatz: Fliegende Ziele sind perfekte Blitzableiter.",
    dragon: "Merksatz: Drachen halten Elementarkräfte gut aus.",
  },
  grass: {
    fire: "Merksatz: Feuer verbrennt Pflanzen.",
    water: "Merksatz: Pflanzen saugen Wasser auf.",
    grass: "Merksatz: Pflanze gegen Pflanze wächst eher ineinander.",
    poison: "Merksatz: Gift schadet Pflanzen.",
    ground: "Merksatz: Wurzeln durchdringen Boden.",
    flying: "Merksatz: Aus der Luft kommt man an Ranken vorbei.",
    bug: "Merksatz: Käfer fressen Pflanzen.",
    rock: "Merksatz: Wurzeln sprengen Gestein.",
    dragon: "Merksatz: Drachen halten Elementarkräfte gut aus.",
    steel: "Merksatz: Pflanzen kommen gegen Metall schlecht durch.",
  },
  ice: {
    fire: "Merksatz: Feuer schmilzt Eis.",
    water: "Merksatz: Eis kühlt Wasser nur, es zerschlägt es nicht.",
    grass: "Merksatz: Frost lässt Pflanzen welken.",
    ice: "Merksatz: Eis gegen Eis bleibt hart.",
    ground: "Merksatz: Frost sprengt und verhärtet Boden.",
    flying: "Merksatz: Eis macht Flügel schwer.",
    dragon: "Merksatz: Kälte bremst Drachen.",
    steel: "Merksatz: Stahl bleibt bei Kälte sehr widerstandsfähig.",
  },
  fighting: {
    normal: "Merksatz: Training schlägt normale Körperkraft.",
    ice: "Merksatz: Ein harter Schlag zerbricht Eis.",
    poison: "Merksatz: Giftige Ziele sind riskant im Nahkampf.",
    flying: "Merksatz: Fliegende Gegner bleiben außer Reichweite.",
    psychic: "Merksatz: Köpfchen liest rohe Kraft aus.",
    bug: "Merksatz: Käfer sind schwer sauber zu treffen.",
    rock: "Merksatz: Kampfkraft zertrümmert Gestein.",
    ghost: "Merksatz: Fäuste treffen keine Geister.",
    dark: "Merksatz: Heldenhafte Kampfkunst schlägt fiese Tricks.",
    steel: "Merksatz: Kampfkraft verbiegt Metall.",
    fairy: "Merksatz: Feen entwaffnen rohe Kraft.",
  },
  poison: {
    grass: "Merksatz: Gift lässt Pflanzen eingehen.",
    poison: "Merksatz: Giftige Körper sind an Gift gewöhnt.",
    ground: "Merksatz: Erde schluckt Giftstoffe.",
    rock: "Merksatz: Stein lässt sich kaum vergiften.",
    ghost: "Merksatz: Geister haben keinen normalen Körper zum Vergiften.",
    steel: "Merksatz: Metall kann man nicht vergiften.",
    fairy: "Merksatz: Gift kippt Feenmagie.",
  },
  ground: {
    fire: "Merksatz: Erde erstickt Flammen.",
    electric: "Merksatz: Boden erdet Strom komplett.",
    grass: "Merksatz: Wurzeln halten Boden fest.",
    poison: "Merksatz: Erde bindet Giftstoffe.",
    flying: "Merksatz: Boden trifft nichts, was fliegt.",
    bug: "Merksatz: Käfer krabbeln durch Erde.",
    rock: "Merksatz: Erdbeben zerlegt Gestein.",
    steel: "Merksatz: Erdbeben verbiegt Metall.",
  },
  flying: {
    electric: "Merksatz: Blitze treffen Flugziele gut.",
    grass: "Merksatz: Wind zerzaust Pflanzen.",
    fighting: "Merksatz: Aus der Luft ist Nahkampf schwer.",
    bug: "Merksatz: Vögel schnappen Käfer.",
    rock: "Merksatz: Steine holen Flieger runter.",
    steel: "Merksatz: Metall hält Wind und Flügelangriffe aus.",
  },
  psychic: {
    fighting: "Merksatz: Geistige Kontrolle schlägt rohe Kraft.",
    poison: "Merksatz: Psycho-Kräfte reinigen und kontrollieren Gift.",
    psychic: "Merksatz: Mentale Kräfte blocken sich gegenseitig.",
    dark: "Merksatz: Dunkelheit blockt Psycho-Kräfte komplett.",
    steel: "Merksatz: Stahl ist zu kühl und starr für Psycho-Druck.",
  },
  bug: {
    fire: "Merksatz: Käfer verbrennen schnell.",
    grass: "Merksatz: Käfer fressen Pflanzen.",
    fighting: "Merksatz: Käfer stören, aber stoppen Kämpfer kaum.",
    poison: "Merksatz: Gift hält Käfer fern.",
    flying: "Merksatz: Flieger jagen Käfer.",
    psychic: "Merksatz: Kleine Käfer bringen Konzentration durcheinander.",
    ghost: "Merksatz: Geister lassen Käferangriffe verpuffen.",
    dark: "Merksatz: Käfer finden sich im Dunkeln zurecht.",
    steel: "Merksatz: Käfer kommen durch Metall kaum durch.",
    fairy: "Merksatz: Feen lassen sich von Käfern wenig beeindrucken.",
  },
  rock: {
    fire: "Merksatz: Stein erstickt und begräbt Feuer.",
    ice: "Merksatz: Stein zerschlägt Eis.",
    fighting: "Merksatz: Kämpfer zertrümmern Felsen.",
    ground: "Merksatz: Boden und Erde federn Gestein ab.",
    flying: "Merksatz: Steine holen Flieger runter.",
    bug: "Merksatz: Ein Stein zerquetscht Käfer.",
    steel: "Merksatz: Stahl ist härter als Gestein.",
  },
  ghost: {
    normal: "Merksatz: Geister und Normales berühren sich nicht.",
    psychic: "Merksatz: Spuk bringt Psycho-Kräfte aus dem Gleichgewicht.",
    ghost: "Merksatz: Geister können andere Geister direkt treffen.",
    dark: "Merksatz: Dunkelheit verschluckt Spuk.",
  },
  dragon: {
    dragon: "Merksatz: Drachen sind vor allem gegen Drachen verwundbar.",
    steel: "Merksatz: Stahl hält Drachengewalt stand.",
    fairy: "Merksatz: Feenmärchen stoppen Drachen komplett.",
  },
  dark: {
    fighting: "Merksatz: Mutiger Nahkampf schlägt fiese Tricks.",
    psychic: "Merksatz: Dunkelheit blockt Psycho-Kräfte.",
    ghost: "Merksatz: Dunkelheit verschluckt Geister.",
    dark: "Merksatz: Finsternis gegen Finsternis bringt wenig.",
    fairy: "Merksatz: Feenlicht vertreibt Dunkelheit.",
  },
  steel: {
    fire: "Merksatz: Feuer macht Metall weich.",
    water: "Merksatz: Wasser rostet und bremst Metall.",
    electric: "Merksatz: Strom läuft durch Metall.",
    ice: "Merksatz: Metall zerbricht Eis.",
    rock: "Merksatz: Stahlwerkzeuge zertrümmern Gestein.",
    steel: "Merksatz: Metall gegen Metall prallt ab.",
    fairy: "Merksatz: Stahl schneidet durch Feenmagie.",
  },
  fairy: {
    fire: "Merksatz: Feuer brennt Feenstaub weg.",
    fighting: "Merksatz: Feen entwaffnen rohe Kraft.",
    poison: "Merksatz: Gift verdirbt Feenmagie.",
    dragon: "Merksatz: Märchenfeen besiegen Drachen.",
    dark: "Merksatz: Feenlicht vertreibt Dunkelheit.",
    steel: "Merksatz: Stahl schneidet durch Feenmagie.",
  },
};

function baseReason(attackType, defenseType, value) {
  const attack = typeName(attackType);
  const defense = typeName(defenseType);
  const note = matchupNotes[attackType]?.[defenseType] ?? "Merksatz: Keine besondere Typ-Regel, also normaler Schaden.";
  if (value === 0) return `${defense} ist immun gegen ${attack}. ${note}`;
  if (value === 0.5) return `${defense} widersteht ${attack}. ${note}`;
  if (value === 2) return `${defense} ist schwach gegen ${attack}. ${note}`;
  return `${attack} trifft ${defense} normal. ${note}`;
}

function renderExplanation(container, attackType, defenseTypes) {
  const values = defenseTypes.map((defenseType) => ({
    defenseType,
    value: baseEffectiveness(attackType, defenseType),
  }));
  const total = values.reduce((sum, item) => sum * item.value, 1);

  container.innerHTML = "";
  values.forEach((item) => {
    const row = document.createElement("div");
    row.className = "explanation-row";
    row.append(chip(item.defenseType, formatMultiplier(item.value)));

    const text = document.createElement("span");
    text.textContent = baseReason(attackType, item.defenseType, item.value);
    row.append(text);
    container.append(row);
  });

  const totalRow = document.createElement("div");
  totalRow.className = "explanation-row explanation-total";
  const formula = values.map((item) => formatMultiplier(item.value)).join(" × ");
  totalRow.textContent =
    defenseTypes.length > 1
      ? `Doppeltyp-Rechnung: ${formula} = ${formatMultiplier(total)}.`
      : `Gesamt: ${formatMultiplier(total)}.`;
  container.append(totalRow);
  container.hidden = false;
}

function makeOption(type, selected = false) {
  const option = document.createElement("option");
  option.value = type.id;
  option.textContent = type.name;
  option.selected = selected;
  return option;
}

function populateSelect(select, { includeNone = false, selected = null } = {}) {
  select.innerHTML = "";
  if (includeNone) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Keiner";
    option.selected = !selected;
    select.append(option);
  }
  TYPES.forEach((type, index) => select.append(makeOption(type, selected ? type.id === selected : index === 0 && !includeNone)));
}

function chip(typeId, extraText = "") {
  const item = document.createElement("span");
  item.className = "mini-chip";
  item.style.setProperty("--type-color", typeById[typeId].color);
  item.innerHTML = `${typeName(typeId)}${extraText ? `<span class="chip-value">${extraText}</span>` : ""}`;
  return item;
}

function labelChip(label, extraText = "") {
  const item = document.createElement("span");
  item.className = "mini-chip neutral-chip";
  item.append(document.createTextNode(label));
  if (extraText) {
    const value = document.createElement("span");
    value.className = "chip-value";
    value.textContent = extraText;
    item.append(value);
  }
  return item;
}

const pokeApiBaseUrl = "https://pokeapi.co/api/v2";
const typePokemonCache = new Map();
const pokemonDetailCache = new Map();
const speciesNameCache = new Map();
const pokemonExampleCache = new Map();

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 3500);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

const fallbackPokemonExamples = {
  normal: {
    name: "Rattfratz",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/19.png",
    types: ["normal"],
  },
  fire: {
    name: "Glumanda",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png",
    types: ["fire"],
  },
  water: {
    name: "Schiggy",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png",
    types: ["water"],
  },
  electric: {
    name: "Pikachu",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
    types: ["electric"],
  },
  grass: {
    name: "Endivie",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/152.png",
    types: ["grass"],
  },
  ice: {
    name: "Schneppke",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/361.png",
    types: ["ice"],
  },
  fighting: {
    name: "Menki",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/56.png",
    types: ["fighting"],
  },
  poison: {
    name: "Rettan",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/23.png",
    types: ["poison"],
  },
  ground: {
    name: "Sandan",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/27.png",
    types: ["ground"],
  },
  flying: {
    name: "Boreos",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/641.png",
    types: ["flying"],
  },
  psychic: {
    name: "Abra",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/63.png",
    types: ["psychic"],
  },
  bug: {
    name: "Raupy",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10.png",
    types: ["bug"],
  },
  rock: {
    name: "Mogelbaum",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/185.png",
    types: ["rock"],
  },
  ghost: {
    name: "Traunfugil",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/200.png",
    types: ["ghost"],
  },
  dragon: {
    name: "Dratini",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/147.png",
    types: ["dragon"],
  },
  dark: {
    name: "Nachtara",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/197.png",
    types: ["dark"],
  },
  steel: {
    name: "Klikk",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/599.png",
    types: ["steel"],
  },
  fairy: {
    name: "Piepi",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/35.png",
    types: ["fairy"],
  },
};

function comboKey(types) {
  return [...types].sort().join("|");
}

function formatPokemonName(name) {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function renderPokemonLoading(container, defenseTypes) {
  container.hidden = false;
  container.innerHTML = `
    <div class="pokemon-art placeholder">?</div>
    <div class="pokemon-copy">
      <p class="pokemon-kicker">Pokémon-Beispiel</p>
      <p class="pokemon-name">Lade passendes Pokémon...</p>
      <div class="pokemon-types"></div>
    </div>
  `;
  const typeContainer = container.querySelector(".pokemon-types");
  defenseTypes.forEach((typeId) => typeContainer.append(chip(typeId)));
}

function renderPokemonCard(container, pokemon) {
  container.hidden = false;
  container.innerHTML = "";

  const art = document.createElement("div");
  art.className = "pokemon-art";
  if (pokemon.sprite) {
    const image = document.createElement("img");
    image.src = pokemon.sprite;
    image.alt = pokemon.name;
    image.loading = "lazy";
    art.append(image);
  } else {
    art.classList.add("placeholder");
    art.textContent = "?";
  }

  const copy = document.createElement("div");
  copy.className = "pokemon-copy";

  const kicker = document.createElement("p");
  kicker.className = "pokemon-kicker";
  kicker.textContent = "Pokémon-Beispiel";

  const name = document.createElement("p");
  name.className = "pokemon-name";
  name.textContent = pokemon.name;

  const types = document.createElement("div");
  types.className = "pokemon-types";
  pokemon.types.forEach((typeId) => types.append(chip(typeId)));

  copy.append(kicker, name, types);
  container.append(art, copy);
}

function renderPokemonUnavailable(container, defenseTypes) {
  container.hidden = false;
  container.innerHTML = "";
  const art = document.createElement("div");
  art.className = "pokemon-art placeholder";
  art.textContent = "?";

  const copy = document.createElement("div");
  copy.className = "pokemon-copy";
  const kicker = document.createElement("p");
  kicker.className = "pokemon-kicker";
  kicker.textContent = "Pokémon-Beispiel";
  const name = document.createElement("p");
  name.className = "pokemon-name";
  name.textContent = "Online nicht geladen";
  const types = document.createElement("div");
  types.className = "pokemon-types";
  defenseTypes.forEach((typeId) => types.append(chip(typeId)));
  copy.append(kicker, name, types);
  container.append(art, copy);
}

async function fetchTypePokemon(typeId) {
  if (typePokemonCache.has(typeId)) return typePokemonCache.get(typeId);
  const response = await fetchWithTimeout(`${pokeApiBaseUrl}/type/${typeId}`);
  if (!response.ok) throw new Error(`Typ konnte nicht geladen werden: ${typeId}`);
  const data = await response.json();
  const pokemon = data.pokemon.map((entry) => ({
    name: entry.pokemon.name,
    url: entry.pokemon.url,
  }));
  typePokemonCache.set(typeId, pokemon);
  return pokemon;
}

async function fetchSpeciesName(speciesUrl, fallbackName) {
  if (!speciesUrl) return formatPokemonName(fallbackName);
  if (speciesNameCache.has(speciesUrl)) return speciesNameCache.get(speciesUrl);

  try {
    const response = await fetchWithTimeout(speciesUrl);
    if (!response.ok) throw new Error("Speziesname nicht gefunden");
    const data = await response.json();
    const germanName = data.names.find((entry) => entry.language.name === "de")?.name;
    const name = germanName || formatPokemonName(fallbackName);
    speciesNameCache.set(speciesUrl, name);
    return name;
  } catch {
    const name = formatPokemonName(fallbackName);
    speciesNameCache.set(speciesUrl, name);
    return name;
  }
}

async function fetchPokemonDetail(candidate) {
  if (pokemonDetailCache.has(candidate.name)) return pokemonDetailCache.get(candidate.name);

  const response = await fetchWithTimeout(candidate.url);
  if (!response.ok) throw new Error(`Pokémon konnte nicht geladen werden: ${candidate.name}`);
  const data = await response.json();
  const name = await fetchSpeciesName(data.species?.url, data.name);
  const detail = {
    name,
    sprite: data.sprites?.other?.["official-artwork"]?.front_default || data.sprites?.front_default || "",
    types: data.types.sort((a, b) => a.slot - b.slot).map((entry) => entry.type.name),
  };
  pokemonDetailCache.set(candidate.name, detail);
  return detail;
}

function candidateIntersection(lists) {
  if (lists.length === 1) return lists[0];
  const [firstList, ...restLists] = lists;
  const restNames = restLists.map((list) => new Set(list.map((entry) => entry.name)));
  return firstList.filter((entry) => restNames.every((names) => names.has(entry.name)));
}

async function findPokemonExample(defenseTypes) {
  const key = comboKey(defenseTypes);
  if (pokemonExampleCache.has(key)) return pokemonExampleCache.get(key);
  if (defenseTypes.length === 1 && fallbackPokemonExamples[key]) return fallbackPokemonExamples[key];

  const typeLists = await Promise.all(defenseTypes.map(fetchTypePokemon));
  const candidates = shuffle(candidateIntersection(typeLists));
  const wantedKey = comboKey(defenseTypes);

  for (const candidate of candidates) {
    const detail = await fetchPokemonDetail(candidate);
    if (comboKey(detail.types) === wantedKey) {
      pokemonExampleCache.set(key, detail);
      return detail;
    }
  }

  if (candidates.length) {
    const detail = await fetchPokemonDetail(candidates[0]);
    pokemonExampleCache.set(key, detail);
    return detail;
  }

  if (fallbackPokemonExamples[key]) return fallbackPokemonExamples[key];
  return null;
}

async function renderPokemonExample(container, defenseTypes) {
  const key = comboKey(defenseTypes);
  container.dataset.comboKey = key;
  renderPokemonLoading(container, defenseTypes);

  try {
    const pokemon = await findPokemonExample(defenseTypes);
    if (container.dataset.comboKey !== key) return;
    if (pokemon) renderPokemonCard(container, pokemon);
    else renderPokemonUnavailable(container, defenseTypes);
  } catch {
    if (container.dataset.comboKey !== key) return;
    const fallback = fallbackPokemonExamples[key];
    if (fallback) renderPokemonCard(container, fallback);
    else renderPokemonUnavailable(container, defenseTypes);
  }
}

function renderOrbit() {
  const orbit = $("#typeOrbit");
  orbit.innerHTML = "";
  TYPES.forEach((type) => {
    const item = document.createElement("span");
    item.className = "type-chip";
    item.style.setProperty("--type-color", type.color);
    item.textContent = type.name;
    orbit.append(item);
  });
}

function updateAttackResult() {
  const attackType = $("#attackType").value;
  const defenseTypes = selectedDefenseTypes($("#defenseTypeOne").value, $("#defenseTypeTwo").value);
  const total = totalEffectiveness(attackType, defenseTypes);

  $("#attackMultiplier").textContent = formatMultiplier(total);
  $("#attackTitle").textContent = multiplierLabel(total);

  const breakdown = $("#attackBreakdown");
  breakdown.innerHTML = "";
  defenseTypes.forEach((defenseType) => {
    const value = baseEffectiveness(attackType, defenseType);
    breakdown.append(chip(defenseType, formatMultiplier(value)));
  });
  renderPokemonExample($("#attackPokemonExample"), defenseTypes);
  renderExplanation($("#attackExplanation"), attackType, defenseTypes);
}

function matchupBuckets(defenseTypes) {
  const buckets = { weak: [], resist: [], immune: [] };
  TYPES.forEach((attackType) => {
    const value = totalEffectiveness(attackType.id, defenseTypes);
    const entry = { type: attackType.id, value };
    if (value === 0) buckets.immune.push(entry);
    if (value > 1) buckets.weak.push(entry);
    if (value > 0 && value < 1) buckets.resist.push(entry);
  });
  return buckets;
}

function renderChipList(container, entries) {
  container.innerHTML = "";
  if (!entries.length) {
    const empty = document.createElement("span");
    empty.className = "empty-note";
    empty.textContent = "Nichts";
    container.append(empty);
    return;
  }

  entries
    .sort((a, b) => b.value - a.value || typeName(a.type).localeCompare(typeName(b.type), "de"))
    .forEach((entry) => container.append(chip(entry.type, formatMultiplier(entry.value))));
}

function updateDefenseResult() {
  const defenseTypes = selectedDefenseTypes($("#ownTypeOne").value, $("#ownTypeTwo").value);
  const buckets = matchupBuckets(defenseTypes);
  $("#defenseName").textContent = defenseTypes.map(typeName).join(" / ");
  renderChipList($("#weaknessList"), buckets.weak);
  renderChipList($("#resistanceList"), buckets.resist);
  renderChipList($("#immunityList"), buckets.immune);
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function makeQuizQuestion(attackType, defenseTypes) {
  return {
    attackType,
    defenseTypes: [...defenseTypes],
    answer: totalEffectiveness(attackType, defenseTypes),
    answered: false,
  };
}

function defenseCombinations(targetMode = quizTargetMode) {
  const singleTypes = TYPES.map((type) => [type.id]);
  const doubleTypes = [];

  TYPES.forEach((firstType, firstIndex) => {
    TYPES.slice(firstIndex + 1).forEach((secondType) => {
      doubleTypes.push([firstType.id, secondType.id]);
    });
  });

  if (targetMode === "single") return singleTypes;
  if (targetMode === "double") return doubleTypes;
  return [...singleTypes, ...doubleTypes];
}

function buildAllQuestions() {
  const combinations = defenseCombinations();
  const questions = [];
  TYPES.forEach((attackType) => {
    combinations.forEach((defenseTypes) => {
      questions.push(makeQuizQuestion(attackType.id, defenseTypes));
    });
  });
  return shuffle(questions).slice(0, roundQuestionCount);
}

function makePracticeQuestion() {
  const attackType = randomItem(TYPES).id;
  const defenseTypes = randomItem(defenseCombinations());
  return makeQuizQuestion(attackType, defenseTypes);
}

function renderQuestion() {
  $("#quizSummary").hidden = true;
  currentQuestion =
    quizMode === "all"
      ? makeQuizQuestion(allQuestions[allIndex].attackType, allQuestions[allIndex].defenseTypes)
      : makePracticeQuestion();
  $("#quizFeedback").textContent = "";
  $("#quizFeedback").hidden = false;
  $("#quizExplanation").hidden = true;
  $("#quizExplanation").innerHTML = "";
  $("#nextQuestionButton").hidden = true;
  $("#nextQuestionButton").textContent = "Weiter";
  $("#quizQuestion").textContent = `Wie effektiv ist ${typeName(currentQuestion.attackType)} gegen dieses Ziel?`;

  const target = $("#quizTarget");
  target.innerHTML = "";
  currentQuestion.defenseTypes.forEach((type) => target.append(chip(type)));
  renderPokemonExample($("#quizPokemonExample"), currentQuestion.defenseTypes);

  const answerGrid = $("#answerGrid");
  answerGrid.innerHTML = "";
  multipliers.forEach((value) => {
    const button = document.createElement("button");
    button.className = "answer-button";
    button.type = "button";
    button.textContent = formatMultiplier(value);
    button.addEventListener("click", () => answerQuestion(value, button));
    answerGrid.append(button);
  });
  updateQuizProgress();
}

function answerQuestion(value, chosenButton) {
  if (!currentQuestion || currentQuestion.answered) return;
  currentQuestion.answered = true;

  const buttons = Array.from(document.querySelectorAll(".answer-button"));
  buttons.forEach((button) => {
    button.disabled = true;
    if (button.textContent === formatMultiplier(currentQuestion.answer)) button.classList.add("correct");
  });

  score.total += 1;
  const isCorrect = value === currentQuestion.answer;
  if (value === currentQuestion.answer) {
    score.correct += 1;
    $("#quizFeedback").textContent = `Richtig: ${formatMultiplier(value)} ist ${multiplierLabel(value).toLowerCase()}.`;
  } else {
    chosenButton.classList.add("wrong");
    $("#quizFeedback").textContent = `Fast: richtig wäre ${formatMultiplier(currentQuestion.answer)}.`;
  }
  if (quizMode === "all") {
    allResults.push({
      attackType: currentQuestion.attackType,
      defenseTypes: [...currentQuestion.defenseTypes],
      answer: currentQuestion.answer,
      chosen: value,
      correct: isCorrect,
    });
  }
  updateScore();
  renderExplanation($("#quizExplanation"), currentQuestion.attackType, currentQuestion.defenseTypes);
  $("#nextQuestionButton").textContent =
    quizMode === "all" && allIndex === allQuestions.length - 1 ? "Auswertung" : "Weiter";
  $("#nextQuestionButton").hidden = false;
}

function updateScore() {
  $("#scoreCorrect").textContent = score.correct;
  $("#scoreTotal").textContent = score.total;
}

function resetScore() {
  score = { correct: 0, total: 0 };
  updateScore();
}

function updateQuizProgress() {
  const targetLabel = targetModeLabels[quizTargetMode];
  $("#quizProgress").textContent =
    quizMode === "all" ? `Frage ${allIndex + 1} von ${roundQuestionCount} · ${targetLabel}` : `Übungsmodus · ${targetLabel}`;
}

function setModeButtons() {
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.quizMode === quizMode);
  });
}

function setTargetModeButtons() {
  document.querySelectorAll(".target-mode-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.targetMode === quizTargetMode);
  });
}

function startPracticeMode() {
  quizMode = "practice";
  allQuestions = [];
  allIndex = 0;
  allResults = [];
  resetScore();
  setModeButtons();
  setTargetModeButtons();
  renderQuestion();
}

function startAllMode() {
  quizMode = "all";
  allQuestions = buildAllQuestions();
  allIndex = 0;
  allResults = [];
  resetScore();
  setModeButtons();
  setTargetModeButtons();
  renderQuestion();
}

function setQuizMode(mode) {
  if (mode === quizMode) return;
  if (mode === "all") startAllMode();
  else startPracticeMode();
}

function setQuizTargetMode(mode) {
  if (mode === quizTargetMode) return;
  quizTargetMode = mode;
  if (quizMode === "all") startAllMode();
  else startPracticeMode();
}

function continueQuiz() {
  if (quizMode !== "all") {
    renderQuestion();
    return;
  }

  if (allIndex >= allQuestions.length - 1) {
    finishAllMode();
    return;
  }

  allIndex += 1;
  renderQuestion();
}

function countBy(items, keyGetter) {
  const counts = new Map();
  items.forEach((item) => {
    const key = keyGetter(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), "de"));
}

function renderProblemTypes(container, entries) {
  container.innerHTML = "";
  if (!entries.length) {
    const empty = document.createElement("span");
    empty.className = "empty-note";
    empty.textContent = "Keine Probleme";
    container.append(empty);
    return;
  }
  entries.slice(0, 8).forEach(([typeId, count]) => {
    container.append(chip(typeId, `${count}x`));
  });
}

function renderProblemMultipliers(container, entries) {
  container.innerHTML = "";
  if (!entries.length) {
    const empty = document.createElement("span");
    empty.className = "empty-note";
    empty.textContent = "Keine Probleme";
    container.append(empty);
    return;
  }
  entries.forEach(([multiplier, count]) => {
    container.append(labelChip(multiplier, `${count}x`));
  });
}

function formulaText(attackType, defenseTypes) {
  return defenseTypes
    .map((defenseType) => `${typeName(defenseType)} ${formatMultiplier(baseEffectiveness(attackType, defenseType))}`)
    .join(" + ");
}

function renderWrongAnswers(wrongAnswers) {
  const list = $("#wrongAnswerList");
  list.innerHTML = "";
  if (!wrongAnswers.length) {
    const empty = document.createElement("p");
    empty.className = "empty-note";
    empty.textContent = "Alles richtig. Sehr sauber gespielt.";
    list.append(empty);
    return;
  }

  wrongAnswers.forEach((answer) => {
    const item = document.createElement("div");
    item.className = "wrong-item";

    const titleLine = document.createElement("div");
    titleLine.className = "wrong-line";
    const title = document.createElement("span");
    title.className = "wrong-title";
    title.textContent = `${typeName(answer.attackType)} gegen`;
    titleLine.append(title);
    answer.defenseTypes.forEach((typeId) => titleLine.append(chip(typeId)));

    const detail = document.createElement("div");
    detail.className = "wrong-detail";
    detail.textContent = `Du: ${formatMultiplier(answer.chosen)} · Richtig: ${formatMultiplier(answer.answer)} (${multiplierLabel(answer.answer)}).`;

    const reason = document.createElement("div");
    reason.className = "wrong-detail";
    reason.textContent = `${formulaText(answer.attackType, answer.defenseTypes)} → ${formatMultiplier(answer.answer)}`;

    item.append(titleLine, detail, reason);
    list.append(item);
  });
}

function finishAllMode() {
  const wrongAnswers = allResults.filter((result) => !result.correct);
  const percent = score.total ? Math.round((score.correct / score.total) * 100) : 0;

  currentQuestion = null;
  $("#quizQuestion").textContent = "Runde geschafft!";
  $("#quizTarget").innerHTML = "";
  $("#quizPokemonExample").hidden = true;
  $("#answerGrid").innerHTML = "";
  $("#quizFeedback").hidden = false;
  $("#quizFeedback").textContent = `Du hattest ${score.correct} von ${score.total} richtig.`;
  $("#quizExplanation").hidden = true;
  $("#nextQuestionButton").hidden = true;
  $("#quizProgress").textContent = "Fertig";

  $("#summaryScore").textContent = `${score.correct} von ${score.total} richtig (${percent}%)`;
  renderProblemTypes($("#problemAttackList"), countBy(wrongAnswers, (answer) => answer.attackType));
  renderProblemTypes(
    $("#problemDefenseList"),
    countBy(
      wrongAnswers.flatMap((answer) => answer.defenseTypes.map((typeId) => ({ typeId }))),
      (entry) => entry.typeId,
    ),
  );
  renderProblemMultipliers(
    $("#problemMultiplierList"),
    countBy(wrongAnswers, (answer) => formatMultiplier(answer.answer)),
  );
  renderWrongAnswers(wrongAnswers);
  $("#quizSummary").hidden = false;
}

function renderMatrix() {
  const table = $("#typeMatrix");
  const head = `<thead><tr><th scope="col" class="matrix-corner">Angriff</th>${TYPES.map((type) => `<th scope="col">${type.name}</th>`).join("")}</tr></thead>`;
  const body = TYPES.map((attackType) => {
    const cells = TYPES.map((defenseType) => {
      const value = baseEffectiveness(attackType.id, defenseType.id);
      const className = `cell-${String(value).replace(".", "")}`;
      return `<td class="${className}">${value === 1 ? "" : formatMultiplier(value)}</td>`;
    }).join("");
    return `<tr><th scope="row">${attackType.name}</th>${cells}</tr>`;
  }).join("");
  table.innerHTML = `${head}<tbody>${body}</tbody>`;
}

function bindTabs() {
  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
      document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
      button.classList.add("active");
      $(`#${button.dataset.view}View`).classList.add("active");
    });
  });
}

function bindInputs() {
  ["#attackType", "#defenseTypeOne", "#defenseTypeTwo"].forEach((selector) => {
    $(selector).addEventListener("change", updateAttackResult);
  });
  ["#ownTypeOne", "#ownTypeTwo"].forEach((selector) => {
    $(selector).addEventListener("change", updateDefenseResult);
  });
  $("#newQuestionButton").addEventListener("click", () => {
    if (quizMode === "all") startAllMode();
    else renderQuestion();
  });
  $("#nextQuestionButton").addEventListener("click", continueQuiz);
  $("#restartAllButton").addEventListener("click", startAllMode);
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.addEventListener("click", () => setQuizMode(button.dataset.quizMode));
  });
  document.querySelectorAll(".target-mode-button").forEach((button) => {
    button.addEventListener("click", () => setQuizTargetMode(button.dataset.targetMode));
  });
  $("#themeToggle").addEventListener("click", toggleTheme);
}

function init() {
  applyTheme(getInitialTheme());
  populateSelect($("#attackType"), { selected: "water" });
  populateSelect($("#defenseTypeOne"), { selected: "ground" });
  populateSelect($("#defenseTypeTwo"), { includeNone: true, selected: "rock" });
  populateSelect($("#ownTypeOne"), { selected: "fire" });
  populateSelect($("#ownTypeTwo"), { includeNone: true, selected: "flying" });

  renderOrbit();
  bindTabs();
  bindInputs();
  updateAttackResult();
  updateDefenseResult();
  renderQuestion();
  renderMatrix();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // Die App funktioniert auch ohne Offline-Cache, z.B. direkt über file://.
    });
  });
}

init();
registerServiceWorker();
