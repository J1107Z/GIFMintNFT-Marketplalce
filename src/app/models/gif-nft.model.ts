export type GifRarity = 'Común' | 'Raro' | 'Épico' | 'Legendario';

export type GifCategory =
  | 'Cyberpunk'
  | 'Anime'
  | 'Gaming'
  | 'Memes'
  | 'Arte 3D'
  | 'Reacciones';

export interface GiphyImageVariant {
  url: string;
  width?: string;
  height?: string;
}

export interface GiphyGifRaw {
  id: string;
  title: string;
  url: string;
  username?: string;
  slug?: string;
  rating?: string;
  images: {
    fixed_height: GiphyImageVariant;
    fixed_height_still?: GiphyImageVariant;
    original: GiphyImageVariant;
    downsized?: GiphyImageVariant;
  };
}

export interface GiphyApiResponse {
  data: GiphyGifRaw[];
  pagination?: {
    total_count: number;
    count: number;
    offset: number;
  };
  meta: {
    status: number;
    msg: string;
  };
}

export interface GiphySingleResponse {
  data: GiphyGifRaw;
  meta: {
    status: number;
    msg: string;
  };
}

export interface GifNft {
  id: string;
  titulo: string;
  gifUrl: string;
  previewUrl: string;
  creador: string;
  precio: number;
  precioEth: number;
  rareza: GifRarity;
  edicion: string;
  categoria: GifCategory;
  popularidad: number;
  tokenHash: string;
  red: string;
}

export const GIF_CATEGORIES: GifCategory[] = [
  'Cyberpunk',
  'Anime',
  'Gaming',
  'Memes',
  'Arte 3D',
  'Reacciones',
];

export const GIF_RARITIES: GifRarity[] = ['Común', 'Raro', 'Épico', 'Legendario'];

// Clase 01: Objeto anidado con propiedades y métodos
export const NFT_MARKET_PROTOCOL = {
  brand: 'GIFMint Market',
  version: '2.1.0',
  network: {
    name: 'Ethereum Sepolia L2',
    chainId: 11155111,
    ethUsdReference: 3000,
    gasFeeUsd: 1.25,
  },
  rarityMultipliers: {
    Común: 1,
    Raro: 1.5,
    Épico: 2.2,
    Legendario: 3.1,
  },
  calculateEth(precioUsd: number): number {
    return Number((precioUsd / this.network.ethUsdReference).toFixed(4));
  },
  formatEdition(seed: number, rareza: GifRarity): string {
    let maxSupply = 50;
    switch (rareza) {
      case 'Legendario':
        maxSupply = 10;
        break;
      case 'Épico':
        maxSupply = 20;
        break;
      case 'Raro':
        maxSupply = 35;
        break;
      default:
        maxSupply = 50;
        break;
    }
    const numeroEdicion = (seed % maxSupply) + 1;
    const padded = numeroEdicion < 10 ? `0${numeroEdicion}` : `${numeroEdicion}`;
    return `#${padded}/${maxSupply}`;
  },
};

// Clase 01: Función regular para calcular hash determinístico a partir del ID de GIPHY
export function computeDeterministicHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) % 1000003;
  }
  return Math.abs(hash);
}

