export default function Layout({ children }) {
  return (
    <main className="bg-black text-gray-300 h-full px-4 py-10 text-center">
      <a
        className="bg-red-600 p-1 cursor-pointer rounded-sm outline-none"
        href={`/`}
      >
        Home
      </a>

      <div className="mt-8">{children}</div>
      
    </main>
  );
}
