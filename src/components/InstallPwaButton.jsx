import React, { useEffect, useState } from 'react';

const isIos = () =>
  /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

const InstallPwaButton = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosModal, setShowIosModal] = useState(false);

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
      alert('Se o botão de instalar não aparecer, tente atualizar a página ou use o menu do navegador.');
    }
  };

  return (
    <>
      <span onClick={handleInstallClick} style={{ display: 'inline-block', cursor: 'pointer' }}>
        {children}
      </span>
      {showIosModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm text-center">
            <h2 className="text-xl font-bold mb-2">Instale no iPhone</h2>
            <p className="mb-4">
              Toque no <span className="font-bold">ícone de compartilhar</span> <span role="img" aria-label="share">⬆️</span> e depois em <b>"Adicionar à Tela de Início"</b>.
            </p>
            <img src="/icons/icon-192x192.png" alt="App Icon" className="mx-auto mb-4 w-16 h-16" />
            <button
              onClick={() => setShowIosModal(false)}
              className="mt-2 px-4 py-2 bg-gray-200 rounded"
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