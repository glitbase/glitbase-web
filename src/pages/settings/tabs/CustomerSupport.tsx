import { useCallback, useMemo } from 'react';
import { useAppSelector } from '@/hooks/redux-hooks';
import { Button } from '@/components/Buttons';
import {
  MessageCircle,
  Mail,
  MessageCircleMore,
  HelpCircle,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useIntercom } from 'react-use-intercom';

type SupportOption = {
  title: string;
  description: string;
  icon: JSX.Element;
  onClick: () => void;
};

const CustomerSupport = () => {
  const user = useAppSelector((state) => state.auth.user);
  const { boot, show } = useIntercom();

  const handleOpenIntercom = useCallback(() => {
    try {
      const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();

      boot({
        userId: user?.id,
        name: name || undefined,
        email: user?.email,
      });

      show();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to open Intercom messenger:', error);
      toast.error('Unable to open live chat. Please try again.');
    }
  }, [boot, show, user]);

  const handleEmailSupport = useCallback(() => {
    try {
      const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
      const subject = `Support Request from ${name || 'Glitbase user'}`;
      const lines = [
        'Hi Glitbase Support Team,',
        '',
        `User ID: ${user?.id ?? 'N/A'}`,
        `Email: ${user?.email ?? 'N/A'}`,
        '',
        'Please describe your issue below:',
        '',
      ];

      const body = encodeURIComponent(lines.join('\n'));
      const mailto = `mailto:support@glitbase.com?subject=${encodeURIComponent(
        subject
      )}&body=${body}`;

      window.location.href = mailto;
    } catch {
      toast.error(
        'Unable to open your email client. Please contact support@glitbase.com directly.'
      );
    }
  }, [user]);

  const handleOpenFaq = useCallback(() => {
    try {
      window.open('https://glitbase.com/faq', '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Unable to open the FAQ page. Please try again.');
    }
  }, []);

  const handleOpenWhatsApp = useCallback(() => {
    try {
      const url =
        'https://wa.me/1234567890?text=Hi,%20I%20need%20help%20with%20my%20Glitbase%20account';
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Unable to open WhatsApp. Please try again.');
    }
  }, []);

  const supportOptions: SupportOption[] = useMemo(
    () => [
      {
        title: 'Live chat',
        description: 'Get instant help from our support team.',
        icon: (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#EBFEE3] flex items-center justify-center shrink-0">
            <MessageCircle className="w-[15px] h-[15px] sm:w-4 sm:h-4 text-primary" />
          </div>
        ),
        onClick: handleOpenIntercom,
      },
      {
        title: 'Email support',
        description: "Send us an email and we'll get back to you.",
        icon: (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#F3F4FF] flex items-center justify-center shrink-0">
            <Mail className="w-[15px] h-[15px] sm:w-4 sm:h-4 text-[#4F46E5]" />
          </div>
        ),
        onClick: handleEmailSupport,
      },
      {
        title: 'WhatsApp support',
        description: 'Message us on WhatsApp for quick assistance.',
        icon: (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#E7FBEF] flex items-center justify-center shrink-0">
            <MessageCircleMore className="w-[15px] h-[15px] sm:w-4 sm:h-4 text-[#22C55E]" />
          </div>
        ),
        onClick: handleOpenWhatsApp,
      },
      {
        title: 'FAQ',
        description: 'Find answers to commonly asked questions.',
        icon: (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#F5F5F5] flex items-center justify-center shrink-0">
            <HelpCircle className="w-[15px] h-[15px] sm:w-4 sm:h-4 text-[#6C6C6C]" />
          </div>
        ),
        onClick: handleOpenFaq,
      },
    ],
    [handleEmailSupport, handleOpenFaq, handleOpenIntercom, handleOpenWhatsApp]
  );

  return (
    <div className="w-full max-w-[650px] min-w-0">
      <div className="mb-5 sm:mb-6">
        <h2 className="text-[1.05rem] sm:text-lg md:text-[20px] font-semibold text-[#101828] mb-1 leading-snug">
          Customer support
        </h2>
        <p className="text-[13px] sm:text-[14px] text-[#6C6C6C] font-medium leading-relaxed max-w-[52ch]">
          We&apos;re here to help you get the most out of Glitbase. Choose how
          you&apos;d like to get support.
        </p>
      </div>

      <div className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
        {supportOptions.map((option) => (
          <button
            key={option.title}
            type="button"
            onClick={option.onClick}
            className="w-full flex items-start sm:items-center justify-between gap-2 sm:gap-4 rounded-xl bg-[#FAFAFA] px-3 sm:px-4 py-3 hover:bg-gray-50 active:bg-[#F0F0F0] transition-colors text-left touch-manipulation min-h-[44px]"
          >
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              {option.icon}
              <div className="min-w-0 pt-0.5 sm:pt-0">
                <p className="text-[13px] sm:text-[14px] font-medium text-[#101828] leading-snug">
                  {option.title}
                </p>
                <p className="text-[12px] sm:text-[13px] font-medium text-[#6C6C6C] mt-0.5 leading-snug">
                  {option.description}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9D9D9D] shrink-0 mt-1 sm:mt-0" aria-hidden />
          </button>
        ))}
      </div>

      <div className="mb-6 sm:mb-8 rounded-xl border border-[#E4E7EC] bg-[#F5F7FA] px-3 sm:px-4 py-3 sm:py-4">
        <p className="text-[14px] sm:text-[15px] font-semibold text-[#101828] mb-1 leading-snug">
          Need immediate assistance?
        </p>
        <p className="text-[12px] sm:text-[13px] text-[#6C6C6C] mb-3 font-medium leading-relaxed">
          Live chat is the fastest way to get help. Our support team typically
          responds within a few minutes during business hours.
        </p>
        <div className="flex items-start gap-2 pt-2 border-t border-[#E4E7EC]">
          <Clock className="w-4 h-4 text-[#6C6C6C] mt-0.5 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="text-[12px] sm:text-[13px] font-semibold text-[#101828]">
              Business hours
            </p>
            <p className="text-[11px] sm:text-[12px] text-[#6C6C6C] font-medium leading-snug">
              Monday – Friday: 9:00 AM – 6:00 PM (GMT)
            </p>
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-[14px] sm:text-[15px] font-semibold text-[#101828] mb-3">
          Quick actions
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
          <Button className="w-full sm:w-auto min-h-[44px] justify-center" onClick={handleOpenIntercom}>
            Start live chat
          </Button>
          <Button variant="outline" className="w-full sm:w-auto min-h-[44px] justify-center" onClick={handleEmailSupport}>
            Send email
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerSupport;

