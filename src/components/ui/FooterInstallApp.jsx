import React from 'react';
import { QRCode } from 'react-qrcode-logo';

const APP_URL = 'https://eventconnect.com'; // Altere para a URL real do seu PWA

const appStoreImg = 'https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg';
const googlePlayImg = 'https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg';

const FooterInstallApp = () => {
  return (
    <footer className="w-full bg-gray-100 py-8 border-t mt-12">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 px-4">
        <div className="flex flex-col items-center">
          <QRCode value={APP_URL} size={120} logoImage="/logo192.png" qrStyle="dots" eyeRadius={5} />
          <span className="mt-2 text-gray-600 text-sm">Escaneie para acessar o Event Connect</span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <span className="text-lg font-semibold text-gray-800 mb-2">Instale o Event Connect no seu dispositivo</span>
          <div className="flex gap-3">
            <a href={APP_URL} target="_blank" rel="noopener noreferrer">
              <img src={appStoreImg} alt="Baixar na App Store" className="h-12" />
            </a>
            <a href={APP_URL} target="_blank" rel="noopener noreferrer">
              <img src={googlePlayImg} alt="Disponível no Google Play" className="h-12" />
            </a>
          </div>
        </div>
      </div>
      <div className="text-center text-gray-400 text-xs mt-6">&copy; {new Date().getFullYear()} Event Connect. Todos os direitos reservados.</div>
    </footer>
  );
};

export default FooterInstallApp; 