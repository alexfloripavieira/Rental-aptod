import React from 'react';

interface ContratoSucessoModalProps {
  pdfBlob: Blob;
  nomeArquivo: string;
  onClose: () => void;
}

export function ContratoSucessoModal({
  pdfBlob,
  nomeArquivo,
  onClose,
}: ContratoSucessoModalProps) {
  const baixarPdf = () => {
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    a.click();
    URL.revokeObjectURL(url);
  };

  const imprimirPdf = () => {
    const url = URL.createObjectURL(pdfBlob);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    };

    const cleanupIframe = () => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      URL.revokeObjectURL(url);
      window.removeEventListener('focus', cleanupIframe);
    };

    window.addEventListener('focus', cleanupIframe);
  };

  return (
    <div className="text-center py-12">
      <div className="text-green-500 text-6xl mb-4">✓</div>
      <h3 className="text-2xl font-bold mb-4">Contrato Gerado com Sucesso!</h3>
      <p className="text-gray-600 mb-6">
        Seu contrato está pronto. Escolha uma opção abaixo:
      </p>

      <div className="flex justify-center space-x-4">
        <button
          onClick={baixarPdf}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Baixar PDF
        </button>
        <button
          onClick={imprimirPdf}
          className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
        >
          Imprimir
        </button>
        <button
          onClick={onClose}
          className="px-6 py-3 border rounded hover:bg-gray-100 transition"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
