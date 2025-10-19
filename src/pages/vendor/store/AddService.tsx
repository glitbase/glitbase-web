/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import {
  useCreateServiceMutation,
  useUpdateServiceMutation,
} from '@/redux/vendor';
import { useFileUploadMutation } from '@/redux/app';
import { toast } from 'react-toastify';
import { Input } from '@/components/Inputs/TextInput';
import { Textarea } from '@/components/Inputs/TextAreaInput';

const AddService = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { serviceId } = useParams();
  const store = useSelector((state: RootState) => state.vendorStore.store);

  // Get service from location state if editing
  const editService = location.state?.service;
  const isEditing = !!editService || !!serviceId;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: [] as string[],
    category: '',
    imageUrl: '',
    pricingType: 'fixed' as 'fixed' | 'free' | 'from',
    price: '',
    currency: 'NGN',
    durationHours: '',
    durationMinutes: '',
    maxBookingPerTimeSlot: 1,
    addOns: [] as any[],
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showPricingDropdown, setShowPricingDropdown] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddOnModal, setShowAddOnModal] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState<any>(null);
  const [newCategory, setNewCategory] = useState('');
  const [addOnForm, setAddOnForm] = useState({
    name: '',
    description: '',
    price: '',
    durationHours: '',
    durationMinutes: '',
  });

  const [createService, { isLoading: isCreating }] = useCreateServiceMutation();
  const [updateService, { isLoading: isUpdating }] = useUpdateServiceMutation();
  const [fileUpload] = useFileUploadMutation();

  useEffect(() => {
    if (editService) {
      const hours = Math.floor(editService.durationInMinutes / 60);
      const minutes = editService.durationInMinutes % 60;

      setFormData({
        name: editService.name || '',
        description: editService.description || '',
        type: editService.type || [],
        category: editService.category || '',
        imageUrl: editService.imageUrl || '',
        pricingType: editService.pricingType || 'fixed',
        price: editService.price?.toString() || '',
        currency: editService.currency || 'NGN',
        durationHours: hours.toString(),
        durationMinutes: minutes.toString(),
        maxBookingPerTimeSlot: editService.maxBookingPerTimeSlot || 1,
        addOns: editService.addOns || [],
      });
    }
  }, [editService]);

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploadingImage(true);
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fileUpload(formDataUpload).unwrap();
      setFormData((prev) => ({ ...prev, imageUrl: response.url }));
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleTypeToggle = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      type: prev.type.includes(value)
        ? prev.type.filter((t) => t !== value)
        : [...prev.type, value],
    }));
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    setFormData((prev) => ({ ...prev, category: newCategory }));
    setNewCategory('');
    setShowAddCategoryModal(false);
  };

  const handleAddOn = () => {
    if (!addOnForm.name.trim()) {
      toast.error('Add-on name is required');
      return;
    }

    const hours = parseInt(addOnForm.durationHours) || 0;
    const minutes = parseInt(addOnForm.durationMinutes) || 0;

    const newAddOn = {
      id: editingAddOn?.id || Date.now().toString(),
      name: addOnForm.name,
      description: addOnForm.description,
      price: parseFloat(addOnForm.price),
      duration: {
        hours,
        minutes,
      },
    };

    if (editingAddOn) {
      setFormData((prev) => ({
        ...prev,
        addOns: prev.addOns.map((ao) =>
          ao.id === editingAddOn.id ? newAddOn : ao
        ),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        addOns: [...prev.addOns, newAddOn],
      }));
    }

    setAddOnForm({
      name: '',
      description: '',
      price: '',
      durationHours: '',
      durationMinutes: '',
    });
    setEditingAddOn(null);
    setShowAddOnModal(false);
  };

  const handleEditAddOn = (addOn: any) => {
    setEditingAddOn(addOn);
    setAddOnForm({
      name: addOn.name,
      description: addOn.description || '',
      price: addOn.price?.toString() || '',
      durationHours: addOn.duration?.hours?.toString() || '0',
      durationMinutes: addOn.duration?.minutes?.toString() || '0',
    });
    setShowAddOnModal(true);
  };

  const handleDeleteAddOn = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      addOns: prev.addOns.filter((ao) => ao.id !== id),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Service name is required');
      return;
    }

    if (formData.type.length === 0) {
      toast.error('Please select at least one service type');
      return;
    }

    if (!formData.category) {
      toast.error('Category is required');
      return;
    }

    const hours = parseInt(formData.durationHours) || 0;
    const minutes = parseInt(formData.durationMinutes) || 0;
    const durationInMinutes = hours * 60 + minutes;

    if (durationInMinutes <= 0) {
      toast.error('Duration must be greater than 0');
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      category: formData.category,
      imageUrl: formData.imageUrl,
      pricingType: formData.pricingType,
      price: formData.pricingType === 'free' ? 0 : parseFloat(formData.price),
      currency: formData.currency,
      duration: {
        hours,
        minutes,
      },
      maxBookingPerTimeSlot: formData.maxBookingPerTimeSlot,
      addOns: formData.addOns.map((addOn: any) => ({
        name: addOn.name,
        description: addOn.description,
        price: addOn.price,
        duration: {
          hours: addOn.duration.hours,
          minutes: addOn.duration.minutes,
        },
      })),
    };

    try {
      if (isEditing && editService) {
        await updateService({
          serviceId: editService.id,
          ...payload,
        }).unwrap();
        toast.success('Service updated successfully');
      } else {
        await createService({
          storeId: store?.id || '',
          ...payload,
        }).unwrap();
        toast.success('Service created successfully');
      }
      navigate('/vendor/store');
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          `Failed to ${isEditing ? 'update' : 'create'} service`
      );
    }
  };

  const serviceTypes = [
    { label: 'Normal service', value: 'normal' },
    { label: 'Home service', value: 'home' },
    { label: 'Walk-in', value: 'walk-in' },
    { label: 'Drop-off & pick-up', value: 'drop-off' },
  ];

  const pricingTypes = [
    { label: 'Fixed', value: 'fixed' },
    { label: 'Free', value: 'free' },
    { label: 'From', value: 'from' },
  ];

  const categories = store?.preferredCategories || [];

  const isLoading = isCreating || isUpdating;
  const isFormValid =
    formData.name.trim() &&
    formData.type.length > 0 &&
    formData.category &&
    (parseInt(formData.durationHours) > 0 ||
      parseInt(formData.durationMinutes) > 0) &&
    (formData.pricingType === 'free' || formData.price);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b sticky top-0 bg-white z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
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
            <h1 className="text-xl font-bold text-gray-900">
              {isEditing ? 'Edit service' : 'Add service'}
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isFormValid || isLoading}
                className="px-4 py-2 bg-[#60983C] text-white rounded-lg hover:bg-[#4d7a30] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? isEditing
                    ? 'Updating...'
                    : 'Creating...'
                  : isEditing
                  ? 'Edit service'
                  : 'Add service'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-6">
          {/* Service Image */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Service photo
            </label>
            {isUploadingImage ? (
              <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#60983C]"></div>
              </div>
            ) : formData.imageUrl ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <img
                  src={formData.imageUrl}
                  alt="Service"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, imageUrl: '' }))
                  }
                  className="absolute top-3 right-3 p-2 bg-black bg-opacity-60 text-white rounded-full hover:bg-opacity-80"
                >
                  <svg
                    className="w-5 h-5"
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
            ) : (
              <div
                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 bg-gray-50"
                onClick={() =>
                  document.getElementById('service-image-upload')?.click()
                }
              >
                <svg
                  className="w-12 h-12 text-gray-400"
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
                <span className="mt-2 text-sm text-gray-500">Add media</span>
              </div>
            )}
            <input
              id="service-image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleImageUpload(e.target.files[0]);
                }
              }}
            />
          </div>

          {/* Service Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Service name
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Service name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Service description (optional)
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              placeholder="Tell customers about this service, what's included, and any special requirements..."
            />
          </div>

          {/* Service Type */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Service type
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left flex justify-between items-center bg-gray-50"
              >
                <span className="text-gray-500">Service type</span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    showTypeDropdown ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showTypeDropdown && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {serviceTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        handleTypeToggle(type.value);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex justify-between items-center border-b last:border-0"
                    >
                      <span className="text-gray-900">{type.label}</span>
                      {formData.type.includes(type.value) && (
                        <svg
                          className="w-5 h-5 text-[#60983C]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Types */}
            {formData.type.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.type.map((value) => {
                  const type = serviceTypes.find((t) => t.value === value);
                  return (
                    <div
                      key={value}
                      className="px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 flex items-center gap-2 text-sm"
                    >
                      <span>{type?.label}</span>
                      <button
                        type="button"
                        onClick={() => handleTypeToggle(value)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Category
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left flex justify-between items-center bg-gray-50"
              >
                <span
                  className={
                    formData.category ? 'text-gray-900' : 'text-gray-500'
                  }
                >
                  {formData.category || 'Category'}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    showCategoryDropdown ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showCategoryDropdown && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, category: cat }));
                        setShowCategoryDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-900 border-b last:border-0"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAddCategoryModal(true)}
              className="mt-2 text-sm text-[#EA1179] hover:underline flex items-center"
            >
              <span className="text-lg mr-1">+</span> Add category
            </button>
          </div>

          {/* Pricing Type */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Pricing type
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPricingDropdown(!showPricingDropdown)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left flex justify-between items-center bg-gray-50"
              >
                <span className="text-gray-900 capitalize">
                  {pricingTypes.find((p) => p.value === formData.pricingType)
                    ?.label || 'Pricing type'}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    showPricingDropdown ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showPricingDropdown && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {pricingTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          pricingType: type.value as any,
                        }));
                        setShowPricingDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-900 border-b last:border-0"
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Price */}
          {formData.pricingType !== 'free' && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-medium">
                  {formData.currency}
                </span>
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: e.target.value }))
                  }
                  min="0"
                  step="0.01"
                  className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg  bg-gray-50 outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Duration
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  value={formData.durationHours}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      durationHours: e.target.value,
                    }))
                  }
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60983C] focus:border-transparent bg-gray-50"
                  placeholder="Hours"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      durationMinutes: e.target.value,
                    }))
                  }
                  min="0"
                  max="59"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60983C] focus:border-transparent bg-gray-50"
                  placeholder="Minutes"
                />
              </div>
            </div>
          </div>

          {/* Add-ons */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Add-ons
            </label>
            {formData.addOns.length > 0 && (
              <div className="space-y-3 mb-3">
                {formData.addOns.map((addOn) => (
                  <div
                    key={addOn.id}
                    className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {addOn.name}
                        </h4>
                        {addOn.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {addOn.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-700">
                          <span>
                            {formData.currency} {addOn.price}
                          </span>
                          {addOn.duration && (
                            <span>
                              · {addOn.duration.hours || 0}h{' '}
                              {addOn.duration.minutes || 0}min
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          type="button"
                          onClick={() => handleEditAddOn(addOn)}
                          className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                        >
                          <svg
                            className="w-4 h-4"
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
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddOn(addOn.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <svg
                            className="w-4 h-4"
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
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setEditingAddOn(null);
                setAddOnForm({
                  name: '',
                  description: '',
                  price: '',
                  durationHours: '',
                  durationMinutes: '',
                });
                setShowAddOnModal(true);
              }}
              className="text-sm text-[#EA1179] hover:underline flex items-center"
            >
              <span className="text-lg mr-1">+</span> Add add-on
            </button>
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Add category</h3>
              <button
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setNewCategory('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-5 h-5"
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
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category name
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60983C] focus:border-transparent bg-gray-50"
                  placeholder="Category name"
                  autoFocus
                />
              </div>
              <button
                onClick={handleAddCategory}
                className="w-full px-6 py-3 bg-[#60983C] text-white rounded-lg hover:bg-[#4d7a30]"
              >
                Add category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add-on Modal */}
      {showAddOnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingAddOn ? 'Edit add-on' : 'Add add-on'}
              </h3>
              <button
                onClick={() => {
                  setShowAddOnModal(false);
                  setEditingAddOn(null);
                  setAddOnForm({
                    name: '',
                    description: '',
                    price: '',
                    durationHours: '',
                    durationMinutes: '',
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-5 h-5"
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
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add-on name
                </label>
                <input
                  type="text"
                  value={addOnForm.name}
                  onChange={(e) =>
                    setAddOnForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 outline-none"
                  placeholder="Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <Textarea
                  value={addOnForm.description}
                  onChange={(e) =>
                    setAddOnForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Describe the add-on"
                />
              </div>

              {/* Price */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price
                </label>

                <div>
                  <span className="absolute left-4 top-1/2 -translate-y-[0%] text-gray-600 font-medium">
                    {formData.currency}
                  </span>
                  <input
                    type="text"
                    value={addOnForm.price}
                    onChange={(e) =>
                      setAddOnForm((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={addOnForm.durationHours}
                      onChange={(e) =>
                        setAddOnForm((prev) => ({
                          ...prev,
                          durationHours: e.target.value,
                        }))
                      }
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 outline-none"
                      placeholder="Hours"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={addOnForm.durationMinutes}
                      onChange={(e) =>
                        setAddOnForm((prev) => ({
                          ...prev,
                          durationMinutes: e.target.value,
                        }))
                      }
                      min="0"
                      max="59"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 outline-none"
                      placeholder="Minutes"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={handleAddOn}
                className="w-full px-6 py-3 bg-[#60983C] text-white rounded-lg hover:bg-[#4d7a30]"
              >
                Save add-on
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddService;
