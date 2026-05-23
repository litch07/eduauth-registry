import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function ProgressModal({ isOpen, processed, total, errors }) {
  const progress = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  Issuing Certificates...
                </Dialog.Title>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Please wait while the system processes the batch. Do not close this window.
                  </p>

                  <div className="mt-4">
                    <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span>Progress</span>
                      <span>{processed} / {total}</span>
                    </div>
                    <div className="mt-1 h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-2.5 rounded-full bg-primary-600 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {errors.length > 0 && (
                    <div className="mt-4 max-h-40 overflow-y-auto rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                      <h4 className="font-semibold text-red-800 dark:text-red-200">Errors Encountered</h4>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700 dark:text-red-300">
                        {errors.map((err, i) => (
                          <li key={i}>Row {err.row}: {err.error} (Student ID: {err.student_id})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
