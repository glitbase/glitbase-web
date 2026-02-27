import React, { useMemo } from 'react';

type StatusTone = 'default' | 'success' | 'danger';

export interface BookingCardProps {
  name: string;
  imageUrl?: string;
  meta: string; // e.g. "7:00 PM • Booking confirmed"
  statusText?: string; // e.g. "Completed" / "Rejected"
  statusTone?: StatusTone;
  progress?: number; // 0..1
  actionLabel?: string; // e.g. "Rebook"
  onActionClick?: () => void;
  onClick?: () => void;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const BookingCard = ({
  name,
  imageUrl,
  meta,
  statusText,
  statusTone = 'default',
  progress,
  actionLabel,
  onActionClick,
  onClick,
}: BookingCardProps) => {
  const initials = useMemo(() => {
    const trimmed = (name || '').trim();
    if (!trimmed) return 'B';
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [name]);

  const statusClass =
    statusTone === 'success'
      ? 'text-[#12B76A]'
      : statusTone === 'danger'
        ? 'text-[#F04438]'
        : 'text-[#6C6C6C]';

  const showProgress = typeof progress === 'number';
  const pct = showProgress ? clamp01(progress) * 100 : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left flex items-start gap-4 py-5 ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      <div className="w-[52px] h-[52px] rounded-full overflow-hidden bg-[#F2F4F7] flex items-center justify-center flex-shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-[#344054] font-semibold">{initials}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[16px] font-semibold text-[#101828] truncate">
              {name}
            </p>
            <p className="text-[14px] text-[#667085] mt-1">{meta}</p>
          </div>

          {actionLabel ? (
            <button
              type="button"
              onClick={onActionClick}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClickCapture={(e) => e.stopPropagation()}
              className="px-6 py-2 rounded-full bg-[#F2F4F7] text-[#344054] text-[14px] font-medium hover:bg-[#EAECF0] transition-colors"
            >
              {actionLabel}
            </button>
          ) : null}
        </div>

        {statusText ? (
          <p className={`text-[14px] font-medium mt-2 ${statusClass}`}>
            {statusText}
          </p>
        ) : null}

        {showProgress ? (
          <div className="mt-3 w-[220px] max-w-full h-[6px] bg-[#EAECF0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4C9A2A] rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
        ) : null}
      </div>
    </button>
  );
};

export default BookingCard;

