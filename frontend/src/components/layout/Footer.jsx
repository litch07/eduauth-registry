export default function Footer() {
  return (
    <footer className="border-t border-gray-200/70 bg-white/60 px-4 py-5 text-center text-sm text-gray-500 backdrop-blur dark:border-gray-800 dark:bg-gray-950/50 dark:text-gray-400">
      © {new Date().getFullYear()} EduAuth Registry. All rights reserved.
    </footer>
  );
}
