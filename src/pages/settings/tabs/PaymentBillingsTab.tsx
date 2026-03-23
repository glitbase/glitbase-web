import { useNavigate } from 'react-router-dom';

const PaymentBillingsTab = () => {
  const navigate = useNavigate();

  const cards = [
    {
      id: 'payout',
      title: 'Payout details',
      description: 'View and manage your earnings and transaction history.',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 14C16 14.8284 16.6716 15.5 17.5 15.5C18.3284 15.5 19 14.8284 19 14C19 13.1716 18.3284 12.5 17.5 12.5C16.6716 12.5 16 13.1716 16 14Z"
            stroke="#AE3670"
            stroke-width="1.5"
          />
          <path
            d="M18.9 8C18.9656 7.67689 19 7.34247 19 7C19 4.23858 16.7614 2 14 2C11.2386 2 9 4.23858 9 7C9 7.34247 9.03443 7.67689 9.10002 8"
            stroke="#AE3670"
            stroke-width="1.5"
          />
          <path
            d="M7 7.99324H16C18.8284 7.99324 20.2426 7.99324 21.1213 8.87234C22 9.75145 22 11.1663 22 13.9961V15.9971C22 18.8269 22 20.2418 21.1213 21.1209C20.2426 22 18.8284 22 16 22H10C6.22876 22 4.34315 22 3.17157 20.8279C2 19.6557 2 17.7692 2 13.9961V11.9952C2 8.22211 2 6.33558 3.17157 5.16344C4.11466 4.2199 5.52043 4.03589 8 4H10"
            stroke="#AE3670"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      ),

      path: '/settings/payment-billings/payout-details',
    },
    {
      id: 'subscriptions',
      title: 'Manage subscriptions',
      description: 'Control your active plans and billing cycles',
      icon: (
        <svg
          width="25"
          height="24"
          viewBox="0 0 25 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.33203 12C2.33203 8.46252 2.33203 6.69377 3.38483 5.5129C3.55322 5.32403 3.73881 5.14935 3.93949 4.99087C5.19417 4 7.07345 4 10.832 4H13.832C17.5906 4 19.4699 4 20.7246 4.99087C20.9253 5.14935 21.1108 5.32403 21.2792 5.5129C22.332 6.69377 22.332 8.46252 22.332 12C22.332 15.5375 22.332 17.3062 21.2792 18.4871C21.1108 18.676 20.9253 18.8506 20.7246 19.0091C19.4699 20 17.5906 20 13.832 20H10.832C7.07345 20 5.19417 20 3.93949 19.0091C3.73881 18.8506 3.55322 18.676 3.38483 18.4871C2.33203 17.3062 2.33203 15.5375 2.33203 12Z"
            stroke="#AE3670"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M10.332 16H11.832"
            stroke="#AE3670"
            stroke-width="1.5"
            stroke-miterlimit="10"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M14.832 16L18.332 16"
            stroke="#AE3670"
            stroke-width="1.5"
            stroke-miterlimit="10"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M2.33203 9H22.332"
            stroke="#AE3670"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
        </svg>
      ),
      path: '/settings/payment-billings/manage-subscriptions'
    },
    {
      id: 'policy',
      title: 'Payment policy',
      description: 'Review terms for payments, refunds, and billing guidelines',
      icon: (
        <svg
          width="25"
          height="24"
          viewBox="0 0 25 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.66797 11H6.66797C3.35864 11 2.66797 11.6907 2.66797 15V18C2.66797 21.3093 3.35864 22 6.66797 22H18.668C21.9773 22 22.668 21.3093 22.668 18V15C22.668 12.7889 22.3597 11.7468 21.168 11.2987"
            stroke="#AE3670"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M12.668 18L18.668 18"
            stroke="#AE3670"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M17.9122 3.13291C18.3593 2.64778 18.5829 2.40522 18.8204 2.26374C19.3936 1.92234 20.0994 1.91173 20.6822 2.23573C20.9237 2.37001 21.1541 2.60575 21.615 3.07721C22.0758 3.54868 22.3063 3.78441 22.4375 4.03149C22.7543 4.62767 22.7439 5.34971 22.4102 5.93611C22.2719 6.17913 22.0348 6.40783 21.5605 6.86523L15.9183 12.3075C14.4235 13.7493 13.4977 14.0483 11.4272 13.9941C11.0513 13.9842 10.8634 13.9793 10.7541 13.8551C10.6449 13.731 10.6598 13.5393 10.6896 13.1558C10.8271 11.3881 11.1386 10.4824 12.3416 9.17706L17.9122 3.13291Z"
            stroke="#AE3670"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
        </svg>
      ),
      path: '/settings/payment-billings/payment-policy',
    },
  ];

  return (
    <div className="max-w-[1000px]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          return (
            <div
              key={card.id}
              onClick={() => navigate(card.path)}
              className={`relative bg-[#FAFAFA] rounded-[16px] p-4 transition-all cursor-pointer hover:border-[#3D7B22] hover:shadow-md`}
            >
              <div className="mb-4 mt-2">
                  {card.icon}
              </div>
              <h3 className="text-[15px] font-semibold text-[#101828] mb-2">
                {card.title}
              </h3>
              <p className="text-[13px] text-[#6C6C6C] font-medium max-w-[240px]">{card.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentBillingsTab;
