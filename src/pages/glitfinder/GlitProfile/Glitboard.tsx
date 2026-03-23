import { useNavigate } from 'react-router-dom';
import { BookmarkCheck } from 'lucide-react';
import { useGetMySavedGlitsQuery } from '@/redux/glits';
import {
  useGetMyGlitboardsQuery,
  useGetUserGlitboardsQuery,
} from '@/redux/glitboards';

const CARD_HEIGHT = 220;

interface GlitboardProps {
  isOwnProfile: boolean;
  userId?: string;
}

export default function Glitboard({ isOwnProfile, userId }: GlitboardProps) {
  const navigate = useNavigate();

  const { data: myBoardsData, isLoading: myBoardsLoading, isError: myBoardsError, refetch: refetchMy } = useGetMyGlitboardsQuery(
    { page: 1, limit: 100 },
    { skip: !isOwnProfile }
  );
  const { data: userBoardsData, isLoading: userBoardsLoading, isError: userBoardsError, refetch: refetchUser } = useGetUserGlitboardsQuery(
    { userId: userId ?? '', page: 1, limit: 100 },
    { skip: isOwnProfile || !userId }
  );
  const { data: savedData } = useGetMySavedGlitsQuery(
    { page: 1, limit: 100 },
    { skip: !isOwnProfile }
  );

  const boardsData = isOwnProfile ? myBoardsData : userBoardsData;
  const isLoading = isOwnProfile ? myBoardsLoading : userBoardsLoading;
  const isError = isOwnProfile ? myBoardsError : userBoardsError;
  const refetch = isOwnProfile ? refetchMy : refetchUser;

  const boards = boardsData?.data?.docs ?? [];
  const savedGlits = savedData?.data?.docs ?? [];
  const savedTotal = savedData?.data?.meta?.total ?? savedGlits.length;

  const allGlitsBoard =
    isOwnProfile && savedGlits.length > 0
      ? {
          id: 'all',
          _id: 'all',
          name: 'All glits',
          glitsCount: savedTotal,
          image: savedGlits[0]?.image,
        }
      : null;

  const allBoards = allGlitsBoard ? [allGlitsBoard, ...boards] : boards;

  const handleBoardClick = (board: { id?: string; _id?: string; name?: string }) => {
    const boardId = board.id ?? board._id;
    if (boardId === 'all') {
      navigate('/glitfinder/all');
      return;
    }
    if (boardId) navigate(`/glitfinder/board/${boardId}`);
  };

  if (isLoading && allBoards.length === 0) {
    return (
      <div className="px-4 py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-full rounded-xl bg-[#F5F5F5] animate-pulse" style={{ height: CARD_HEIGHT }} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-[16px] text-[#DC2626] mb-2">Failed to load glitboards</p>
        <button type="button" onClick={() => refetch()} className="text-[16px] text-[#4C9A2A] font-medium underline">
          Tap to retry
        </button>
      </div>
    );
  }

  if (allBoards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8">
        <h2 className="text-[20px] font-semibold text-[#101828] font-[lora] mb-2 tracking-tight">{isOwnProfile ? 'Build your glitboard' : 'Nothing here yet'}</h2>
        <p className="text-[16px] text-[#6C6C6C] font-medium text-center max-w-[360px]">
          {isOwnProfile
            ? 'Save glits to your board to start organizing your inspirations'
            : "This user hasn't shared any uploads on their board"}
        </p>
      </div>
    );
  }

  const renderCard = (board: {
    id?: string;
    _id?: string;
    name?: string;
    image?: string;
    glits?: Array<{ image?: string }>;
    glitsCount?: number;
  }) => {
    const boardId = board.id ?? board._id;
    const thumbnail =
      board.image ?? (board.glits?.[0]?.image) ?? 'https://cdn-icons-png.flaticon.com/128/2182/2182242.png';
    const count = board.glitsCount ?? board.glits?.length ?? 0;
    const name = board.name ?? 'Untitled Board';

    return (
      <button
        key={boardId}
        type="button"
        onClick={() => handleBoardClick(board)}
        className="w-full h-[250px] rounded-xl overflow-hidden bg-[#F5F5F5] relative focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]/30"
      >
        <img src={thumbnail} alt={name} className="w-full h-full object-cover" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)',
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-left pointer-events-none z-[1]">
          <div className="mb-1">
            <BookmarkCheck className="inline-block w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <p className="text-[14px] md:text-[16px] text-white font-semibold">{name}</p>
          <p className="text-[13px] md:text-[14px] text-[#B8B8B8] font-medium">
            {count} {count === 1 ? 'Glit' : 'Glits'}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="px-4 py-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {allBoards.map((board) => renderCard(board))}
      </div>
    </div>
  );
}
