import React, { useRef, useState } from "react";
// import { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { cva, type VariantProps } from "class-variance-authority";
import clearImg from "@/assets/images/clear.svg";
import addImage from "@/assets/images/addImage.svg";
import Card from "@/components/Card";

const uploadVariants = cva(
  "flex h-[58px] w-full items-center justify-center rounded-md border border-input bg-white text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-background",
        ghost: "border-none shadow-none",
      },
      state: {
        error: "border-destructive",
        default: "",
      },
    },
    defaultVariants: {
      variant: "default",
      state: "default",
    },
  }
);

interface UploadProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof uploadVariants> {
  error?: string;
  setCropActive: (cropActive: boolean) => void;
  onCrop?: (croppedFile: File) => void;
  onFullImage?: (file: File) => void;
  image: string | null;
  setImage: (image: string | null) => void;
  index: number;
}

const Upload = React.forwardRef<HTMLInputElement, UploadProps>(
  ({
    // className,
    error,
    // variant,
    // onCrop,
    onFullImage,
    setCropActive,
    image,
    setImage,
    index,
    ...props
  }) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    // const [crop, setCrop] = useState<Crop>({
    //   unit: "%",
    //   width: 50,
    //   height: 50,
    //   x: 25,
    //   y: 25,
    // });
    const [fileError, setFileError] = useState<string | null>(null);
    const [currentFile, setCurrentFile] = useState<File | null>(null);
    console.log(currentFile)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log("handleFileChange called");
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        const validTypes = ["image/jpeg", "image/png", "image/jpg"];
        const maxSize = 3 * 1024 * 1024; // 3MB

        // Check file type and size
        if (!validTypes.includes(file.type)) {
          setFileError("Please upload a JPEG or PNG file.");
          return;
        }

        if (file.size > maxSize) {
          setFileError("File size must not exceed 3MB.");
          return;
        }

        // Reset error state and read the file
        setFileError(null);
        setCurrentFile(file);
        const reader = new FileReader();
        reader.onload = () => {
          setImage(reader.result as string);
          console.log("Image selected:", reader.result);

          if (onFullImage && file) {
            console.log("Calling onFullImage with file:", file.name);
            onFullImage(file);
          }
        };
        reader.readAsDataURL(file);
        setCropActive(true);
      }
    };

    // const handleUseFullImage = () => {
    //   if (currentFile && onFullImage) {
    //     onFullImage(currentFile);
    //     setCropActive(false);
    //   }
    // };

    const handleClearImage = () => {
      setImage(null);
      setCurrentFile(null);
      setCropActive(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    };

    // const getCroppedImg = (
    //   image: HTMLImageElement,
    //   crop: Crop
    // ): Promise<Blob> => {
    //   const canvas = document.createElement("canvas");
    //   const scaleX = image.naturalWidth / image.width;
    //   const scaleY = image.naturalHeight / image.height;
    //   canvas.width = Math.floor(crop.width * scaleX);
    //   canvas.height = Math.floor(crop.height * scaleY);
    //   const ctx = canvas.getContext("2d");

    //   if (!ctx) {
    //     return Promise.reject(new Error("No 2d context"));
    //   }

    //   ctx.drawImage(
    //     image,
    //     crop.x * scaleX,
    //     crop.y * scaleY,
    //     crop.width * scaleX,
    //     crop.height * scaleY,
    //     0,
    //     0,
    //     crop.width * scaleX,
    //     crop.height * scaleY
    //   );

    //   return new Promise((resolve, reject) => {
    //     canvas.toBlob(
    //       (blob) => {
    //         if (!blob) {
    //           reject(new Error("Canvas is empty"));
    //           return;
    //         }
    //         resolve(blob);
    //       },
    //       "image/png",
    //       1
    //     );
    //   });
    // };

    // const handleComplete = async (crop: Crop) => {
    //   if (onCrop && imgRef.current && crop.width && crop.height) {
    //     try {
    //       const croppedBlob = await getCroppedImg(imgRef.current, crop);
    //       const fileName =
    //         inputRef.current?.files?.[0]?.name || "cropped-image.png";
    //       const croppedFile = new File([croppedBlob], fileName, {
    //         type: "image/png",
    //       });
    //       onCrop(croppedFile);
    //     } catch (e) {
    //       console.error("Error creating cropped file:", e);
    //     }
    //   }
    // };

    return (
      <div className="w-full flex flex-col justify-center items-center mx-auto relative mb-1">
        <input
          type="file"
          ref={inputRef}
          // className="hidden"
          style={{ position: "absolute", left: "-9999px" }}
          onChange={handleFileChange}
          accept="image/jpeg, image/png, image/jpg"
          name={`product-image-${index}`}
          {...(index === 0 ? { required: true } : {})}
          {...props}
        />
        {image ? (
          <Card
            className="cursor-pointer !p-0 h-[85px] border-[#F59191] mx-auto bg-[white] w-full space-y-6 flex flex-col items-center justify-center overflow-hidden"
            variant={"outlined-dotted"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* <ReactCrop
              crop={crop}
              onChange={(percentCrop) => setCrop(percentCrop)}
              onComplete={handleComplete}
              className="h-[85px] w-full flex items-center justify-center"
            > */}
            <img
              ref={imgRef}
              src={image}
              className="max-h-[85px] w-full h-full object-cover"
              alt="Upload preview"
            />
            {/* </ReactCrop> */}
            <button
              onClick={handleClearImage}
              className="absolute bottom-[-5px] left-[-5px] text-red-500 text-xs font-bold"
            >
              <img src={clearImg} className="w-5 h-5" />
            </button>
            <div className="absolute bottom-2 right-1 text-black text-[10px] bg-white px-2  rounded-[8px]">
              {index === 0 ? "Main" : index}
            </div>
          </Card>
        ) : (
          <Card
            className="cursor-pointer h-[85px] bg-white w-full space-y-4 flex flex-col items-center justify-center"
            variant={"outlined-dotted"}
            onClick={() => inputRef.current?.click()}
          >
            <img src={addImage} className="w-[24px]" alt="Upload icon" />
          </Card>
        )}
        {fileError && (
          <p className="mt-2 text-xs text-destructive">{fileError}</p>
        )}
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        {/* {image && (
          <button
            onClick={handleUseFullImage}
            className="mt-1 text-primary text-[12px] font-medium underline cursor-pointer hover:underline"
            style={{ fontFamily: "Aeonik" }}
          >
            Use Full Image
          </button>
        )} */}
      </div>
    );
  }
);

Upload.displayName = "Upload";

export { Upload, uploadVariants };
