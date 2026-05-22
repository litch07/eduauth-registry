import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, Download } from 'lucide-react';
import { cn } from '../../../utils/helpers';

export default function CSVUpload({ onFileAccepted, disabled }) {
  const [file, setFile] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const acceptedFile = acceptedFiles[0];
      setFile(acceptedFile);
      onFileAccepted(acceptedFile);
    }
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    disabled,
  });

  const handleDownloadSample = () => {
    const csvContent = "student_id,cgpa,degree_class,issue_date,convocation_date\n0112330154,3.75,First Class,2024-05-15,2024-06-20\n0112330155,3.50,Second Class,2024-05-15,2024-06-20\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_students.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
        <div className="flex justify-end">
            <button
                type="button"
                onClick={handleDownloadSample}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
                <Download className="h-4 w-4" />
                Download Sample CSV
            </button>
        </div>
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition',
          isDragActive ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600',
          disabled ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-800' : 'hover:border-primary-400 dark:hover:border-primary-500'
        )}
      >
        <input {...getInputProps()} />
        <div className="rounded-full bg-gray-100 p-3 dark:bg-gray-800">
          <UploadCloud className="h-8 w-8 text-gray-500 dark:text-gray-400" />
        </div>
        <p className="mt-4 font-semibold text-gray-700 dark:text-gray-300">
          {isDragActive ? 'Drop the file here...' : 'Drag & drop a CSV file here, or click to select'}
        </p>
        <p className="mt-1 text-xs text-gray-500">CSV file, max 100 students</p>
      </div>
      {file && (
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <FileIcon className="h-6 w-6 flex-shrink-0 text-gray-500" />
          <div className="flex-grow">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
          </div>
        </div>
      )}
    </div>
  );
}
