import { toast, ToastContent, TypeOptions } from "react-toastify";

export const sendMessage = (msg: ToastContent, type: TypeOptions) => {
    toast(msg, {
        type: type,
        position: "top-right",
    });
};

export const handleError = (error: any) => {
    // console.log(error);
    if (error?.message) {
        if (Array.isArray(error.message)) {
            error.message.forEach((msg: string) => sendMessage(msg, "warn" as TypeOptions));
        } else {
            sendMessage(error.message, "warn" as TypeOptions);
        }
    } else if(error?.data?.message) {
        sendMessage(error.data.message, "warn" as TypeOptions);
    } else {
        sendMessage('An unexpected error occurred.', "warn" as TypeOptions);
    }
};