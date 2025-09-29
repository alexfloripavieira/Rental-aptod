import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { DocumentoUpload } from '../../../types/inquilino';

export function DocumentosUpload() {
  const [documentos, setDocumentos] = useState<DocumentoUpload[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: (files) => {
      const novosDocumentos = files.map(file => ({
        file,
        tipo: 'OUTROS' as const,
        preview: file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : undefined,
      }));
      setDocumentos(prev => [...prev, ...novosDocumentos]);
    },
  });

  const removerDocumento = (index: number) => {
    setDocumentos(prev => {
      const documento = prev[index];
      if (documento.preview) {
        URL.revokeObjectURL(documento.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Documentos (Opcional)
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Faça upload dos documentos do inquilino. Arquivos aceitos: PDF, JPG, PNG (máximo 5MB cada).
        </p>

        {/* Área de Upload */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20'
              : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
          }`}
        >
          <input {...getInputProps()} />
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" aria-hidden="true" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {isDragActive
              ? 'Solte os arquivos aqui...'
              : 'Arraste arquivos aqui ou clique para selecionar'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            PDF, JPG, PNG (máx. 5MB cada)
          </p>
        </div>

        {/* Lista de Documentos */}
        {documentos.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Documentos Selecionados ({documentos.length})
            </h4>
            <div className="space-y-2">
              {documentos.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-500"
                >
                  <div className="flex items-center space-x-3">
                    {doc.preview ? (
                      <img
                        src={doc.preview}
                        alt="Preview"
                        className="h-10 w-10 object-cover rounded border"
                      />
                    ) : (
                      <div className="h-10 w-10 flex items-center justify-center bg-red-100 rounded border">
                        <DocumentIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {doc.file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-300">
                        {formatFileSize(doc.file.size)} • {doc.file.type || 'Tipo desconhecido'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removerDocumento(index)}
                    className="ml-3 text-red-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded"
                    title="Remover documento"
                  >
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dicas de documentos */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h5 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            Documentos recomendados:
          </h5>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• RG ou CNH (frente e verso)</li>
            <li>• Comprovante de renda (últimos 3 meses)</li>
            <li>• Comprovante de residência</li>
            <li>• Para PJ: Contrato social ou CNPJ</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
