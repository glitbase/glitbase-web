/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { ChevronUp, ChevronDown, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import { Store } from '@/redux/vendor/storeSlice';
import {
  useAddFaqMutation,
  useUpdateFaqMutation,
  useRemoveFaqMutation,
} from '@/redux/vendor';
import { toast } from 'react-toastify';
import { Textarea } from '@/components/Inputs/TextAreaInput';
import { Input } from '@/components/Inputs/TextInput';
import { Button } from '@/components/Buttons';

interface FaqsProps {
  store: Store;
  isReadOnly?: boolean;
}

const Faqs = ({ store, isReadOnly = false }: FaqsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<any>(null);
  const [faqToDelete, setFaqToDelete] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(
    store.faqs?.[0]?.id ?? null
  );
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
  });

  const [addFaq, { isLoading: isAdding }] = useAddFaqMutation();
  const [updateFaq, { isLoading: isUpdating }] = useUpdateFaqMutation();
  const [removeFaq, { isLoading: isRemoving }] = useRemoveFaqMutation();

  const handleAddFaq = () => {
    setSelectedFaq(null);
    setFormData({ question: '', answer: '' });
    setIsModalOpen(true);
  };

  const handleEditFaq = (faq: any) => {
    setSelectedFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }

    try {
      if (selectedFaq) {
        await updateFaq({
          storeId: store.id,
          faqId: selectedFaq.id,
          question: formData.question,
          answer: formData.answer,
        }).unwrap();
        toast.success('FAQ updated successfully');
      } else {
        await addFaq({
          storeId: store.id,
          question: formData.question,
          answer: formData.answer,
        }).unwrap();
        toast.success('FAQ added successfully');
      }
      setIsModalOpen(false);
      setFormData({ question: '', answer: '' });
      setSelectedFaq(null);
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          `Failed to ${selectedFaq ? 'update' : 'add'} FAQ`
      );
    }
  };

  const handleDeleteFaq = async () => {
    if (!faqToDelete) return;

    try {
      await removeFaq({
        storeId: store.id,
        faqId: faqToDelete,
      }).unwrap();
      toast.success('FAQ deleted successfully');
      setFaqToDelete(null);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete FAQ');
    }
  };

  const faqs = store.faqs || [];

  return (
    <div className="relative">
      {/* FAQs List */}
      {faqs.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          {!isReadOnly && (
            <div
              className="w-16 h-16 cursor-pointer rounded-full flex items-center justify-center mx-auto mb-4"
              onClick={handleAddFaq}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="48" height="48" rx="24" fill="#4C9A2A" />
                <path
                  d="M24 16V32M32 24H16"
                  stroke="white"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          )}
          <h3 className="text-[20px] font-bold text-gray-900 mb-2 font-[lora] tracking-tight">
            {isReadOnly ? 'Got questions?' : 'No FAQs created'}
          </h3>
          <p className="text-[#6C6C6C] mb-6 max-w-[300px] mx-auto text-[14px] font-medium">
            {isReadOnly
              ? 'Common questions and helpful information coming soon.'
              : 'Add frequently asked questions to help customers get quick answers'}
          </p>
        </div>
      ) : (
        <div>
          {faqs.map((faq) => {
            const isOpen = expandedFaqId === faq.id;
            return (
              <div key={faq.id} className="border-b border-[#F0F0F0] last:border-0">
                {/* Row */}
                <div className="flex items-center justify-between py-5 gap-2">
                  <button
                    type="button"
                    className="flex-1 text-left flex items-center justify-between gap-3 min-w-0"
                    onClick={() => setExpandedFaqId(isOpen ? null : faq.id)}
                  >
                    <span className="text-[14px] font-semibold text-[#101828] leading-snug">
                      {faq.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#101828] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#101828] shrink-0" />
                    )}
                  </button>

                  {/* Owner menu */}
                  {!isReadOnly && (
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(openMenuId === faq.id ? null : faq.id)}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-[#6C6C6C]"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {openMenuId === faq.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                          <div className="absolute right-0 mt-1 py-1 min-w-[160px] bg-white rounded-xl border border-[#E5E7EB] shadow-lg z-20">
                            <button
                              type="button"
                              onClick={() => { handleEditFaq(faq); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-[#101828] hover:bg-gray-50 text-left"
                            >
                              <Pencil className="w-4 h-4 text-[#6C6C6C]" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => { setFaqToDelete(faq.id); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-[#DC2626] hover:bg-[#FEF2F2] text-left"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Answer */}
                {isOpen && (
                  <div className="bg-[#FAFAFA] rounded-xl px-2 py-3 mb-4">
                    <p className="text-[14px] text-[#0A0A0A] font-medium leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Add Button */}
      {!isReadOnly && (
        <button
          onClick={handleAddFaq}
          className="fixed bottom-8 right-8 w-14 h-14 bg-[#4C9A2A] hover:bg-[#3d7a22] text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-30"
          title="Add FAQ"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      )}

      {/* FAQ Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[24px] font-bold text-[#0A0A0A] font-[lora] tracking-tight">
                {selectedFaq ? 'Edit FAQ' : 'Add FAQ'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedFaq(null);
                  setFormData({ question: '', answer: '' });
                }}
                className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center"
              >
                <X  color='#3B3B3B' size={20}/>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  type="text"
                  label='Question'
                  value={formData.question}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      question: e.target.value,
                    }))
                  }
                  placeholder="Question"
                  required
                />
              </div>

              <div>
                <Textarea
                  label='Answer'
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, answer: e.target.value }))
                  }
                  rows={5}
                  placeholder="Provide a clear and helpful answer to this frequently asked question..."
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  isAdding ||
                  isUpdating ||
                  !formData.question.trim() ||
                  !formData.answer.trim()
                }
                size='full'
              >
                {isAdding || isUpdating
                  ? selectedFaq
                    ? 'Updating...'
                    : 'Adding...'
                  : selectedFaq
                  ? 'Edit FAQ'
                  : 'Add FAQ'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {faqToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-[17px] font-bold text-[#101828] font-[lora] tracking-tight mb-2">
              Delete FAQ
            </h3>
            <p className="text-[14px] text-[#6C6C6C] font-medium mb-6">
              Are you sure you want to delete this FAQ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <div className="flex-1">
                <Button variant="cancel" size="full" onClick={() => setFaqToDelete(null)} disabled={isRemoving}>
                  Cancel
                </Button>
              </div>
              <div className="flex-1">
                <Button variant="destructive" size="full" onClick={handleDeleteFaq} loading={isRemoving}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faqs;
