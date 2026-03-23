import { currencySymbol, formatNumber } from './utils';

type Metric = {
  title: string;
  value: string | number;
};

const MetricCard = ({ title, value }: Metric) => {
  return (
    <div className="flex-1 rounded-2xl bg-[#FAFAFA] p-5 mt-4">
      <p className="text-[14px] font-medium text-[#6C6C6C]">{title}</p>
      <p className="mt-2 text-[20px] font-semibold text-[#0A0A0A]">{value}</p>
    </div>
  );
};

type MetricsProps = {
  isLoading?: boolean;
  metrics?: {
    totalEarnings?: number;
    servicesBooked?: number;
    newCustomers?: number;
    storefrontClicks?: number;
    currency?: string;
  } | null;
};

const Metrics = ({ isLoading, metrics }: MetricsProps) => {
  const currency = metrics?.currency || 'NGN';

  const totalEarnings =
    !isLoading ? `${currencySymbol(currency)}${formatNumber(Number(metrics?.totalEarnings || 0))}` : '—';

  const cards: Metric[] = [
    { title: 'Total earnings', value: totalEarnings },
    { title: 'Services booked', value: !isLoading ? formatNumber(Number(metrics?.servicesBooked || 0)) : '—' },
    { title: 'New customers', value: !isLoading ? formatNumber(Number(metrics?.newCustomers || 0)) : '—' },
    { title: 'Clicks to storefront', value: !isLoading ? formatNumber(Number(metrics?.storefrontClicks || 0)) : '—' },
  ];

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <MetricCard key={c.title} title={c.title} value={c.value} />
      ))}
    </div>
  );
};

export default Metrics;