const CATEGORY_SEMANTIC_RULES: { category: GifCategory; patterns: RegExp[] }[] = [
  {
    category: 'Gaming',
    patterns: [
      /\bgta(?:\s*(?:vi|6|v|5|iv|4))?\b|\bgta6\b/i,
      /\bgrand\s+theft\s+auto\b/i,
      /\brockstar(?:\s+games)?\b/i,
      /\b(?:video\s*)?games?\b/i,
      /\bvideogames?\b/i,
      /\bgaming\b/i,
      /\bgamers?\b/i,
      /\bpixel(?:\s*art)?\b/i,
      /\b8\s*bit\b/i,
      /\bretro\s*games?\b/i,
      /\barcade\b/i,
      /\bmario\b/i,
      /\bzelda\b/i,
      /\bpokemon\b/i,
      /\bminecraft\b/i,
      /\bfortnite\b/i,
      /\bvalorant\b/i,
      /\bxbox\b/i,
      /\bplaystation\b/i,
      /\bnintendo\b/i,
      /\besports?\b/i,
      /\brpg\b/i,
      /\bfps\b/i,
      /\bcontroller\b/i,
    ],
  },
  {
    category: 'Anime',
    patterns: [
      /\banime\b/i,
      /\bmanga\b/i,
      /\botaku\b/i,
      /\bchibi\b/i,
      /\bnaruto\b/i,
      /\bgoku\b/i,
      /\bdragon\s*ball\b/i,
      /\bone\s*piece\b/i,
      /\bluffy\b/i,
      /\bdemon\s*slayer\b/i,
      /\bjujutsu(?:\s*kaisen)?\b/i,
      /\bjjk\b/i,
      /\bkawaii\b/i,
      /\bghibli\b/i,
      /\bshonen\b/i,
      /\bsenpai\b/i,
      /\bchainsaw\s*man\b/i,
      /\bspy\s*x\s*family\b/i,
    ],
  },
  {
    category: 'Cyberpunk',
    patterns: [
      /\bcyber(?:punk|space|netic|world)?\b/i,
      /\bneon\b/i,
      /\bsynth(?:wave)?\b/i,
      /\bretrowave\b/i,
      /\bvaporwave\b/i,
      /\bfuturistic\b/i,
      /\bsci\s*fi\b/i,
      /\bmatrix\b/i,
      /\bhologram\b/i,
      /\bglitch\b/i,
      /\bblade\s*runner\b/i,
      /\bandroid\b/i,
    ],
  },
  {
    category: 'Arte 3D',
    patterns: [
      /\b3d\b/i,
      /\babstract\b/i,
      /\brender(?:ing|s)?\b/i,
      /\bblender\b/i,
      /\bc4d\b/i,
      /\bcinema\s*4d\b/i,
      /\bfractal\b/i,
      /\bgeometric\b/i,
      /\bsculpture\b/i,
      /\bkinetic\b/i,
      /\bshader\b/i,
      /\bliquid\b/i,
      /\bchrome\b/i,
      /\bcgi\b/i,
      /\bmotion\s+graphics\b/i,
    ],
  },
  {
    category: 'Memes',
    patterns: [
      /\bmemes?\b/i,
      /\bpedro\s+pascal\b/i,
      /\bcrafture\b/i,
      /\bdoge\b/i,
      /\bpepe\b/i,
      /\bstonks\b/i,
      /\bshrek\b/i,
      /\brick\s*roll\b/i,
      /\bspongebob\b/i,
      /\btroll\b/i,
      /\bchad\b/i,
      /\bsigma\b/i,
      /\bfunny\b/i,
      /\bcomedy\b/i,
      /\bcat\s+meme\b/i,
    ],
  },
  {
    category: 'Reacciones',
    patterns: [
      /\bbored\b/i,
      /\bstill\s+waiting\b/i,
      /\btired\b/i,
      /\bcoffee\b/i,
      /\bsleepy\b/i,
      /\bwaiting\b/i,
      /\blaugh(?:ing|s)?\b/i,
      /\bsmil(?:e|ing)\b/i,
      /\bhappy\b/i,
      /\bsad\b/i,
      /\bcr(?:y|ying)\b/i,
      /\bangry\b/i,
      /\bwow\b/i,
      /\bshocked\b/i,
      /\bsurprised\b/i,
      /\bclapping\b/i,
      /\bapplause\b/i,
      /\bnod(?:ding|s)?\b/i,
      /\bfacepalm\b/i,
      /\bshrug\b/i,
      /\bawkward\b/i,
      /\bcheers\b/i,
      /\breactions?\b/i,
      /\bthumbs\s+up\b/i,
    ],
  },
];

export function buildGifSearchText(
  title: string = '',
  slug: string = '',
  username: string = '',
  id: string = ''
): string {
  const rawSlug = slug.trim();
  const idLower = id.trim().toLowerCase();
  const slugLower = rawSlug.toLowerCase();

  let strippedSlug = rawSlug;
  if (idLower) {
    if (slugLower === idLower) {
      strippedSlug = '';
    } else if (slugLower.endsWith(`-${idLower}`)) {
      strippedSlug = rawSlug.slice(0, rawSlug.length - idLower.length - 1);
    }
  }

  return `${title} ${strippedSlug} ${username}`
    .toLowerCase()
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesCategorySemantics(normalizedText: string, category: GifCategory): boolean {
  const rule = CATEGORY_SEMANTIC_RULES.find((r) => r.category === category);
  return rule ? rule.patterns.some((pattern) => pattern.test(normalizedText)) : false;
}

export function detectSemanticCategory(normalizedText: string): GifCategory | null {
  for (const rule of CATEGORY_SEMANTIC_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalizedText))) {
      return rule.category;
    }
  }
  return null;
}

