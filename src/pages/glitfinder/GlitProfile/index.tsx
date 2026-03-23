import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Share2, MoreHorizontal, ChevronLeft, BadgeCheck, Pencil, Link2 } from 'lucide-react';
import { useAppSelector } from '@/hooks/redux-hooks';
import {
  useGetMyGlitProfileQuery,
  useGetGlitProfileByUsernameQuery,
  useFollowProfileMutation,
  useUnfollowProfileMutation,
  useGetFollowersQuery,
  useGetFollowingQuery,
} from '@/redux/glitfinder';
import Created from './Created';
import Glitboard from './Glitboard';
import Liked from './Liked';
import Notes from './Notes';
import HomeLayout from '@/layout/home/HomeLayout';
import GlitfinderSetupModal from '@/components/Modal/GlitfinderSetupModal';
import GlitfinderSetup from '@/pages/glitfinder/GlitfinderSetup';
import FollowersFollowingModal from '@/components/Modal/FollowersFollowingModal';
import CreateGlitModal, { type GlitFormData } from '@/components/Modal/CreateGlitModal';
import PreviewGlitModal from '@/components/Modal/PreviewGlitModal';

export default function GlitProfilePage() {
  const navigate = useNavigate();
  const { username: usernameParam } = useParams<{ username?: string }>();
  const user = useAppSelector((state) => state.auth.user);
  const cleanUsername = usernameParam?.replace(/^@/, '') ?? '';

  const isOwnProfile = !cleanUsername;

  // Always fetch own profile – needed to check isFollowing on other profiles too
  const { data: myProfileRes, isLoading: myProfileLoading } = useGetMyGlitProfileQuery();
  const { data: otherProfileRes, isLoading: otherLoading, isError: otherError } = useGetGlitProfileByUsernameQuery(
    cleanUsername,
    { skip: isOwnProfile || !cleanUsername }
  );

  const myProfile = myProfileRes?.data?.profile;
  const routeProfile = otherProfileRes?.data?.profile;

  const profileData = isOwnProfile ? myProfile : routeProfile;

  const [followProfile] = useFollowProfileMutation();
  const [unfollowProfile] = useUnfollowProfileMutation();
  const [localIsFollowing, setLocalIsFollowing] = useState<boolean | null>(null);
  const [localFollowersCount, setLocalFollowersCount] = useState<number | null>(null);

  const profileId = profileData?.id;
  const { data: followersRes } = useGetFollowersQuery(profileId ?? '', { skip: !profileId });
  const { data: followingRes } = useGetFollowingQuery(profileId ?? '', { skip: !profileId });

  // Seed local state from server data (mirrors RESOURCE pattern)
  useEffect(() => {
    if (profileData && !isOwnProfile) {
      const isFollowing = profileData?.followers?.includes(myProfile?.id) || false;
      setLocalIsFollowing(isFollowing);
      setLocalFollowersCount(profileData?.followers?.length || 0);
    }
  }, [profileData, myProfile?.id, isOwnProfile]);

  const isFollowingProfile = isOwnProfile
    ? false
    : (localIsFollowing !== null ? localIsFollowing : profileData?.followers?.includes(myProfile?.id) || false);

  const followersCount = isOwnProfile
    ? (followersRes?.data?.count ?? followersRes?.data?.followers?.length ?? profileData?.followers?.length ?? 0)
    : (localFollowersCount !== null ? localFollowersCount : profileData?.followers?.length ?? 0);
  const followingCount =
    followingRes?.data?.count ?? followingRes?.data?.following?.length ?? profileData?.following?.length ?? 0;

  const tabItems = isOwnProfile
    ? [
        {
          title: 'Created',
          render: <Created isOwnProfile profileData={profileData} onCreateGlit={() => setShowCreateGlitModal(true)} />,
        },
        { title: 'Glitboard', render: <Glitboard isOwnProfile /> },
        { title: 'Liked', render: <Liked profileData={profileData} /> },
        { title: 'Notes', render: <Notes /> },
      ]
    : isFollowingProfile
      ? [
          { title: 'Created', render: <Created isOwnProfile={false} userId={profileData?.user} profileData={profileData} /> },
          { title: 'Glitboard', render: <Glitboard isOwnProfile={false} userId={profileData?.user} /> },
        ]
      : [];

  const [searchParams] = useSearchParams();
  const initialTab = Number(searchParams.get('tab') ?? 0);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showEllipsisMenu, setShowEllipsisMenu] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showCreateGlitModal, setShowCreateGlitModal] = useState(false);
  const [showPreviewGlitModal, setShowPreviewGlitModal] = useState(false);
  const [previewGlitData, setPreviewGlitData] = useState<GlitFormData | null>(null);
  const ellipsisMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ellipsisMenuRef.current && !ellipsisMenuRef.current.contains(e.target as Node)) {
        setShowEllipsisMenu(false);
      }
    };
    if (showEllipsisMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEllipsisMenu]);

  useEffect(() => {
    if (tabItems.length > 0 && activeTab >= tabItems.length) setActiveTab(0);
    if (tabItems.length === 0) setActiveTab(0);
  }, [tabItems.length, activeTab]);

  const handleFollowToggle = async () => {
    if (!profileData?.id) return;
    const wasFollowing = isFollowingProfile;
    // Optimistic update
    setLocalIsFollowing(!wasFollowing);
    setLocalFollowersCount((prev) => (prev !== null ? (wasFollowing ? prev - 1 : prev + 1) : prev));
    if (wasFollowing) setActiveTab(0);
    try {
      if (wasFollowing) {
        await unfollowProfile(profileData.id).unwrap();
      } else {
        await followProfile(profileData.id).unwrap();
      }
    } catch {
      // Revert optimistic update on error
      setLocalIsFollowing(wasFollowing);
      setLocalFollowersCount((prev) => (prev !== null ? (wasFollowing ? prev + 1 : prev - 1) : prev));
    }
  };

  const profileUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profileData?.username ?? 'Profile'} - Glitbase`,
          text: `Check out @${profileData?.username}'s profile on Glitbase`,
          url: profileUrl,
        });
      } else {
        await navigator.clipboard.writeText(profileUrl);
      }
    } catch {
      // ignore
    }
  };

  const handleCopyProfileLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setShowEllipsisMenu(false);
    } catch {
      // ignore
    }
  };

  const displayName = isOwnProfile
    ? (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : (user as { name?: string })?.name || 'User')
    : (profileData?.username ?? 'User');
  const bio = profileData?.bio ?? (profileData as { description?: string })?.description ?? 'No bio available';

  if (isOwnProfile && myProfileLoading && !myProfile) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-4 py-3">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ChevronLeft className="w-6 h-6 text-[#101828]" />
          </button>
        </header>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#4C9A2A] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isOwnProfile && otherLoading && !routeProfile) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-4 py-3">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ChevronLeft className="w-6 h-6 text-[#101828]" />
          </button>
        </header>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#4C9A2A] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isOwnProfile && (otherError || (!otherLoading && !routeProfile))) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-4 py-3">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ChevronLeft className="w-6 h-6 text-[#101828]" />
          </button>
        </header>
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <h2 className="text-[18px] font-semibold text-[#101828] mb-2">Profile not found or Private Profile</h2>
          <button
            type="button"
            onClick={() => navigate('/glitfinder')}
            className="px-5 py-2.5 rounded-full bg-[#4C9A2A] text-white text-[14px] font-semibold mt-12"
          >
            Back to Glitfinder
          </button>
        </div>
      </div>
    );
  }

  return (
    <HomeLayout isLoading={false} showNavBar={false}>
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-4 py-3">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ChevronLeft className="w-6 h-6 text-[#101828]" />
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Share"
          >
            <Share2 className="w-5 h-5 text-[#101828]" />
          </button>
          {isOwnProfile && (
            <div className="relative" ref={ellipsisMenuRef}>
              <button
                type="button"
                onClick={() => setShowEllipsisMenu((v) => !v)}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="Menu"
                aria-expanded={showEllipsisMenu}
              >
                <MoreHorizontal className="w-5 h-5 text-[#101828]" />
              </button>
              {showEllipsisMenu && (
                <div className="absolute right-0 top-full mt-1 py-1 min-w-[180px] bg-white rounded-xl border border-[#E5E7EB] shadow-lg z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEllipsisMenu(false);
                      setShowEditProfileModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[15px] font-medium text-[#101828] hover:bg-gray-50"
                  >
                    <Pencil className="w-4 h-4 text-[#6C6C6C]" />
                    Edit profile
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyProfileLink}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[15px] font-medium text-[#101828] hover:bg-gray-50"
                  >
                    <Link2 className="w-4 h-4 text-[#6C6C6C]" />
                    Copy profile link
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-col items-center pt-6 pb-4">
        <div className="relative">
          <img
            src={profileData?.profilePicture ?? (profileData as { profileImageUrl?: string })?.profileImageUrl ?? ''}
            alt=""
            className="w-[60px] h-[60px] md:w-[80px] md:h-[80px] rounded-full object-cover"
          />
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <h1 className="text-[15px] md:text-[18px] font-semibold text-[#101828] capitalize">{displayName}</h1>
          {profileData?.userRole === 'vendor' && <BadgeCheck className="w-4 h-4" strokeWidth={2.5} color="#4A85E4" />}
        </div>
        <p className="text-[14px] md:text-[16px] text-[#6C6C6C] font-medium mt-1">@{profileData?.username ?? 'username'}</p>
        <p className="text-[14px] md:text-[16px] text-[#374151] font-medium text-center max-w-[560px] mt-4">{bio}</p>
        <div className="text-[14px] md:text-[16px] text-[#6C6C6C] font-medium mt-3 flex items-center gap-2">
          <button
            type="button"
            disabled={profileId !== myProfile?.id}
            onClick={() => setShowFollowersModal(true)}
            className="inline-flex items-center gap-1 disabled:cursor-not-allowed"
          >
            <span className="font-semibold text-[#374151]">{followersCount}</span>
            <span>followers</span>
          </button>
          <span>·</span>
          <button
            type="button"
            disabled={profileId !== myProfile?.id}
            onClick={() => setShowFollowingModal(true)}
            className="inline-flex items-center gap-1 disabled:cursor-not-allowed"
          >
            <span className="font-semibold text-[#374151]">{followingCount}</span>
            <span>following</span>
          </button>
        </div>
        {isOwnProfile ? (
          <button
            type="button"
            onClick={() => setShowEditProfileModal(true)}
            className="mt-4 px-6 py-2.5 rounded-full bg-[#FFF4FD] text-[#AE3670] font-semibold text-[14px] mt-6"
          >
            Edit profile
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFollowToggle}
            className={`mt-4 px-6 py-2.5 rounded-full font-semibold text-[14px] ${
              isFollowingProfile ? 'bg-[#E5E7EB] text-[#101828]' : 'bg-[#4C9A2A] text-white'
            }`}
          >
            {isFollowingProfile ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {tabItems.length > 0 && (
        <>
          <div className="flex gap-6 overflow-x-auto w-fit mx-auto mt-6">
            {tabItems.map((tab, i) => (
              <button
                key={tab.title}
                type="button"
                onClick={() => setActiveTab(i)}
                className={`shrink-0 py-3 text-[14px] md:text-[15px] font-medium focus:outline-none focus:ring-0 focus:ring-0 relative font-semibold ${activeTab === i ? 'text-[#343226]' : ' text-[#9D9D9D]'}`}
              >
                {tab.title}
                {activeTab === i && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#4C9A2A] rounded-full"
                    style={{ minWidth: '100%' }}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="min-h-[200px] mt-8">{tabItems[activeTab]?.render}</div>
        </>
      )}

      {!isOwnProfile && tabItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-8">
          <p className="text-[16px] text-[#6C6C6C] font-medium text-center">
            Follow to see their Created and Glitboard tabs
          </p>
        </div>
      )}

      {isOwnProfile && activeTab === 0 && (
        <button
          type="button"
          onClick={() => setShowCreateGlitModal(true)}
          className="fixed bottom-8 right-6 w-14 h-14 rounded-full bg-[#4C9A2A] text-white text-2xl flex items-center justify-center shadow-lg hover:bg-[#3d7b22] z-20"
          aria-label="Add glit"
        >
          +
        </button>
      )}

      <GlitfinderSetupModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
      >
        <GlitfinderSetup
          initialProfile={profileData ?? undefined}
          onSuccess={() => setShowEditProfileModal(false)}
        />
      </GlitfinderSetupModal>
      {profileId && (
        <>
          <FollowersFollowingModal
            isOpen={showFollowersModal}
            onClose={() => setShowFollowersModal(false)}
            profileId={profileId}
            mode="followers"
          />
          <FollowersFollowingModal
            isOpen={showFollowingModal}
            onClose={() => setShowFollowingModal(false)}
            profileId={profileId}
            mode="following"
          />
        </>
      )}
      <CreateGlitModal
        isOpen={showCreateGlitModal}
        onClose={() => setShowCreateGlitModal(false)}
        onNext={(data) => {
          setPreviewGlitData(data);
          setShowCreateGlitModal(false);
          setShowPreviewGlitModal(true);
        }}
      />
      <PreviewGlitModal
        isOpen={showPreviewGlitModal}
        onClose={() => {
          setShowPreviewGlitModal(false);
          setPreviewGlitData(null);
        }}
        data={previewGlitData}
      />
    </div>
    </HomeLayout>
  );
}
