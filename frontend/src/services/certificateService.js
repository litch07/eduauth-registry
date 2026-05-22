import api from './api';

const createPdfBlobUrl = async (certificateId) => {
  const response = await api.get(`/certificates/${certificateId}/pdf`, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'application/pdf' });
  return window.URL.createObjectURL(blob);
};

export const downloadCertificatePDF = async (certificateId, serial) => {
  const url = await createPdfBlobUrl(certificateId);
  const link = document.createElement('a');

  link.href = url;
  link.setAttribute('download', `${serial || `certificate-${certificateId}`}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const previewCertificatePDF = async (certificateId) => {
  const url = await createPdfBlobUrl(certificateId);
  const previewWindow = window.open(url, '_blank', 'noopener,noreferrer');

  if (!previewWindow) {
    window.URL.revokeObjectURL(url);
    throw new Error('Popup blocked. Please allow popups to preview the certificate.');
  }

  window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
  return previewWindow;
};