export const formatDateCH = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatNumberCH = (num: number) =>
  num.toLocaleString('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatCurrencyCHF = (value: number) =>
  value.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF' }); 