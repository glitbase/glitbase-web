import { useNavigate } from 'react-router-dom';

const BusinessSettingsTab = () => {
  const navigate = useNavigate();

  const cards = [
    {
      id: 'store-info',
      title: 'Store info & offerings',
      description: 'View your store details and business type',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z"
            stroke="#AE3670"
            stroke-width="1.5"
          />
          <path
            d="M12.2422 17V12C12.2422 11.5286 12.2422 11.2929 12.0957 11.1464C11.9493 11 11.7136 11 11.2422 11"
            stroke="#AE3670"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M11.992 8H12.001"
            stroke="#AE3670"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      ),
      path: '/settings/business-settings/store-info',
    },
    {
      id: 'business-address',
      title: 'Business address',
      description: 'Update your location details and shipping address',
      icon: (
        <svg
          width="25"
          height="24"
          viewBox="0 0 25 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13.9459 21.367C13.5122 21.773 12.9325 22 12.3292 22C11.726 22 11.1463 21.773 10.7126 21.367C6.74115 17.626 1.41889 13.4469 4.01439 7.37966C5.41776 4.09916 8.78647 2 12.3292 2C15.872 2 19.2407 4.09916 20.6441 7.37966C23.2363 13.4393 17.9271 17.6389 13.9459 21.367Z"
            stroke="#AE3670"
            stroke-width="1.5"
          />
          <path
            d="M15.8281 11C15.8281 12.933 14.2611 14.5 12.3281 14.5C10.3951 14.5 8.82812 12.933 8.82812 11C8.82812 9.067 10.3951 7.5 12.3281 7.5C14.2611 7.5 15.8281 9.067 15.8281 11Z"
            stroke="#AE3670"
            stroke-width="1.5"
          />
        </svg>
      ),
      path: '/settings/business-settings/business-address',
    },
  ];

  return (
    <div className="w-full max-w-[600px]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => navigate(card.path)}
              className="p-6 bg-[#F9FAFB] rounded-lg text-left hover:bg-gray-100 transition-colors"
            >
              <div className="w-12 h-12  rounded-full flex items-center justify-center mb-4">
                {Icon}
              </div>
              <h3 className="text-[16px] font-semibold text-[#101828] mb-2">
                {card.title}
              </h3>
              <p className="text-[14px] text-[#667085]">{card.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BusinessSettingsTab;
