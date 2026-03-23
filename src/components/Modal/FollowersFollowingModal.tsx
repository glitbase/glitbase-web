import React from 'react';
import { X } from 'lucide-react';
import {
  useGetFollowersQuery,
  useGetFollowingQuery,
  useFollowProfileMutation,
  useUnfollowProfileMutation,
  useGetMyGlitProfileQuery,
} from '@/redux/glitfinder';

type FollowersFollowingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  profileId: string | undefined;
  mode: 'followers' | 'following';
};

type ProfileItem = {
  id: string;
  profilePicture?: string | null;
  username: string;
  followers?: string[];
};

const FollowersFollowingModal: React.FC<FollowersFollowingModalProps> = ({
  isOpen,
  onClose,
  profileId,
  mode,
}) => {
  const title = mode === 'followers' ? 'Followers' : 'Following';

  const { data: myProfileRes } = useGetMyGlitProfileQuery(undefined, {
    skip: !isOpen,
  });
  const myProfileId: string | undefined = myProfileRes?.data?.profile?.id;

  const {
    data: followersData,
    isLoading: isLoadingFollowers,
    refetch: refetchFollowers,
  } = useGetFollowersQuery(profileId ?? '', {
    skip: !isOpen || !profileId,
  });

  const {
    data: followingData,
    isLoading: isLoadingFollowing,
    refetch: refetchFollowing,
  } = useGetFollowingQuery(profileId ?? '', {
    skip: !isOpen || !profileId,
  });

  const [followProfile, { isLoading: isFollowingAction }] = useFollowProfileMutation();
  const [unfollowProfile, { isLoading: isUnfollowingAction }] = useUnfollowProfileMutation();

  const rawFollowers: ProfileItem[] = followersData?.data?.followers ?? [];
  const rawFollowing: ProfileItem[] = followingData?.data?.following ?? [];

  const list = mode === 'followers' ? rawFollowers : rawFollowing;
  const isLoading = mode === 'followers' ? isLoadingFollowers : isLoadingFollowing;

  const handleFollowToggle = async (targetProfileId: string, isCurrentlyFollowing: boolean) => {
    try {
      if (isCurrentlyFollowing) {
        await unfollowProfile(targetProfileId).unwrap();
      } else {
        await followProfile(targetProfileId).unwrap();
      }
      await Promise.all([refetchFollowers(), refetchFollowing()]);
    } catch {
      // ignore – a toast handler higher up can show errors if needed
    }
  };

  const isFollowingProfile = (profile: ProfileItem) => {
    if (!myProfileId) return false;
    return profile.followers?.includes(myProfileId) ?? false;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-2 md:px-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white shadow-xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-4">
          <h2 className="text-[18px] md:text-[22px] font-semibold text-[#101828] font-[lora]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-[#6C6C6C]" />
          </button>
        </header>

        <div className="max-h-[calc(80vh-64px)] overflow-y-auto px-6 py-3">
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                    <div className="w-24 h-4 rounded bg-gray-200 animate-pulse" />
                  </div>
                  <div className="w-20 h-9 rounded-full bg-gray-200 animate-pulse" />
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-[18px] font-semibold text-[#101828] mb-1">
                No {mode === 'followers' ? 'followers' : 'following'} yet
              </p>
              <p className="text-[14px] text-[#6C6C6C] max-w-[260px] font-medium">
                {mode === 'followers'
                  ? 'When people follow this profile, they will appear here.'
                  : 'When this profile follows others, they will appear here.'}
              </p>
            </div>
          ) : (
            <ul className="">
              {list.map((profile) => {
                const isMe = profile.id === myProfileId;
                const isFollowing = isFollowingProfile(profile);

                return (
                  <li key={profile.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          profile.profilePicture && profile.profilePicture.trim().length > 0
                            ? profile.profilePicture
                            : 'https://via.placeholder.com/40'
                        }
                        alt={profile.username}
                        className="w-8 md:w-10 h-8 md:h-10 rounded-full object-cover bg-gray-200"
                      />
                      <span className="text-[13px] md:text-[15px] font-medium text-[#101828]">@{profile.username}</span>
                    </div>  

                    {!isMe && (
                      <button
                        type="button"
                        disabled={isFollowingAction || isUnfollowingAction}
                        onClick={() => handleFollowToggle(profile.id, isFollowing)}
                        className={`min-w-[96px] h-8 md:h-9 px-3 md:px-4 rounded-full text-[13px] md:text-[14px] font-semibold transition-colors ${
                          isFollowing
                            ? 'bg-[#F3F4F6] text-[#101828]'
                            : 'bg-[#4C9A2A] text-white hover:bg-[#3d7b22]'
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersFollowingModal;

