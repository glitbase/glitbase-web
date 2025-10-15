import { FC, useState, FormEvent, useEffect } from 'react';
import { useModal } from './ModalProvider';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { Button } from '../Buttons';
import cancelx from '@/assets/images/cancelx.png';
import { Input } from '../Inputs/TextInput';
import { Typography } from '../Typography';
import { CustomSelect } from '../Inputs/SelectInput';
import { Upload } from '../Inputs/UploadInput';
import { ModalId } from '@/Layout';
import successIcon from '@/assets/images/serviceSuccess.svg';
import { toast } from 'react-toastify';
import { Textarea } from '../Inputs/TextAreaInput';
import { useListServiceMutation } from '@/redux/auth';
import { uploadImageToCloudinary } from '@/utils/cloudinaryUtils';
import { useFetchCategoriesQuery } from '@/redux/app';
import { tagsList } from '@/utils/tagsList';
import { handleError } from '@/utils/notify';
import AddIcon from '@/assets/images/plus.svg';

interface ModalComponentProps {
  modalId: string;
}

const ListServiceModal: FC<ModalComponentProps> = ({ modalId }) => {
  const { showModal, modalStates, hideModal } = useModal();
  const isOpen = modalStates[modalId]?.isOpen;

  if (!isOpen) return null;

  const [currentStep, setCurrentStep] = useState(1);
  const [serviceName, setServiceName] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');

  // const [durationHours, setDurationHours] = useState<number>(0);
  // const [durationMinutes, setDurationMinutes] = useState<number>(0);

  const [serviceCategory, setServiceCategory] = useState('');
  const [serviceSubCategory, setServiceSubCategory] = useState('');
  // const [availabilityTime, setAvailabilityTime] = useState<string[]>([]);
  const [servicePrice, setServicePrice] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<{ value: string; label: string }[]>([]);
  // const [cropActive, setCropActive] = useState(false);
  // const [image, setImage] = useState<string | null>(null);
  const [listService] = useListServiceMutation();

  const [loading, setLoading] = useState(false);

  const [serviceImage1, setServiceImage1] = useState<string | null>(null);
  const [serviceImage2, setServiceImage2] = useState<string | null>(null);
  const [serviceImage3, setServiceImage3] = useState<string | null>(null);
  const [serviceImage4, setServiceImage4] = useState<string | null>(null);
  const [serviceImage5, setServiceImage5] = useState<string | null>(null);
  const [serviceImage6, setServiceImage6] = useState<string | null>(null);

  const [serviceImages, setServiceImages] = useState<(string | null)[]>(
    Array(6).fill(null)
  );

  const [addOns, setAddOns] = useState([
    { name: '', description: '', price: '' },
  ]);

  const [cropActive1, setCropActive1] = useState(false);
  const [cropActive2, setCropActive2] = useState(false);
  const [cropActive3, setCropActive3] = useState(false);
  const [cropActive4, setCropActive4] = useState(false);
  const [cropActive5, setCropActive5] = useState(false);
  const [cropActive6, setCropActive6] = useState(false);

  const [processedImage1, setProcessedImage1] = useState<File | null>(null);
  const [processedImage2, setProcessedImage2] = useState<File | null>(null);
  const [processedImage3, setProcessedImage3] = useState<File | null>(null);
  const [processedImage4, setProcessedImage4] = useState<File | null>(null);
  const [processedImage5, setProcessedImage5] = useState<File | null>(null);
  const [processedImage6, setProcessedImage6] = useState<File | null>(null);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>(
    []
  );

  const { data: categories = [] } = useFetchCategoriesQuery('service');

  // const [selectedDays, setSelectedDays] = useState<string[]>([]);

  console.log(
    cropActive1,
    cropActive2,
    cropActive3,
    cropActive4,
    cropActive5,
    cropActive6,
    serviceImages
  );

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setServiceName('');
      setServiceDuration('');
      setDescription('');
      setServicePrice('');
      setServiceCategory('');
      setServiceSubCategory('');
      setSelectedServiceTypes([]);
      setTags([]);
      setAddOns([]);
      setServiceImage1(null);
      setServiceImage2(null);
      setServiceImage3(null);
      setServiceImage4(null);
      setServiceImage5(null);
      setServiceImage6(null);
      setServiceImages(Array(6).fill(null));
      setProcessedImage1(null);
      setProcessedImage2(null);
      setProcessedImage3(null);
      setProcessedImage4(null);
      setProcessedImage5(null);
      setProcessedImage6(null);
      setCropActive1(false);
      setCropActive2(false);
      setCropActive3(false);
      setCropActive4(false);
      setCropActive5(false);
      setCropActive6(false);
    }
  }, [isOpen]);

  const serviceType = [
    { id: 'Walk-In', title: 'Walk-In' },
    { id: 'Home Service', title: 'Home Service' },
  ];

  const parseDuration = (
    durationString: string
  ): { hours: number; minutes: number } | null => {
    if (!durationString.trim()) {
      return null;
    }

    const input = durationString.toLowerCase().trim();

    let hours = 0;
    let minutes = 0;

    const hoursRegex = /(\d+)\s*(hour|hours|hr|hrs)/;
    const hoursMatch = input.match(hoursRegex);
    if (hoursMatch) {
      hours = parseInt(hoursMatch[1], 10);
    }

    const minutesRegex = /(\d+)\s*(minute|minutes|min|mins)/;
    const minutesMatch = input.match(minutesRegex);
    if (minutesMatch) {
      minutes = parseInt(minutesMatch[1], 10);
    }

    if (hours === 0 && minutes === 0) {
      return null;
    }

    return { hours, minutes };
  };

  const handleServiceTypeClick = (id: string) => {
    setSelectedServiceTypes(
      (prev) =>
        prev.includes(id)
          ? prev.filter((type) => type !== id) // Remove if already selected
          : [...prev, id] // Add if not selected
    );
  };

  const handleAddNewAddOn = () => {
    setAddOns([...addOns, { name: '', description: '', price: '' }]);
  };

  const handleAddOnChange = (
    index: number,
    field: 'name' | 'description' | 'price',
    value: string
  ) => {
    const updatedAddOns = [...addOns];
    updatedAddOns[index][field] = value;
    setAddOns(updatedAddOns);
  };

  const handleRemoveAddOn = (index: number) => {
    const updatedAddOns = addOns.filter((_, i) => i !== index);
    setAddOns(updatedAddOns);
  };

  // const handleImageChange = (index: number, image: string | null) => {
  //   const newImages = [...serviceImages];
  //   newImages[index] = image;
  //   setServiceImages(newImages);
  // };

  // const handleDayClick = (day: string) => {
  //   setSelectedDays((prev) =>
  //     prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
  //   );
  // };

  // const handleTimeframeChange = (
  //   index: number,
  //   field: "from" | "to",
  //   value: string
  // ) => {
  //   const newTimeframes = [...timeframes];
  //   newTimeframes[index][field] = value;
  //   setTimeframes(newTimeframes);
  // };

  // const addTimeframe = () => {
  //   setTimeframes([...timeframes, { from: "", to: "" }]);
  // };

  // const removeTimeframe = (index: number) => {
  //   setTimeframes(timeframes.filter((_, i) => i !== index));
  // };

  const handleFullImage1 = (file: File) => {
    console.log('handleFullImage1 called with file:', file.name);
    setProcessedImage1(file);
  };

  const handleFullImage2 = (file: File) => {
    setProcessedImage2(file);
  };

  const handleFullImage3 = (file: File) => {
    setProcessedImage3(file);
  };
  const handleFullImage4 = (file: File) => {
    setProcessedImage4(file);
  };
  const handleFullImage5 = (file: File) => {
    setProcessedImage5(file);
  };
  const handleFullImage6 = (file: File) => {
    setProcessedImage6(file);
  };

  const handleCrop1 = (croppedFile: File) => {
    setProcessedImage1(croppedFile);
    setCropActive1(false);
  };

  const handleCrop2 = (croppedFile: File) => {
    setProcessedImage2(croppedFile);
    setCropActive2(false);
  };

  const handleCrop3 = (croppedFile: File) => {
    setProcessedImage3(croppedFile);
    setCropActive3(false);
  };
  const handleCrop4 = (croppedFile: File) => {
    setProcessedImage4(croppedFile);
    setCropActive4(false);
  };
  const handleCrop5 = (croppedFile: File) => {
    setProcessedImage5(croppedFile);
    setCropActive5(false);
  };
  const handleCrop6 = (croppedFile: File) => {
    setProcessedImage6(croppedFile);
    setCropActive6(false);
  };

  const categoryOptions = categories.map(
    (category: { value: string; label: string; subcategories: string[] }) => ({
      value: category.value,
      label: category.label,
    })
  );

  const subCategoryOptions =
    categories
      .find(
        (category: { value: string; label: string; subcategories: string[] }) =>
          category.value === serviceCategory
      )
      ?.subcategories.map((subcategory: string) => ({
        value: subcategory,
        label: subcategory,
      })) || [];

  const filteredTags =
    tagsList
      .find((tagGroup) => tagGroup.category === serviceCategory)
      ?.tags.map((tag) => ({
        value: tag,
        label: tag,
      })) || [];

  // const availabilityTimeOptions = [
  //   { value: "morning", label: "Morning (8am-12pm)" },
  //   { value: "afternoon", label: "Afternoon (12pm-5pm)" },
  //   { value: "evening", label: "Evening (5pm-9pm)" },
  //   { value: "night", label: "Night (9pm-12am)" },
  //   { value: "appointment", label: "By appointment (Discuss with client)" },
  // ];

  // const daysOfWeek = [
  //   { id: "sun", display: "S" },
  //   { id: "mon", display: "M" },
  //   { id: "tue", display: "T" },
  //   { id: "wed", display: "W" },
  //   { id: "thu", display: "T" },
  //   { id: "fri", display: "F" },
  //   { id: "sat", display: "S" },
  // ];

  const isStepOneValid = () => {
    return (
      serviceName.trim() !== '' &&
      serviceDuration.trim() !== '' &&
      description.trim() !== ''
    );
  };

  const isStepTwoValid = () => {
    return (
      servicePrice.trim() !== '' &&
      serviceCategory.trim() !== '' &&
      serviceSubCategory.trim() !== '' &&
      selectedServiceTypes.length > 0
    );
  };

  const isFormValid = () => {
    return isStepOneValid() && isStepTwoValid();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!processedImage1) {
      toast.error('Please upload at least one product image');
      return;
    }

    // if (selectedDays.length === 0) {
    //   toast.error("Please select at least one day");
    //   return;
    // }

    if (!selectedServiceTypes) {
      toast.error('Please select a service type');
      return;
    }

    const parsedDuration = parseDuration(serviceDuration);
    if (!parsedDuration) {
      toast.error(
        "Please enter a valid duration (e.g., '1 hour 30 minutes', '45 minutes', '2 hours')"
      );
      return;
    }

    try {
      setLoading(true);

      const imagesToUpload = [
        processedImage1,
        processedImage2,
        processedImage3,
        processedImage4,
        processedImage5,
        processedImage6,
      ].filter(Boolean);

      const uploadPromises = imagesToUpload
        .filter((file): file is File => file !== null)
        .map((file: File) => uploadImageToCloudinary(file));
      const imageUrls = await Promise.all(uploadPromises);

      const payload = {
        name: serviceName,
        duration: parsedDuration,
        description: description,
        imageUrls: imageUrls,
        category: serviceCategory,
        subcategory: serviceSubCategory,
        price: parseFloat(servicePrice),
        currency: 'NGN',
        deliveryOptions: selectedServiceTypes,
        tags: tags.map((tag) => tag.value),
        addOns: addOns
          .filter((addOn) => addOn.name.trim() !== '')
          .map((addOn) => ({
            name: addOn.name,
            description: addOn.description,
            price: addOn.price ? parseFloat(addOn.price) || 0 : 0,
          })),
      };

      const response = await listService(payload).unwrap();
      console.log('Service submitted:', response);

      hideModal(modalId);
      showModal(ModalId.SUCCESS_MODAL, {
        message: 'Service submitted for listing',
        type: 'service',
        icon: (
          <img src={successIcon} className="w-[133px] h-[68px]" alt="Success" />
        ),
      });
    } catch (error: any) {
      handleError(error?.data);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <>
      <Dialog
        open={isOpen}
        as="div"
        className="relative z-10 focus:outline-none"
        onClose={() => {
          hideModal(modalId);
        }}
      >
        <DialogBackdrop className="fixed inset-0 bg-black/70 w-full" />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel
              transition
              className="py-[24px] rounded-[28px] max-h-[95vh] overflow-hidden overflow-y-auto bg-white shadow-md backdrop-blur-2xl duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0 w-[470px]"
              style={{
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <div className="w-full">
                <div className="flex gap-4  py-2 px-[34px] items-center">
                  <img
                    src={cancelx}
                    onClick={() => {
                      hideModal(modalId);
                    }}
                    className="w-[15px] h-[15px] cursor-pointer"
                  />
                  <div className="flex-1">
                    {currentStep === 3 ? (
                      <div className="flex justify-between items-center">
                        <Typography className="text-[18px] font-medium font-[lora]">
                          Add-Ons{' '}
                          <span className="text-[#8F8F95]">(Optional)</span>
                        </Typography>
                        <button
                          type="button"
                          className="text-white px-3 py-2 bg-black rounded-[20px] font-[inter] text-[12px] flex items-center gap-2"
                          onClick={handleAddNewAddOn}
                        >
                          <img src={AddIcon} alt="Add" className="w-3 h-3" />
                          Add New
                        </button>
                      </div>
                    ) : (
                      <div className="text-[20px] leading-[26px] font-500 font-[lora] text-black">
                        List service
                      </div>
                    )}
                  </div>
                </div>
                {/* <div className="border border-[1px] w-full mt-[15px]" /> */}
                <div className="flex w-full mt-[15px]">
                  <div
                    className={`h-[5px] rounded-r-[8px] flex-1 ${
                      currentStep >= 1 ? 'bg-[#D01361]' : 'bg-[#FFCBE0]'
                    }`}
                  />
                  <div className="w-[10px]" />
                  <div
                    className={`h-[5px] flex-1 rounded-[8px] ${
                      currentStep >= 2 ? 'bg-[#D01361]' : 'bg-[#FFCBE0]'
                    }`}
                  />
                  <div className="w-[10px]" />
                  <div
                    className={`h-[5px] flex-1 rounded-l-[8px] ${
                      currentStep >= 3 ? 'bg-[#D01361]' : 'bg-[#FFCBE0]'
                    }`}
                  />
                </div>
                <form
                  className="px-[34px] pb-[20px] pt-[15px] w-full"
                  onSubmit={handleSubmit}
                >
                  {currentStep === 1 && (
                    <>
                      <Typography className="text-[18px] font-medium my-3 font-[lora]">
                        Service information
                      </Typography>
                      <div className="mt-4">
                        <Input
                          value={serviceName}
                          onChange={(e) => setServiceName(e.target.value)}
                          label="Service title"
                          placeholder="E.g. Facial treatment"
                          required
                        />
                      </div>
                      <div className="mt-4">
                        <Input
                          value={serviceDuration}
                          onChange={(e) => setServiceDuration(e.target.value)}
                          label="Service duration"
                          placeholder="E.g. 1 hour 30 minutes"
                          required
                        />
                      </div>
                      <div className="mt-4">
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Describle your beauty or wellness product in detail"
                          label="Description"
                          required
                        />
                      </div>
                      <div className="mt-6">
                        <Button
                          variant="default"
                          size="full"
                          onClick={() => setCurrentStep(2)}
                          className="mt-1 rounded-[40px]"
                        >
                          Next
                        </Button>
                      </div>
                    </>
                  )}
                  {currentStep === 2 && (
                    <>
                      <p className="mb-1 block text-[12px] font-medium text-[#1f1f1f]">
                        Service type
                      </p>
                      <div className="flex flex-row gap-3">
                        {serviceType.map((type) => (
                          <div
                            key={type.id}
                            className={`flex flex-col py-3 px-3 rounded-[12px] justify-center text-center items-center cursor-pointer ${
                              selectedServiceTypes.includes(type.id)
                                ? 'bg-[#FFEFF6] border-2 border-[#CC5A88]'
                                : 'bg-white border-2 text-[#86818B] border-[#D8D8D8]'
                            }`}
                            onClick={() => handleServiceTypeClick(type.id)}
                          >
                            <Typography className="text-[16px] font-medium font-[lora]">
                              {type.title}
                            </Typography>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4">
                        <Input
                          value={servicePrice}
                          onChange={(e) => setServicePrice(e.target.value)}
                          label="Service price"
                          placeholder="Enter service price"
                          type="number"
                          required
                        />
                      </div>
                      <div className="mt-4 ">
                        <CustomSelect
                          options={categoryOptions}
                          onChange={(option) =>
                            setServiceCategory(
                              (option as { value: string; label: string }).value
                            )
                          }
                          value={
                            categoryOptions.find(
                              (option: { value: string; label: string }) =>
                                option.value === serviceCategory
                            ) || null
                          }
                          placeholder="Select category"
                          label="Service Category"
                          required
                        />
                      </div>
                      <div className="mt-4 ">
                        <CustomSelect
                          options={subCategoryOptions}
                          onChange={(option) =>
                            setServiceSubCategory(
                              (option as { value: string; label: string }).value
                            )
                          }
                          value={
                            subCategoryOptions.find(
                              (option: { value: string; label: string }) =>
                                option.value === serviceSubCategory
                            ) || null
                          }
                          placeholder="Select a sub-category"
                          label="Sub-category"
                          required
                        />
                      </div>
                      <div className="mt-4">
                        <CustomSelect
                          options={filteredTags}
                          onChange={(selectedOptions) => {
                            setTags(
                              selectedOptions as {
                                value: string;
                                label: string;
                              }[]
                            );
                          }}
                          value={tags}
                          placeholder="Select tags"
                          label="Service Tags"
                          required
                          isMulti
                        />
                      </div>
                      <div className="mt-4">
                        <label className="block text-[12px] font-medium text-gray-700 mb-1">
                          Service Images (Optional)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <Upload
                            setCropActive={setCropActive1}
                            image={serviceImage1}
                            setImage={setServiceImage1}
                            onFullImage={handleFullImage1}
                            onCrop={handleCrop1}
                            required
                            index={0}
                          />
                          <Upload
                            setCropActive={setCropActive2}
                            image={serviceImage2}
                            setImage={setServiceImage2}
                            onFullImage={handleFullImage2}
                            onCrop={handleCrop2}
                            index={1}
                          />
                          <Upload
                            setCropActive={setCropActive3}
                            image={serviceImage3}
                            setImage={setServiceImage3}
                            onFullImage={handleFullImage3}
                            onCrop={handleCrop3}
                            index={2}
                          />
                          <Upload
                            setCropActive={setCropActive4}
                            image={serviceImage4}
                            setImage={setServiceImage4}
                            onFullImage={handleFullImage4}
                            onCrop={handleCrop4}
                            index={3}
                          />
                          <Upload
                            setCropActive={setCropActive5}
                            image={serviceImage5}
                            setImage={setServiceImage5}
                            onFullImage={handleFullImage5}
                            onCrop={handleCrop5}
                            index={4}
                          />
                          <Upload
                            setCropActive={setCropActive6}
                            image={serviceImage6}
                            setImage={setServiceImage6}
                            onFullImage={handleFullImage6}
                            onCrop={handleCrop6}
                            index={5}
                          />
                        </div>
                      </div>

                      <div className="mt-6">
                        <Button
                          variant="default"
                          size="full"
                          type="button"
                          className="mt-1 rounded-[40px]"
                          onClick={() => setCurrentStep(3)}
                        >
                          Next
                        </Button>
                      </div>
                      <div className="mt-1">
                        <Button
                          variant="ghost"
                          size="full"
                          type="button"
                          className="mt-1 bg-[#F5F5F5] text-[#090909] rounded-[40px]"
                          onClick={() => setCurrentStep(1)}
                        >
                          Back
                        </Button>
                      </div>
                    </>
                  )}
                  {currentStep === 3 && (
                    <>
                      {addOns.map((addOn, index) => (
                        <div key={index} className="flex flex-col gap-3 mb-4">
                          <Input
                            value={addOn.name}
                            onChange={(e) =>
                              handleAddOnChange(index, 'name', e.target.value)
                            }
                            label={`Name`}
                            placeholder="E.g. Facial treatment "
                          />
                          <Textarea
                            value={addOn.description}
                            onChange={(e) =>
                              handleAddOnChange(
                                index,
                                'description',
                                e.target.value
                              )
                            }
                            label={`Description`}
                            placeholder="Describle your beauty or wellness product in detail"
                          />
                          <Input
                            value={addOn.price}
                            onChange={(e) =>
                              handleAddOnChange(index, 'price', e.target.value)
                            }
                            label={`Amount`}
                            placeholder="0.00"
                            type="number"
                          />
                          {addOns.length > 1 && (
                            <button
                              type="button"
                              className="text-red-500 text-sm mt-1"
                              onClick={() => handleRemoveAddOn(index)}
                            >
                              Remove Add-On
                            </button>
                          )}
                        </div>
                      ))}
                      <div className="mt-6">
                        <Button
                          variant="default"
                          size="full"
                          type="submit"
                          className="mt-2 rounded-[40px]"
                          loading={loading}
                          disabled={loading || !isFormValid()}
                        >
                          List Service
                        </Button>
                      </div>
                      <div className="mt-1">
                        <Button
                          variant="ghost"
                          size="full"
                          type="button"
                          className="mt-1 bg-[#F5F5F5] text-[#090909] rounded-[40px]"
                          onClick={() => setCurrentStep(2)}
                        >
                          Back
                        </Button>
                      </div>
                    </>
                  )}
                </form>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default ListServiceModal;
