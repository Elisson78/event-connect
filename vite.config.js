import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Event Connect',
				short_name: 'EventConnect',
				start_url: '/',
				display: 'standalone',
				background_color: '#ffffff',
				theme_color: '#1A73E8',
				description: 'Plataforma de eventos. Conectamos organizadores e participantes.',
				icons: [
					{
						src: '/icons/icon-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any maskable'
					},
					{
						src: '/icons/icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					}
				]
			}
		})
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	server: {
		port: 5173,
		host: true,
	},
	publicDir: 'public', // Garantir que a pasta public seja servida
});

const formatDate = (dateString) => {
	if (!dateString || dateString.trim() === '') return null;
	const date = new Date(dateString);
	if (isNaN(date.getTime())) return null;
	return date.toISOString().split('T')[0];
};
