import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  useGetMyGlitNotesQuery,
  useDeleteGlitNoteMutation,
  useUpdateGlitNoteMutation,
} from '@/redux/glitNotes';
import type { GlitNote } from '@/redux/glitNotes';
import { Textarea } from '@/components/Inputs/TextAreaInput';
import { Button } from '@/components/Buttons';

const EMPTY_NOTES: GlitNote[] = [];

export default function Notes() {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const [openMenuNoteId, setOpenMenuNoteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<GlitNote | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<GlitNote | null>(null);
  const [editNoteText, setEditNoteText] = useState('');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuNoteId(null);
      }
    };
    if (openMenuNoteId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenuNoteId]);

  const { data, isLoading, isError, refetch } = useGetMyGlitNotesQuery();
  const [deleteNote, { isLoading: isDeleting }] = useDeleteGlitNoteMutation();
  const [updateNote, { isLoading: isUpdating }] = useUpdateGlitNoteMutation();

  const notes = data?.data?.notes ?? EMPTY_NOTES;

  const handleDeletePress = (note: GlitNote) => {
    setOpenMenuNoteId(null);
    setNoteToDelete(note);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;
    try {
      await deleteNote(noteToDelete.id).unwrap();
      setShowDeleteModal(false);
      setNoteToDelete(null);
    } catch {
      setShowDeleteModal(false);
      setNoteToDelete(null);
    }
  };

  const handleEditPress = (note: GlitNote) => {
    setOpenMenuNoteId(null);
    setNoteToEdit(note);
    setEditNoteText(note.note);
    setShowEditModal(true);
  };

  const handleEditConfirm = async () => {
    if (!noteToEdit || !editNoteText.trim()) return;
    try {
      await updateNote({ id: noteToEdit.id, data: { note: editNoteText.trim() } }).unwrap();
      setShowEditModal(false);
      setNoteToEdit(null);
      setEditNoteText('');
    } catch {
      setShowEditModal(false);
      setNoteToEdit(null);
      setEditNoteText('');
    }
  };

  if (isLoading && notes.length === 0) {
    return (
      <div className="px-3 sm:px-4 py-4 sm:py-5 min-w-0">
        <div className="w-full max-w-[560px] lg:max-w-[640px] mx-auto space-y-3 sm:space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-[#FAFAFA] p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-start gap-3"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-[#F5F5F5] animate-pulse shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-4 w-24 bg-[#F5F5F5] rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-[#F5F5F5] rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-[#F5F5F5] rounded animate-pulse mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-[16px] text-[#DC2626] mb-2">Failed to load notes</p>
        <button type="button" onClick={() => refetch()} className="text-[16px] text-[#4C9A2A] font-medium underline">
          Tap to retry
        </button>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4 sm:px-8">
        <h2 className="text-[20px] font-semibold text-[#101828] font-[lora] mb-2 tracking-tight">Start adding notes to glits</h2>
        <p className="text-[16px] text-[#6C6C6C] font-medium text-center max-w-[360px]">
          Glits with your private notes will appear here. Click any pin to view your note.
        </p>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-5 min-w-0">
      <div className="w-full max-w-[560px] lg:max-w-[640px] mx-auto space-y-3 sm:space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="relative bg-[#FAFAFA] p-3 sm:p-4 rounded-xl sm:rounded-2xl min-w-0">
            <div
              ref={openMenuNoteId === note.id ? menuRef : undefined}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuNoteId((id) => (id === note.id ? null : note.id));
                }}
                className="p-2 rounded-full hover:bg-[#E5E7EB] text-[#6C6C6C] touch-manipulation"
                aria-label="Note options"
                aria-expanded={openMenuNoteId === note.id}
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {openMenuNoteId === note.id && (
                <div className="absolute top-full right-0 mt-1 min-w-[140px] py-1 bg-white rounded-xl border border-[#E5E7EB] shadow-lg">
                  <button
                    type="button"
                    onClick={() => handleEditPress(note)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[15px] font-medium text-[#101828] hover:bg-gray-50"
                  >
                    <Pencil className="w-4 h-4 text-[#6C6C6C]" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePress(note)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[15px] font-medium text-[#DC2626] hover:bg-[#FEF2F2]"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate(`/glitfinder/glit/${note.glit.id}`)}
              className="w-full flex flex-col sm:flex-row sm:items-start gap-3 items-start text-left p-0 bg-transparent border-0 rounded-lg sm:rounded-xl overflow-hidden hover:bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]/30 touch-manipulation min-w-0"
            >
              <img
                src={note.glit.image}
                alt={note.glit.title || 'Glit'}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 min-w-0 w-full sm:pr-10 pr-11">
                <span className="text-[13px] sm:text-[14px] font-medium text-[#E4AA05]">Note to self</span>
                <p className="text-[14px] sm:text-[15px] font-medium text-[#3B3B3B] mt-0.5 break-words">{note.note}</p>
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Delete modal */}
      {showDeleteModal && noteToDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center p-0 sm:p-4" role="dialog">
          <div className="bg-white w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-t-2xl p-5 sm:p-6 sm:rounded-2xl shadow-xl">
            <h3 className="text-[18px] font-semibold text-[#101828] font-[lora] mb-2 tracking-tight">Delete note?</h3>
            <p className="text-[15px] text-[#6C6C6C] font-medium mb-6">
              This will permanently delete your note for &quot;{noteToDelete.glit?.title ?? 'this glit'}&quot;
            </p>

            <div className="flex gap-3">
              
              <div className="flex-1">
                <Button
                  type="button"
                  onClick={() => { setShowDeleteModal(false); setNoteToDelete(null); }}
                  variant="cancel"
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
              <div className="flex-1">
                <Button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  variant="destructive"
                  className="w-full"
                >
                  {isDeleting ? 'Deleting...' : 'Delete note'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEditModal && noteToEdit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center p-0 sm:p-4" role="dialog">
          <div className="bg-white w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-t-2xl p-5 sm:p-6 sm:rounded-2xl shadow-xl">
            <h3 className="text-[18px] font-semibold text-[#101828] font-[lora] mb-2 tracking-tight">Edit note</h3>
            <p className="text-[15px] text-[#6C6C6C] font-medium mb-4">
              Update your note for &quot;{noteToEdit.glit?.title ?? 'this glit'}&quot;
            </p>
            <Textarea
              value={editNoteText}
              onChange={(e) => setEditNoteText(e.target.value)}
              placeholder="Enter your note..."
              rows={4}
            />
            <div className="flex gap-3 mt-6">
              <div className="flex-1">
                <Button
                type="button"
                onClick={() => { setShowEditModal(false); setNoteToEdit(null); setEditNoteText(''); }}
                variant="cancel"
                className="w-full"
              >
                Cancel
              </Button>
              </div>
              <div className="flex-1">
              <Button
                type="button"
                onClick={handleEditConfirm}
                disabled={isUpdating || !editNoteText.trim()}
                className="w-full"
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </Button>
              </div>
             
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
