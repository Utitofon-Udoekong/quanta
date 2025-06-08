import Link from "next/link";
import SearchInput from "@/app/components/ui/SearchInput";
import { Icon } from "@iconify/react";
import { Button } from "@headlessui/react";
import { useUserStore } from '@/app/stores/user';

export default function DiscoverLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = useUserStore((state) => state.user);

    return (
        <div className="flex-1 flex flex-col relative px-8">
            {/* Top Navigation Bar */}
            <nav className="flex items-center gap-x-4 justify-between bg-transparent py-4 mt-4 mb-8 shadow-lg sticky top-0 z-10">
                {/* <div className="flex items-center space-x-4">
                    {['For You', 'Tv Shows', 'Watched'].map((tab) => (
                        <Link
                            href={`/dashboard/${tab.toLowerCase().replace(' ', '-')}`}
                            className={`py-2 text-sm transition-colors ${tab === 'For You' ? 'text-white font-medium' : 'text-gray-300 hover:text-white font-light'}`}
                        >
                            {tab}
                        </Link>
                    ))}
                </div> */}
                <div className="flex-1 flex justify-center">
                    <SearchInput />
                </div>
                <div className="flex items-center space-x-4">
                    <button className="p-2 rounded-full hover:bg-[#212121] transition-colors">
                        <Icon icon="mdi:bell" className="w-6 h-6 text-gray-400" />
                    </button>
                    {user && (
                      <Button className="bg-gradient-to-r from-[#8B25FF] to-[#350FDD] cursor-pointer text-white px-6 py-2 rounded-full font-semibold shadow-lg">Create</Button>
                    )}
                </div>
            </nav>
            {children}
        </div>
    );
}