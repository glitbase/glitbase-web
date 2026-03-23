/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store } from '@/redux/vendor/storeSlice';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { toast } from 'react-toastify';
import { Link2 } from 'lucide-react';
import { Button } from '@/components/Buttons';
import { useGetUserBookingsQuery, type Booking } from '@/redux/booking';
import { useCreateChatMutation, useGetChatsQuery } from '@/redux/chat';
import type { Chat } from '@/redux/chat/types';

/** API expects 24-char hex MongoDB ObjectIds in `participants`. */
function extractMongoUserId(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') {
    const t = value.trim();
    return /^[a-fA-F0-9]{24}$/.test(t) ? t : undefined;
  }
  if (typeof value === 'object') {
    const o = value as { _id?: unknown; id?: unknown };
    const id = o._id ?? o.id;
    if (typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id.trim())) return id.trim();
  }
  return undefined;
}

function formatChatApiError(err: unknown): string {
  const msg = (err as { data?: { message?: string | string[] } })?.data?.message;
  if (Array.isArray(msg)) return msg.join(' ');
  if (typeof msg === 'string') return msg;
  return 'Failed to open chat.';
}

function findExistingBookingChat(
  chats: Chat[],
  bookingReference: string,
  storeId: string
): Chat | undefined {
  const byRef = chats.find(
    (c) => c.type === 'booking' && c.booking?.bookingReference === bookingReference
  );
  if (byRef) return byRef;
  return chats.find((c) => {
    if (c.type !== 'booking') return false;
    const sid = c.store?._id ?? c.store?.id;
    return sid != null && String(sid) === storeId;
  });
}

interface StoreHeaderProps {
  store: Store;
  isReadOnly?: boolean;
}

/** Customer may message vendor only once booking is accepted or in progress */
const MESSAGE_ELIGIBLE_STATUSES = new Set<Booking['status']>(['confirmed', 'ongoing']);

