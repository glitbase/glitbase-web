import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useGetMySavedGlitsQuery } from '@/redux/glits';
import type { Glit } from '@/redux/glits';

const MASONRY_GAP = 12;
const COLUMN_COUNT = 3;

const getHeightForGlit = (glit: Glit) => {
  const id = glit.id ?? (glit as Glit & { _id?: string })._id ?? '';
  const heights = [160, 195, 230, 265, 300, 335, 375, 180, 255, 320];
  const hashCode = String(id).split('').reduce((acc: number, c: string) => c.charCodeAt(0) + ((acc << 5) - acc), 0);
  return heights[Math.abs(hashCode) % heights.length];
};

const ViewAllGlits = () => {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useGetMySavedGlitsQuery({
    page: 1,
    limit: 100,
  });

  const glits = data?.data?.docs ?? [];
  const glitsCount = data?.data?.meta?.total ?? glits.length;

  const columns = Array.from({ length: COLUMN_COUNT }, (_, colIndex) =>
    glits.filter((_, i) => i % COLUMN_COUNT === colIndex)
  );

  const handleGlitClick = (glit: Glit) => {
    const id = glit.id ?? (glit as Glit & { _id?: string })._id;
    if (id) navigate(`/glitfinder/glit/${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="w-6 h-6 text-[#101828]" />
          </button>
          <h1 className="text-[19px] font-semibold text-[#101828] font-[lora]">
            All glits
          </h1>
          <div className="w-10" />
        </header>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#4C9A2A] border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-[14px] font-medium text-[#6C6C6C]">
            Loading glits...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="w-6 h-6 text-[#101828]" />
          </button>
          <h1 className="text-[19px] font-semibold text-[#101828] font-[lora]">
            All glits
          </h1>
          <div className="w-10" />
        </header>
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-12 h-12 rounded-full bg-[#FEE2E2] flex items-center justify-center mb-4">
            <span className="text-2xl">!</span>
          </div>
          <h2 className="text-[18px] font-semibold text-[#101828] mb-2">
            Failed to load glits
          </h2>
          <p className="text-[14px] text-[#6C6C6C] font-medium mb-4">
            Please try again
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-5 py-2.5 rounded-full bg-[#4C9A2A] text-white text-[14px] font-semibold hover:bg-[#3d7b22]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="w-6 h-6 text-[#101828]" />
        </button>
        <h1 className="text-[19px] font-semibold text-[#101828] font-[lora]">
          All glits
        </h1>
        <div className="w-10" />
      </header>

      <div className="px-4 py-5">
        {glits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <h2 className="text-[20px] font-semibold text-[#101828] font-[lora] mb-2">
              No glits yet
            </h2>
            <p className="text-[15px] text-[#6C6C6C] font-medium text-center">
              Save glits to see them here
            </p>
          </div>
        ) : (
          <>
            <p className="text-[14px] text-[#6C6C6C] font-medium mb-4">
              {glitsCount} glit{glitsCount !== 1 ? 's' : ''}
            </p>
            {/* Masonry grid - multiple columns, varying heights */}
            <div
              className="flex gap-3"
              style={{ gap: MASONRY_GAP }}
            >
              {columns.map((columnGlits, colIndex) => (
                <div
                  key={colIndex}
                  className="flex-1 flex flex-col min-w-0"
                  style={{ gap: MASONRY_GAP }}
                >
                  {columnGlits.map((glit) => {
                    const id = glit.id ?? (glit as Glit & { _id?: string })._id;
                    const height = getHeightForGlit(glit);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleGlitClick(glit)}
                        className="w-full rounded-xl overflow-hidden bg-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]/30"
                        style={{ height }}
                      >
                        <img
                          src={glit.image}
                          alt={glit.title || 'Glit'}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewAllGlits;
