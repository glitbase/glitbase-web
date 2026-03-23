type ProgressBarVariant = 'linear' | 'circular';

export type ProgressBarProps = {
  /** Current progress value */
  value: number;
  /** Maximum progress value */
  max?: number;
  /** Display variant */
  variant?: ProgressBarVariant;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Show % label inside/near the progress UI */
  showLabel?: boolean;
  /** Classname for the outer wrapper */
  className?: string;

  /** Linear-only */
  trackClassName?: string;
  barClassName?: string;

  /** Circular-only */
  size?: number; // px
  strokeWidth?: number; // px
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

const ProgressBar = ({
  value,
  max = 100,
  variant = 'linear',
  ariaLabel = 'Progress',
  showLabel = false,
  className = '',
  trackClassName = '',
  barClassName = '',
  size = 44,
  strokeWidth = 6,
}: ProgressBarProps) => {
  const safeMax = max > 0 ? max : 100;
  const percent = clamp((value / safeMax) * 100, 0, 100);

  if (variant === 'circular') {
    const r = (size - strokeWidth) / 2;
    const c = 2 * Math.PI * r;
    const dash = (percent / 100) * c;

    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={clamp(value, 0, safeMax)}
      >
        <div className="relative inline-flex items-center justify-center">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="block"
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={strokeWidth}
              className={`text-[#2A2A2A] ${trackClassName}`}
              stroke="currentColor"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c - dash}`}
              className={`text-[#60983C] ${barClassName}`}
              stroke="currentColor"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </svg>

          {showLabel && (
            <span className="absolute text-[12px] font-medium text-[#E7E7E7]">
              {Math.round(percent)}%
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full ${className}`}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={clamp(value, 0, safeMax)}
    >
      <div
        className={`w-full rounded-full h-[6px] bg-gray-200 ${trackClassName}`}
        aria-hidden="true"
      >
        <div
          className={`h-[6px] rounded-full bg-[#CC5A88] transition-[width] duration-300 ease-out ${barClassName}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-2 text-[12px] font-medium text-[#6C6C6C]">
          {Math.round(percent)}%
        </div>
      )}
    </div>
  );
};

export default ProgressBar;