function pickQualifyingBookingForStore(bookings: Booking[], storeId: string): Booking | undefined {
  const matches = bookings.filter(
    (b) => b.store?.id === storeId && MESSAGE_ELIGIBLE_STATUSES.has(b.status)
  );
  if (matches.length === 0) return undefined;
  return [...matches].sort(
    (a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime()
  )[0];
}

const StoreHeader = ({ store, isReadOnly = false }: StoreHeaderProps) => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [showMenu, setShowMenu] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);

  const { data: bookingsRes } = useGetUserBookingsQuery(
    { limit: 80, page: 1 },
    { skip: !isReadOnly || !user?.id || !store?.id }
  );

  const qualifyingBooking = useMemo(
    () => pickQualifyingBookingForStore(bookingsRes?.data?.bookings ?? [], store.id),
    [bookingsRes?.data?.bookings, store.id]
  );

  const vendorUserId = useMemo(() => extractMongoUserId(store.owner), [store.owner]);

  const shouldLoadChatsForMessage = Boolean(
    isReadOnly && user?.id && qualifyingBooking
  );

  const { data: chatsData, refetch: refetchChats } = useGetChatsQuery(undefined, {
    skip: !shouldLoadChatsForMessage,
  });

  const [createChat] = useCreateChatMutation();

  const showMessageButton = Boolean(isReadOnly && user?.id && qualifyingBooking);

  const handleMessageVendor = useCallback(async () => {
    if (!qualifyingBooking) {
      toast.error('You can only message this vendor after you have an active booking.');
      return;
    }
    setOpeningChat(true);
    try {
      const tryOpenExisting = (chats: Chat[]) => {
        const found = findExistingBookingChat(
          chats,
          qualifyingBooking.bookingReference,
          store.id
        );
        const chatId = found?.chatId ?? found?.id ?? '';
        if (chatId) {
          navigate('/inbox', { state: { openChatId: chatId } });
          return true;
        }
        return false;
      };

      if (tryOpenExisting(chatsData?.chats ?? [])) return;

      const refetched = await refetchChats();
      if (refetched.data?.chats && tryOpenExisting(refetched.data.chats)) return;

      const vendorId = vendorUserId ?? extractMongoUserId(store.owner);
      if (!vendorId) {
        toast.error(
          'Could not open chat: vendor account is unavailable. Please contact support or use your booking details.'
        );
        return;
      }

      const result = await createChat({
        participants: [vendorId],
        type: 'booking',
        bookingId: qualifyingBooking._id,
        storeId: store.id,
        title: `Booking Discussion - ${qualifyingBooking.bookingReference}`,
      }).unwrap();
      const chatId = result.chat?.chatId ?? result.chat?.id ?? '';
      if (!chatId) {
        toast.error('Could not open chat. Please try from your booking details.');
        return;
      }
      navigate('/inbox', { state: { openChatId: chatId } });
    } catch (err: unknown) {
      toast.error(formatChatApiError(err));
    } finally {
      setOpeningChat(false);
    }
  }, [
    createChat,
    navigate,
    qualifyingBooking,
    chatsData?.chats,
    refetchChats,
    vendorUserId,
    store.owner,
    store.id,
  ]);

  const handleEditProfile = () => {
    navigate('/vendor/store/edit');
    setShowMenu(false);
  };

  const handleShareStore = () => {
    const storeUrl = `${window.location.origin}/store/${store.id}`;
    navigator.clipboard.writeText(storeUrl);
    toast.success('Store link copied!');
    setShowMenu(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-[#F2FFEC] text-[#3D7B22]';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'booked':
        return 'bg-red-100 text-red-800';
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available today';
      case 'busy':
        return 'Currently busy';
      case 'booked':
        return 'Fully booked';
      case 'offline':
        return 'Offline';
      default:
        return status;
    }
  };

  // console.log(store);

  return (
    <div className="bg-white ">
      {/* Banner Image */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-pink-100 to-pink-200">
        {store.bannerImageUrl ? (
          <img
            src={store.bannerImageUrl}
            alt="Store banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-20 h-20 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Status Indicator */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] md:text-sm font-semibold ${getStatusColor(
              store.status
            )}`}
          >
            <span className="w-2 h-2 bg-current rounded-full mr-2"></span>
            {getStatusLabel(store.status)}
          </span>
        </div>
      </div>

      {/* Profile Section */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative pb-6">
          {/* Profile Picture */}
          <div className="absolute top-[-100px] md:top-[-120px] left-1/2 transform -translate-x-1/2">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-white overflow-hidden bg-white">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={store.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl md:text-3xl font-bold text-gray-700">
                    {store.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 absolute -top-12 right-0">
            <button
              onClick={handleShareStore}
              className="p-2 rounded-md hover:bg-gray-50"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.1002 3C7.45057 3.00657 5.53942 3.09617 4.31806 4.31754C3 5.63559 3 7.75698 3 11.9997C3 16.2425 3 18.3639 4.31806 19.6819C5.63611 21 7.7575 21 12.0003 21C16.243 21 18.3644 21 19.6825 19.6819C20.9038 18.4606 20.9934 16.5494 21 12.8998"
                  stroke="#0A0A0A"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M20.9995 6.02529L20 6.02276C16.2634 6.01331 14.3951 6.00859 13.0817 6.95266C12.6452 7.26639 12.2622 7.64845 11.9474 8.08412C11 9.39515 11 11.2634 11 15M20.9995 6.02529C21.0062 5.86266 20.9481 5.69906 20.8251 5.55333C20.0599 4.64686 18.0711 3 18.0711 3M20.9995 6.02529C20.9934 6.17112 20.9352 6.31616 20.8249 6.44681C20.0596 7.3531 18.0711 9 18.0711 9"
                  stroke="#0A0A0A"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            {!isReadOnly && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-md hover:bg-gray-50"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.9998 12H12.0088"
                      stroke="#0A0A0A"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M17.9998 12H18.0088"
                      stroke="#0A0A0A"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M5.99981 12H6.00879"
                      stroke="#0A0A0A"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg z-20 border border-[#F0F0F0] overflow-hidden">
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          window.open(`/store/${store.id}`, '_blank');
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-[#101828] hover:bg-gray-50"
                      >
                        <svg className="w-4 h-4 text-[#6C6C6C] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Customer view
                      </button>
                    )}
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={handleEditProfile}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-[#101828] hover:bg-gray-50 border-t border-[#F0F0F0]"
                      >
                        <svg className="w-4 h-4 text-[#6C6C6C] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit profile
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Store Info */}
          <div className="mt-16 text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <h1 className="text-[17px] md:text-[20px] font-semibold text-gray-900">{store.name}</h1>
              {store.isPublic && (
                <svg
                  className="w-6 h-6 text-blue-500 scale-75 md:scale-100"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>

            {/* Rating and Reviews */}
            <div className="flex items-center justify-center space-x-4 mb-3">
              <div className="flex items-center">
                <svg
                  width="16"
                  height="15"
                  viewBox="0 0 16 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9.14655 1.79677L10.3198 4.16257C10.4797 4.4919 10.9064 4.80779 11.2663 4.86827L13.3927 5.22449C14.7526 5.453 15.0726 6.44771 14.0927 7.42898L12.4395 9.09579C12.1595 9.37808 12.0062 9.92248 12.0929 10.3123L12.5662 12.3756C12.9395 14.0089 12.0796 14.6406 10.6464 13.7871L8.65327 12.5974C8.29331 12.3824 7.70004 12.3824 7.33342 12.5974L5.3403 13.7871C3.91379 14.6406 3.04722 14.0021 3.42052 12.3756L3.8938 10.3123C3.98045 9.92248 3.82714 9.37808 3.54717 9.09579L1.89402 7.42898C0.920792 6.44771 1.23409 5.453 2.59394 5.22449L4.72037 4.86827C5.07367 4.80779 5.50029 4.4919 5.66027 4.16257L6.83347 1.79677C7.4734 0.513056 8.51329 0.513056 9.14655 1.79677Z"
                    fill="#0A0A0A"
                    stroke="#0A0A0A"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>

                <span className="ml-1 text-gray-900 text-[14px] font-medium">
                  {store.rating.toFixed(1)}
                </span>
                <span className="ml-1 text-[#4C9A2A] text-[14px] font-semibold">
                  ({store.reviewCount})
                </span>
              </div>
            </div>

            {/* Store Type Tags */}
            <div className="flex flex-wrap items-center gap-1 mb-3 justify-center border border-[#F0F0F0] mt-6 rounded-full px-3 py-1 w-fit mx-auto">
              {store.type.map((type, index) => (
                <span key={type} className="flex items-center gap-1">
                  {index > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9D9D9D] inline-block mx-2" />
                  )}
                  <span className="text-[#0A0A0A] font-medium text-[12px] md:text-sm">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-[#3B3B3B] text-[15px] font-medium mb-3 max-w-[500px] mx-auto">{store.description}</p>

            {/* Store URL */}
            {store.id && (
              <div className="flex items-center justify-center gap-1 text-blue-600 mb-2">
                <Link2 color="#4A85E4"  className='-rotate-45 mt-[2px]' size={19} />
                <a
                  href={`/store/${store.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#4A85E4] font-medium"
                >
                  giltbase.com/giltfinder/
                  {store.name.toLowerCase().replace(/\s+/g, '-')}
                </a>
              </div>
            )}

            {/* Location */}
            {store.location && (
              <div className="flex items-center justify-center text-[#6C6C6C] mt-6">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-sm font-medium text-[#6C6C6C]">
                  {store.location.name}, {store.location.state}
                </span>
              </div>
            )}

            {!isReadOnly && (
              <button
                onClick={handleEditProfile}
                className="mt-8 w-[fit-content] px-5 py-2 md:py-3 text-[12px] md:text-[14px] text-[#AE3670] rounded-full font-semibold bg-[#FFF4FD] hover:bg-pink-50"
              >
                Edit profile
              </button>
            )}

            {showMessageButton && (
              <Button
                className="mt-6 !px-8"
                onClick={handleMessageVendor}
                loading={openingChat}
                disabled={openingChat}
              >
                Message
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreHeader;
