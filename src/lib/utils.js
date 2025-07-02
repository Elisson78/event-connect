import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export function formatPrice(price) {
	if (!price && price !== 0) return 'Gratuito';
	
	const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9,.]/g, '').replace(',', '.')) : price;
	
	if (numericPrice === 0) return 'Gratuito';
	
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(numericPrice);
}