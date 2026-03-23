import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Copy, SquareKanban } from 'lucide-react';
import { toStoreSlug } from './utils';
import ProgressBar from '@/components/ProgressBar';
import { Button } from '@/components/Buttons';

type VendorHeaderProps = {
  storeName?: string;
  profileImageUrl?: string;
  progressPercent?: number;
  onCopyStoreUrl?: () => void;
  onSetupGuideClick?: () => void;
};

const VendorHeader = ({
  storeName,
  profileImageUrl,
  progressPercent,
  onCopyStoreUrl,
  onSetupGuideClick,
}: VendorHeaderProps) => {
  const navigate = useNavigate();

  const slug = useMemo(() => toStoreSlug(storeName), [storeName]);
  const displayUrl = slug ? `glitbase.com/${slug}` : 'glitbase.com';

  const showProgress = typeof progressPercent === 'number' && progressPercent >= 0 && progressPercent < 100;

  return (
    <div className="flex items-start justify-between pt-3">

      <div className="flex flex-col items-start gap-2">
        <div className="h-[64px] w-[64px] rounded-full overflow-hidden bg-gray-100">
          {profileImageUrl ? (
            <img src={profileImageUrl} alt={storeName || 'Profile'} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-[#6C6C6C] text-[13px] font-medium">
              {(storeName || 'U').slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        <div className="space-y-0.5 mb-1">
          <p className="text-[16px] font-semibold text-[#101828] mt-3">{storeName || '—'}</p>
          <button
            type="button"
            onClick={() => {
              onCopyStoreUrl?.();
            }}
            className="inline-flex items-center gap-2 text-[14px] text-[#6C6C6C] hover:text-[#101828]"
          >
            <span className="underline-offset-4 hover:underline text-[#9D9D9D] font-medium">{displayUrl}</span>
            <Copy color='#4C9A2A' size={16} />
          </button>
        </div>

        <Button variant="cancel" className='!px-6 !text-[14px] !text-[#3B3B3B] !font-semibold mt-2' onClick={() => navigate('/vendor/store')}>Visit store</Button>

      </div>
      <div className="flex items-center justify-end gap-3">
        {showProgress && (
          <button
            type="button"
            onClick={() => (onSetupGuideClick ? onSetupGuideClick() : navigate('/settings'))}
            className="flex items-center gap-4 rounded-full bg-[#161414] pl-2 pr-5 py-2.5 text-white shadow-sm"
          >
            <ProgressBar value={progressPercent as number} variant="circular" showLabel={true} />
            <span className="text-[14px] font-semibold">Complete profile</span>
            <ChevronRight className="h-5 w-5 text-white/80" />
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate('/vendor/store')}
          className="h-10 w-10 rounded-full bg-[#F7F7F7] grid place-items-center hover:bg-gray-50"
          aria-label="Open vendor dashboard"
        >
          <SquareKanban size={18} />
        </button>
        {/* <button
          type="button"
          onClick={() => navigate('/settings')}
          className="h-10 w-10 rounded-full bg-[#F7F7F7] grid place-items-center hover:bg-gray-50"
          aria-label="Open profile"
        >
          <User size={18} />
        </button> */}
      </div>
    </div>
  );
};

export default VendorHeader;

