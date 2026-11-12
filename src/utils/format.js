import { config } from '../data/config.js';

const formatter = new Intl.NumberFormat(config.currency.locale, {
  style: 'currency',
  currency: config.currency.code,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatPrice = (value) => formatter.format(Number(value) || 0);
