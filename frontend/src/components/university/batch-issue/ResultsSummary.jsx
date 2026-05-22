import { CheckCircle, XCircle, Download } from 'lucide-react';
import Card from '../../shared/Card';

export default function ResultsSummary({ results, onReset }) {
  const { processed, failed, errors } = results;

  const handleDownloadFailed = () => {
    if (!errors || errors.length === 0) return;

    const csvHeader = "row,student_id,error\n";
    const csvRows = errors.map(e => `${e.row},${e.student_id},"${e.error.replace(/"/g, '""')}"`).join("\n");
    const csvContent = csvHeader + csvRows;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'failed_rows.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Batch Processing Complete</h2>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Successfully Issued</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{processed}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Failed Rows</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{failed}</p>
            </div>
          </div>
        </div>

        {errors && errors.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Error Details</h3>
            <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border p-3 dark:border-gray-700">
              <ul className="space-y-2">
                {errors.map((err, i) => (
                  <li key={i} className="text-sm text-red-700 dark:text-red-300">
                    <span className="font-medium">Row {err.row}:</span> {err.error} (Student ID: {err.student_id})
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={handleDownloadFailed}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              <Download className="h-4 w-4" />
              Download Failed Rows
            </button>
          </div>
        )}

        <div className="border-t pt-4 dark:border-gray-700">
          <button
            onClick={onReset}
            className="w-full rounded-lg bg-primary-600 px-6 py-3 text-base font-medium text-white transition hover:bg-primary-700"
          >
            Issue Another Batch
          </button>
        </div>
      </div>
    </Card>
  );
}
