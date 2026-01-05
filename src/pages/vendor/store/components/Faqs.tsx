/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Store } from '@/redux/vendor/storeSlice';
import {
  useAddFaqMutation,
  useUpdateFaqMutation,
  useRemoveFaqMutation,
} from '@/redux/vendor';
import { toast } from 'react-toastify';
import { Textarea } from '@/components/Inputs/TextAreaInput';
import { Input } from '@/components/Inputs/TextInput';

interface FaqsProps {
  store: Store;
  isReadOnly?: boolean;
}

const Faqs = ({ store, isReadOnly = false }: FaqsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<any>(null);
  const [faqToDelete, setFaqToDelete] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isReadOnly ? 'No FAQs available' : 'No FAQs yet'}
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {isReadOnly
              ? 'This store has not added any FAQs yet'
              : 'Add frequently asked questions to help customers learn more about your services'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {faqs.map((faq) => (
            <div key={faq.id} className="bg-white rounded-lg">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900 pr-8">
                  {faq.question}
                </h3>
                {!isReadOnly && (
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() =>
                        setOpenMenuId(openMenuId === faq.id ? null : faq.id)
                      }
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded-md"
                      title="More options"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {openMenuId === faq.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                          <button
                            onClick={() => {
                              handleEditFaq(faq);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <svg
                              className="w-4 h-4 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setFaqToDelete(faq.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                          >
                            <svg
                              className="w-4 h-4 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          ))}
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
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900">
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-base font-medium text-gray-900 mb-3">
                  Question
                </label>
                <Input
                  type="text"
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
                <label className="block text-base font-medium text-gray-900 mb-3">
                  Answer
                </label>
                <Textarea
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, answer: e.target.value }))
                  }
                  rows={5}
                  placeholder="Provide a clear and helpful answer to this frequently asked question..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#4C9A2A] text-white rounded-full font-semibold hover:bg-[#3d7a22] disabled:opacity-50 disabled:bg-gray-300 transition-colors text-base"
                disabled={
                  isAdding ||
                  isUpdating ||
                  !formData.question.trim() ||
                  !formData.answer.trim()
                }
              >
                {isAdding || isUpdating
                  ? selectedFaq
                    ? 'Updating...'
                    : 'Adding...'
                  : selectedFaq
                  ? 'Edit FAQ'
                  : 'Add FAQ'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {faqToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete FAQ
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this FAQ? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setFaqToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isRemoving}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFaq}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={isRemoving}
              >
                {isRemoving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faqs;
