import { useState } from "react";

type FieldType =
  | "STRING"
  | "NUMBER"
  | "EMAIL"
  | "PHONE"
  | "DATE"
  | "BOOLEAN"
  | "FILE"
  | "IMAGE";

interface KycField {
  fieldName: string;
  fieldType: FieldType;
  fieldDescription: string;
  isRequired: boolean;
  validationRules: string;
  displayRank: number;
  value: any;
  error?: string;
}

interface GroupedField {
  isGroup: true;
  groupRank: number;
  fields: KycField[];
}

const useKycForm = (initialFields: (KycField | GroupedField)[]) => {
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateField = (field: KycField, value: any): string | null => {
    if (
      field.isRequired &&
      (value === null || value === undefined || value === "")
    ) {
      return `${field.fieldName} is required`;
    }

    if (field.validationRules) {
      const regex = new RegExp(field.validationRules);
      if (!regex.test(String(value))) {
        return `${field.fieldName} is invalid`;
      }
    }

    switch (field.fieldType) {
      case "EMAIL":
        const emailRegex = /^[A-Za-z0-9+_.-]+@(.+)$/;
        if (!emailRegex.test(String(value))) {
          return "Invalid email format";
        }
        break;
      case "PHONE":
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(String(value))) {
          return "Invalid phone number format";
        }
        break;
      case "NUMBER":
        if (isNaN(Number(value))) {
          return "Must be a valid number";
        }
        break;
    }

    return null;
  };

  const handleSingleFieldUpdate = (field: KycField, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field.fieldName]: value,
    }));

    const error = validateField(field, value);
    setErrors((prev) => ({
      ...prev,
      [field.fieldName]: error || "",
    }));
  };

  const handleGroupedFieldUpdate = (
    groupedField: GroupedField,
    fieldName: string,
    value: any
  ) => {
    const field = groupedField.fields.find((f) => f.fieldName === fieldName);
    if (!field) return;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    const error = validateField(field, value);
    setErrors((prev) => ({
      ...prev,
      [fieldName]: error || "",
    }));
  };

  const isFormValid = (): boolean => {
    let valid = true;

    initialFields.forEach((field) => {
      if ("isGroup" in field) {
        field.fields.forEach((groupField) => {
          const value = formData[groupField.fieldName];
          const error = validateField(groupField, value);
          if (error) valid = false;
        });
      } else {
        const value = formData[field.fieldName];
        const error = validateField(field, value);
        if (error) valid = false;
      }
    });

    return valid;
  };

  const getFormValues = () => formData;

  const resetForm = () => {
    setFormData({});
    setErrors({});
  };

  return {
    formData,
    errors,
    handleSingleFieldUpdate,
    handleGroupedFieldUpdate,
    isFormValid,
    getFormValues,
    resetForm,
  };
};

export default useKycForm;
