/**
 * Edit this file to change delivery areas and charges.
 * Zones are evaluated in order; the first match wins.
 */
export type DeliveryZoneRule = {
  id: string;
  label: string;
  charge: number;
  handlingCharge: number;
  cities?: string[];
  states?: string[];
  countryCodes?: string[];
  countryNames?: string[];
};

export const DELIVERY_CONFIG = {
  unavailableMessage: 'Delivery not available',
  zones: [
    {
      id: 'local',
      label: 'Local delivery area',
      charge: 30,
      handlingCharge: 5,
      cities: ['Hoshiarpur'],
    },
    {
      id: 'nearby',
      label: 'Nearby area',
      charge: 40,
      handlingCharge: 8,
      states: ['Punjab'],
    },
    {
      id: 'india',
      label: 'Other supported areas',
      charge: 60,
      handlingCharge: 15,
      countryCodes: ['IN'],
      countryNames: ['India'],
    },
    {
      id: 'us',
      label: 'United States',
      charge: 80,
      handlingCharge: 15,
      countryCodes: ['US'],
      countryNames: ['United States'],
    },
  ] satisfies DeliveryZoneRule[],
};
