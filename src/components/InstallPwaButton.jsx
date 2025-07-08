import React, { useEffect, useState } from 'react';
import { Download, Smartphone, Info } from 'lucide-react';

const isIos = () =>
  /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
const isDesktop = () => window.innerWidth > 768;

const InstallPwaButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosModal, setShowIosModal] = useState(false);
  const [showDesktopModal, setShowDesktopModal] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = (e) => {
    e.preventDefault();
    if (isIos()) {
      setShowIosModal(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    } else {
      // Fallback: sempre mostra modal de instrução
      if (isDesktop()) {
        setShowDesktopModal(true);
      } else {
        setShowIosModal(true);
      }
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition-all text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Instalar o aplicativo no seu dispositivo"
      >
        <Download className="h-5 w-5" /> Instalar App
      </button>
      {showIosModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm text-center shadow-xl">
            <h2 className="text-xl font-bold mb-2 flex items-center justify-center gap-2"><Smartphone className="h-5 w-5 text-blue-600" /> Instale no iPhone</h2>
            <p className="mb-4 text-gray-700">
              Toque no <span className="font-bold">ícone de compartilhar</span> <span role="img" aria-label="share">⬆️</span> e depois em <b>"Adicionar à Tela de Início"</b>.<br/>
              Assim você terá acesso rápido ao Event Connect!
            </p>
            <img src="/icons/icon-192x192.png" alt="App Icon" className="mx-auto mb-4 w-16 h-16 rounded-full border shadow" />
            <button
              onClick={() => setShowIosModal(false)}
              className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded font-semibold hover:bg-blue-200"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
      {showDesktopModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm text-center shadow-xl">
            <h2 className="text-xl font-bold mb-2 flex items-center justify-center gap-2"><Info className="h-5 w-5 text-blue-600" /> Instale no Desktop</h2>
            <p className="mb-4 text-gray-700">
              No seu navegador, procure o ícone <b>"Instalar"</b> na barra de endereços ou no menu do navegador.<br/>
              <span className="text-sm text-gray-500">(Chrome, Edge, Brave, Opera, etc.)</span>
            </p>
            <img src="/icons/icon-192x192.png" alt="App Icon" className="mx-auto mb-4 w-16 h-16 rounded-full border shadow" />
            <button
              onClick={() => setShowDesktopModal(false)}
              className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded font-semibold hover:bg-blue-200"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallPwaButton; 