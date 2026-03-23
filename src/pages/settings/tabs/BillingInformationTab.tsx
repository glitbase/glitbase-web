import { useGetPaymentCardsQuery } from '@/redux/booking';

export interface PaymentCard {
  id: string;
  cardHolderName: string;
  last4Digits: string;
  cardBrand: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
  gatewayCardId: string;
}

export interface PaymentCardsResponse {
  status: boolean;
  message: string;
  data: {
    paymentCards: PaymentCard[];
  };
}

const BillingInformationTab = () => {
  const { data, isLoading } = useGetPaymentCardsQuery(undefined, {});
  const cards = (data as { paymentCards?: PaymentCard[] } | undefined)?.paymentCards ?? [];

  const formatExpiry = (month: string, year: string) => {
    const m = month.padStart(2, '0');
    const y = String(year).slice(-2);
    return `${m}/${y}`;
  };

  const getCardImageUrl = (cardBrand: string) => {
    switch (cardBrand.toLowerCase()) {
      case 'visa':
        return 'https://cdn-icons-png.flaticon.com/128/196/196578.png';
      case 'mastercard':
        return 'https://cdn-icons-png.flaticon.com/128/15449/15449783.png';
      case 'verve':
        return 'https://example.com/verve-logo.png';
      default:
        return 'https://cdn-icons-png.flaticon.com/128/196/196578.png';
    }
  };

  return (
    <div className="max-w-[600px]">
      <h2 className="text-[16px] md:text-[18px] font-semibold text-[#101828] mb-1">
        Payment Methods
      </h2>
      <p className="text-[13px] md:text-[14px] text-[#6C6C6C] font-medium mb-6">
        Manage your payment methods and billing information.
      </p>
      <div className="max-w-[400px]">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <p className="text-[13px] md:text-[14px] text-[#6C6C6C]">
            No payment methods saved yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between p-4 rounded-xl bg-[#FAFAFA]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-5 md:w-10 md:h-7 rounded flex items-center justify-center">
                    <img src={getCardImageUrl(card.cardBrand)} alt={card.cardBrand} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[13px] md:text-[14px] font-medium text-[#101828]">
                      •••• {card.last4Digits}
                    </p>
                    <p className="text-[12px] text-[#6C6C6C]">
                      <span className='font-medium text-[#101828] opacity-80'>{card.cardHolderName}</span> · <span className='font-medium text-[#6C6C6C]'>Expires {formatExpiry(card.expiryMonth, card.expiryYear)}</span>
                    </p>
                  </div>
                </div>
                {card.isDefault && (
                  <span className="text-[11px] font-medium text-primary bg-[#E7F6EC] px-2 py-1 rounded">
                    Default
                  </span>
                )}
              </div>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BillingInformationTab;
