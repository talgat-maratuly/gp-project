import { OBLASTS_SEED, CITIES_SEED } from '../demo/seed.js'

/** API режимінде CitySelector үшін статикалық география */
export function createStaticGeoStore() {
  return {
    oblasts: OBLASTS_SEED,
    cities: CITIES_SEED,
  }
}

export const STATIC_GEO_STORE = createStaticGeoStore()
