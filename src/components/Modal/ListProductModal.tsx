import { FC, useState, useEffect, FormEvent } from "react";
import { useModal } from "./ModalProvider";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { Button } from "../Buttons";
import cancelx from "@/assets/images/cancelx.png";
import { Input } from "../Inputs/TextInput";
import { Textarea } from "../Inputs/TextAreaInput";
import { CustomSelect } from "../Inputs/SelectInput";
import { Upload } from "../Inputs/UploadInput";
import { toast } from "react-toastify";
import { ModalId } from "@/Layout";
import successIcon from "@/assets/images/productSuccess.svg";
import { useListProductMutation } from "@/redux/auth";
import { handleError } from "@/utils/notify";
import { useFetchCategoriesQuery } from "@/redux/app";
import { uploadImageToCloudinary } from "@/utils/cloudinaryUtils";
import { tagsList } from "@/utils/tagsList";

interface ModalComponentProps {
  modalId: string;
}

const ListProductModal: FC<ModalComponentProps> = ({ modalId }) => {
  const { showModal, modalStates, hideModal } = useModal();
  const isOpen = modalStates[modalId]?.isOpen;

  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productSubCategory, setProductSubCategory] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [unitsAvailable, setUnitsAvailable] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<{ value: string; label: string }[]>([]);
  // const [productImages, setProductImages] = useState<FileList | null>(null);
  // const [cropActive, setCropActive] = useState(false);
  // const [image, setImage] = useState<string | null>(null);
  const [listProduct] = useListProductMutation();

  const [productImage1, setProductImage1] = useState<string | null>(null);
  const [productImage2, setProductImage2] = useState<string | null>(null);
  const [productImage3, setProductImage3] = useState<string | null>(null);
  const [productImage4, setProductImage4] = useState<string | null>(null);
  const [productImage5, setProductImage5] = useState<string | null>(null);
  const [productImage6, setProductImage6] = useState<string | null>(null);

  const [productImages, setProductImages] = useState<(string | null)[]>(
    Array(6).fill(null)
  );
  console.log([productImages])

  const [cropActive1, setCropActive1] = useState(false);
  const [cropActive2, setCropActive2] = useState(false);
  const [cropActive3, setCropActive3] = useState(false);
  const [cropActive4, setCropActive4] = useState(false);
  const [cropActive5, setCropActive5] = useState(false);
  const [cropActive6, setCropActive6] = useState(false);

  console.log(cropActive1, cropActive2, cropActive3, cropActive4, cropActive5, cropActive6);

  const [processedImage1, setProcessedImage1] = useState<File | null>(null);
  const [processedImage2, setProcessedImage2] = useState<File | null>(null);
  const [processedImage3, setProcessedImage3] = useState<File | null>(null);
  const [processedImage4, setProcessedImage4] = useState<File | null>(null);
  const [processedImage5, setProcessedImage5] = useState<File | null>(null);
  const [processedImage6, setProcessedImage6] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: categories = [] } =
    useFetchCategoriesQuery("product");

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setProductName("");
      setDescription("");
      setProductPrice("");
      setUnitsAvailable("");
      setProductCategory("");
      setProductSubCategory("");
      setTags([]);
      setProductImage1(null);
      setProductImage2(null);
      setProductImage3(null);
      setProductImage4(null);
      setProductImage5(null);
      setProductImage6(null);
      setProductImages(Array(6).fill(null));
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

  // const handleImageChange = (index: number, image: string | null) => {
  //   const newImages = [...productImages];
  //   newImages[index] = image;
  //   setProductImages(newImages);
  // };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!processedImage1) {
      toast.error("Please upload at least one product image");
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
        name: productName,
        description: description,
        imageUrls: imageUrls,
        category: productCategory,
        subcategory: productSubCategory,
        price: parseFloat(productPrice),
        currency: "NGN",
        availableQuantity: parseInt(unitsAvailable, 10),
        tags: tags.map(tag => tag.value),
      };

      const response = await listProduct(payload).unwrap();
      console.log("Product submitted:", response);

      hideModal(modalId);
      showModal(ModalId.SUCCESS_MODAL, {
        message: "Product submitted for listing",
        type: "product",
        icon: <img src={successIcon} alt="Success" />,
      });
    } catch (error: any) {
      handleError(error?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleFullImage1 = (file: File) => {
    console.log("handleFullImage1 called with file:", file.name);

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
          category.value === productCategory
      )
      ?.subcategories.map((subcategory: string) => ({
        value: subcategory,
        label: subcategory,
      })) || [];

  const filteredTags =
    tagsList
      .find((tagGroup) => tagGroup.category === productCategory)
      ?.tags.map((tag) => ({
        value: tag,
        label: tag,
      })) || [];

  if (!isOpen) return null;
  return (
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
              msOverflowStyle: "none",
              scrollbarWidth: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div className="w-full">
              <div className="flex gap-4 px-[34px] ">
                <img
                  src={cancelx}
                  onClick={() => {
                    hideModal(modalId);
                  }}
                  className="w-[15px] mt-1 h-[15px] cursor-pointer"
                />
                <div className="text-[20px] leading-[26px] text-left font-500 font-[lora] text-black">
                  List product
                </div>
              </div>
              <div className="border-[1px] w-full mt-[15px]" />
              <form
                className="px-[34px] pb-[20px] pt-[15px] w-full"
                onSubmit={handleSubmit}
              >
                <div className="mt-4">
                  <Input
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    label="Product name"
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div className="mt-4 flex w-full gap-4">
                  <div className="flex-1">
                    <CustomSelect
                      options={categoryOptions}
                      onChange={(option) =>
                        setProductCategory(
                          (option as { value: string; label: string }).value
                        )
                      }
                      value={
                        categoryOptions.find(
                          (option: { value: string; label: string }) =>
                            option.value === productCategory
                        ) || null
                      }
                      placeholder="Select category"
                      label="Product category"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <CustomSelect
                      options={subCategoryOptions}
                      onChange={(option) =>
                        setProductSubCategory(
                          (option as { value: string; label: string }).value
                        )
                      }
                      value={
                        subCategoryOptions.find(
                          (option: { value: string; label: string }) =>
                            option.value === productSubCategory
                        ) || null
                      }
                      placeholder="Select sub-category"
                      label="Product sub-category"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Input
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    label="Product price"
                    placeholder="Enter product price"
                    type="number"
                    required
                  />
                </div>
                <div className="mt-4">
                  <Input
                    value={unitsAvailable}
                    onChange={(e) => setUnitsAvailable(e.target.value)}
                    label="Units available"
                    placeholder="Enter units available"
                    type="number"
                    required
                  />
                </div>
                <div className="mt-4">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter product description"
                    label="Description"
                    required
                  />
                </div>
                <div className="mt-4">
                  <CustomSelect
                    options={filteredTags}
                    onChange={(selectedOptions) => {
                      setTags(
                        selectedOptions as { value: string; label: string }[]
                      );
                    }}
                    value={tags}
                    placeholder="Select tags"
                    label="Product Tags"
                    required
                    isMulti
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">
                    Product Images
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <Upload
                      setCropActive={setCropActive1}
                      image={productImage1}
                      setImage={setProductImage1}
                      onFullImage={handleFullImage1}
                      onCrop={handleCrop1}
                      required
                      index={0}
                    />
                    <Upload
                      setCropActive={setCropActive2}
                      image={productImage2}
                      setImage={setProductImage2}
                      onFullImage={handleFullImage2}
                      onCrop={handleCrop2}
                      index={1}
                    />
                    <Upload
                      setCropActive={setCropActive3}
                      image={productImage3}
                      setImage={setProductImage3}
                      onFullImage={handleFullImage3}
                      onCrop={handleCrop3}
                      index={2}
                    />
                    <Upload
                      setCropActive={setCropActive4}
                      image={productImage4}
                      setImage={setProductImage4}
                      onFullImage={handleFullImage4}
                      onCrop={handleCrop4}
                      index={3}
                    />
                    <Upload
                      setCropActive={setCropActive5}
                      image={productImage5}
                      setImage={setProductImage5}
                      onFullImage={handleFullImage5}
                      onCrop={handleCrop5}
                      index={4}
                    />
                    <Upload
                      setCropActive={setCropActive6}
                      image={productImage6}
                      setImage={setProductImage6}
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
                    type="submit"
                    className="mt-1 rounded-[40px]"
                    loading={loading}
                    disabled={loading}
                  >
                    List Product
                  </Button>
                </div>
              </form>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default ListProductModal;
