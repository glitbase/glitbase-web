import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, UploadCloud, Wrench } from 'lucide-react';
import { toast } from 'react-toastify';

type ActionCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  accentBg: string;
  onClick: () => void;
};

const ActionCard = ({ title, description, icon, accentBg, onClick }: ActionCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 rounded-2xl border border-[#F0F0F0] bg-white p-5 text-left hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className={`h-12 w-12 rounded-2xl grid place-items-center ${accentBg}`}>{icon}</div>
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-[#101828]">{title}</p>
          <p className="mt-1 text-[13px] text-[#6C6C6C] leading-[18px] max-w-[240px] font-medium">{description}</p>
        </div>
      </div>
    </button>
  );
};

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="mt-8">
      <p className="text-[17px] font-medium text-[#0A0A0A]">Quick actions</p>
      <div className="mt-4 flex flex-col gap-4 md:flex-row">
        <ActionCard
          title="Upload glit"
          description="Add your best moments to inspire others and attract customers"
          accentBg="bg-[#EBFEE3]"
          icon={<Plus className="h-5 w-5 text-[#2E5C19]" strokeWidth={1.5} />}
          onClick={() => navigate('/glitfinder', { state: { openCreateGlit: true } })}
        />
        <ActionCard
          title="Add service"
          description="List your services with custom pricing to grow your client base"
          accentBg="bg-[#FFF4FD]"
          icon={<Wrench className="h-5 w-5 text-[#AE3670]" strokeWidth={1.5} />}
          onClick={() => navigate('/vendor/store/add-service')}
        />
        <ActionCard
          title="View bookings"
          description="Stay organized with an overview of all your appointments"
          accentBg="bg-[#F2FAFF]"
          icon={<Calendar className="h-5 w-5 text-[#225DBC]" strokeWidth={1.5} />}
          onClick={() => toast.info('Bookings page coming soon')}
        />
      </div>
    </div>
  );
};

export default QuickActions;

