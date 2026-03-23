import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Logo from '@/assets/images/green-logo.svg';
import homeIcon from '@/assets/icons/home.png';
import inboxIcon from '@/assets/icons/inbox.png';
import bookingIcon from '@/assets/icons/booking.png';
import storeIcon from '@/assets/icons/booking.png';
import glitfinderIcon from '@/assets/icons/glitfinder.png';
import NotificationIcon from '@/assets/icons/notification.png';
import SettingsIcon from '@/assets/icons/settings.png';

export type SideNavProps = {
  /** When true, slide-in drawer is visible (screens below `lg`). */
  mobileOpen?: boolean;
  /** Close drawer after navigation or backdrop tap. */
  onCloseMobile?: () => void;
};

const SideNav = ({ mobileOpen = false, onCloseMobile }: SideNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);

  const baseMenuItems = [
    { label: 'Home', icon: homeIcon, path: '/' },
    { label: 'Inbox', icon: inboxIcon, path: '/inbox' },
    { label: 'Notifications', icon: NotificationIcon, path: '/notifications' },
    { label: 'Bookings', icon: bookingIcon, path: '/bookings' },
  ];

  const vendorMenuItems = [
    { label: 'Store', icon: storeIcon, path: '/vendor/store' },
    { label: 'Services', icon: storeIcon, path: '/vendor/services' },
  ];

  const commonMenuItems = [
    { label: 'Glitfinder', icon: glitfinderIcon, path: '/glitfinder' },
    { label: 'Settings', icon: SettingsIcon, path: '/settings' },
  ];

  const menuItems = user?.activeRole === 'vendor'
    ? [...baseMenuItems, ...vendorMenuItems, ...commonMenuItems]
    : [...baseMenuItems, ...commonMenuItems];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/home';
    }
    return location.pathname.startsWith(path);
  };

  const go = (path: string) => {
    navigate(path);
    onCloseMobile?.();
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen ? (
        <div
          role="presentation"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => onCloseMobile?.()}
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 h-full w-[min(280px,88vw)] sm:w-[245px] z-50 lg:z-10 bg-white flex flex-col py-6 sm:py-8 px-4 sm:px-6 border-r border-[#F0F0F0] transition-transform duration-200 ease-out shadow-xl lg:shadow-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
        aria-hidden={false}
      >
      <div className="mb-6 sm:mb-8 flex items-center justify-between gap-2">
        <div className="cursor-pointer" onClick={() => go('/')}>
          <img src={Logo} alt="Logo" className="w-8" />
        </div>
        <button
          type="button"
          className="lg:hidden p-2 rounded-lg hover:bg-gray-50 text-[#0A0A0A] -mr-1"
          aria-label="Close navigation"
          onClick={() => onCloseMobile?.()}
        >
          <span className="text-2xl leading-none">&times;</span>
        </button>
      </div>

      <div className="flex flex-col gap-1 sm:gap-2 overflow-y-auto flex-1 min-h-0 pb-6">
        {menuItems.map((item) => {
          const active = isActive(item.path);

          return (
            <div
              key={item.label}
              onClick={() => go(item.path)}
              className={`flex items-center gap-3 py-3 px-4 rounded-xl cursor-pointer transition-all ${
                active ? 'bg-[#F2FFEC]' : 'hover:bg-gray-50'
              }`}
            >
                <img src={item.icon} alt="" className="w-[18px] shrink-0" />
              <span
                className={`text-[14px] font-medium ${
                  active ? 'text-primary' : 'text-[#6C6C6C]'
                } ${item.label === 'Notifications' && active ? '' : ''}`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
      </aside>
    </>
  );
};

export default SideNav;
