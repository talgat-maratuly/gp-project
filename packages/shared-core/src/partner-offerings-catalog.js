/** Re-export subservice map for onboarding (avoids circular imports in api) */
export const SUBSERVICE_TO_DIRECTION = {
  'gp-shop': 'SHOP',
  'gp-nursery': 'NURSERY',
  'septic-pumping': 'SEPTIC',
  'grass-mowing': 'LAWN',
  'lawn-trim': 'LAWN',
  'lawn-roll-prep': 'LAWN',
  'lawn-seeding': 'LAWN',
  'lawn-roll': 'LAWN',
  'irrigation-tuning': 'AUTOWATERING',
  'irrigation-maintenance': 'AUTOWATERING',
  'irrigation-mount': 'AUTOWATERING',
  'filter-maintenance': 'FILTERS',
  'filter-cartridge': 'FILTERS',
  'filter-install': 'FILTERS',
  'pump-service': 'PUMPS',
}
