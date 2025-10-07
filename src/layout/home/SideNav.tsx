import { useNavigate, useLocation } from 'react-router-dom';
import { GoHome } from 'react-icons/go';
import { BsChatDots } from 'react-icons/bs';
import { IoNotificationsOutline } from 'react-icons/io5';
import { BsCalendar3 } from 'react-icons/bs';
import { MdOutlineTravelExplore } from 'react-icons/md';
import { IoSettingsOutline } from 'react-icons/io5';
import Logo from '@/assets/images/green-logo.svg';

const SideNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: 'Home', icon: GoHome, path: '/' },
    { label: 'Inbox', icon: BsChatDots, path: '/inbox' },
    {
      label: 'Notifications',
      icon: IoNotificationsOutline,
      path: '/notifications',
    },
    { label: 'Bookings', icon: BsCalendar3, path: '/bookings' },
    { label: 'Glitfinder', icon: MdOutlineTravelExplore, path: '/glitfinder' },
    { label: 'Settings', icon: IoSettingsOutline, path: '/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/home';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed left-0 h-full w-[245px] z-10 bg-white flex flex-col py-8 px-6">
      {/* Logo */}
      <div className="mb-12 cursor-pointer" onClick={() => navigate('/')}>
        <img src={Logo} alt="Logo" className="w-10 h-10" />
      </div>

      {/* Menu Items */}
      <div className="flex flex-col gap-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <div
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-4 py-3 px-4 rounded-xl cursor-pointer transition-all ${
                active ? 'bg-[#E7F6EC]' : 'hover:bg-gray-50'
              }`}
            >
              <Icon
                size={20}
                className={`${
                  active ? 'text-[#3D7B22]' : 'text-[#667185]'
                } transition-colors`}
              />
              <span
                className={`text-[16px] font-normal  ${
                  active ? 'text-[#3D7B22]' : 'text-[#344054]'
                } ${
                  item.label === 'Notifications' && active ? 'underline' : ''
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SideNav;
