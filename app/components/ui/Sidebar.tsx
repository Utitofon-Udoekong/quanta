import Link from 'next/link';

export default function Sidebar() {
  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Articles', href: '/dashboard/articles', icon: '📝' },
    { name: 'Videos', href: '/dashboard/videos', icon: '🎬' },
    { name: 'Audio', href: '/dashboard/audio', icon: '🎧' },
  ];
  
  return (
    <aside className="bg-gray-800 text-white w-64 min-h-screen p-4">
      <nav className="mt-8">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="flex items-center space-x-3 p-3 rounded hover:bg-gray-700"
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}