// Clase 01: Arrow function para inferir categoría semántica analizando título, slug y creador
export const inferCategoryFromGif = (
  title: string,
  hash: number,
  forcedCategory?: GifCategory,
  slug: string = '',
  username: string = '',
  id: string = ''
): GifCategory => {
  const normalizedText = buildGifSearchText(title, slug, username, id);
  const detected = detectSemanticCategory(normalizedText);

  if (forcedCategory) {
    if (!detected) {
      return forcedCategory;
    }
    if (detected === forcedCategory) {
      return forcedCategory;
    }
    // Permite conservar Arte 3D en renders abstractos con iluminación neón
    if (
      forcedCategory === 'Arte 3D' &&
      detected === 'Cyberpunk' &&
      matchesCategorySemantics(normalizedText, 'Arte 3D')
    ) {
      return 'Arte 3D';
    }
    return detected;
  }

  if (detected) {
    return detected;
  }

  // Fallback neutro únicamente entre Reacciones y Memes para evitar contaminar Gaming o Anime
  return hash % 2 === 0 ? 'Reacciones' : 'Memes';
};

// Clase 01: Enriquecimiento determinístico usando destructuring, template strings, null checks y spread
export function enrichGifToNft(raw: GiphyGifRaw, forcedCategory?: GifCategory): GifNft {
  const { id, title, slug, username, images } = raw;
  const seed = computeDeterministicHash(id);

  // Determinar rareza según módulo determinístico
  const bucket = seed % 100;
  let rareza: GifRarity = 'Común';
  if (bucket >= 88) {
    rareza = 'Legendario';
  } else if (bucket >= 68) {
    rareza = 'Épico';
  } else if (bucket >= 38) {
    rareza = 'Raro';
  } else {
    rareza = 'Común';
  }

  // Rango de precios USD ($12 - $240)
  const basePrice = 12 + (seed % 66);
  let rarityBonus = 0;
  switch (rareza) {
    case 'Legendario':
      rarityBonus = 140;
      break;
    case 'Épico':
      rarityBonus = 85;
      break;
    case 'Raro':
      rarityBonus = 38;
      break;
    default:
      rarityBonus = 0;
      break;
  }

  const precio = Math.min(240, Math.max(12, basePrice + rarityBonus));
  const precioEth = NFT_MARKET_PROTOCOL.calculateEth(precio);
  const categoria = inferCategoryFromGif(
    title || '',
    seed,
    forcedCategory,
    slug || '',
    username || '',
    id || ''
  );
  const edicion = NFT_MARKET_PROTOCOL.formatEdition(seed, rareza);
  const popularidad = 60 + (seed % 40);

  const cleanTitle = (title || '').trim();
  const tituloFinal = cleanTitle.length > 0 ? cleanTitle : `${categoria} Drop #${seed % 999}`;
  const creadorFinal = username?.trim() || 'GIFMint Studio';

  const gifUrl =
    images?.original?.url || images?.downsized?.url || images?.fixed_height?.url || '';
  const previewUrl =
    images?.fixed_height?.url || images?.downsized?.url || images?.original?.url || '';

  return {
    id,
    titulo: tituloFinal,
    gifUrl,
    previewUrl,
    creador: creadorFinal,
    precio,
    precioEth,
    rareza,
    edicion,
    categoria,
    popularidad,
    tokenHash: `0x${seed.toString(16).padStart(6, '0')}a9f`,
    red: NFT_MARKET_PROTOCOL.network.name,
  };
}

// Clase 01: Demostración explícita de map, filter, find, findLast, every, reduce, concat, push, pop y ciclos
export function summarizeCatalogAnalytics(nfts: GifNft[]) {
  const safeCopy = [...nfts];
  const prices = safeCopy.map((item) => item.precio);
  const legendarios = safeCopy.filter((item) => item.rareza === 'Legendario');
  const firstRare = safeCopy.find((item) => item.rareza === 'Raro') || null;
  const lastFeatured = safeCopy.findLast((item) => item.popularidad >= 70) || null;
  const allValidPrices = prices.every((p) => p >= 12 && p <= 240);
  const totalValue = prices.reduce((acc, p) => acc + p, 0);

  const combinedTags = ['NFT', 'GIF'].concat(GIF_CATEGORIES);
  const stackDemo = [...combinedTags];
  stackDemo.push('Verified');
  const lastTag = stackDemo.pop() || 'NFT';

  const byCategory: Record<string, number> = {};
  for (const nft of safeCopy) {
    byCategory[nft.categoria] = (byCategory[nft.categoria] || 0) + 1;
  }

  const categorySummary: string[] = [];
  for (const key in byCategory) {
    categorySummary.push(`${key}: ${byCategory[key]}`);
  }

  return {
    totalCount: safeCopy.length,
    legendaryCount: legendarios.length,
    firstRareTitle: firstRare?.titulo || 'Ninguno',
    lastPopularTitle: lastFeatured?.titulo || 'Ninguno',
    allValidPrices,
    averagePrice: safeCopy.length > 0 ? Math.round(totalValue / safeCopy.length) : 0,
    lastTag,
    categorySummary,
  };
}
