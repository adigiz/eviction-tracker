import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  Property,
  Tenant,
  LegalCase,
  LegalCaseStatus,
  PropertyType,
  PaymentStatus,
  County,
} from "../../types";
import { AuthContext } from "../../App";
import { generateId } from "../../services/localStorageService";
import LoadingSpinner from "../LoadingSpinner";
import {
  SUBSIDY_TYPES,
  DEFAULT_REQUEST_PRICE,
  DISCOUNT_AMOUNT,
} from "../../constants";
import { useZodForm, useFormSubmission } from "../../hooks/useZodForm";
import { FormProvider } from "react-hook-form";
import { FormInput } from "../ui/FormInput";
import { ftprFormSchema, FTPRFormData } from "../../lib/validations";
import { errorService } from "../../services/errorService";

interface FTPRFormProps {
  onSubmitSuccess: (newCase: LegalCase) => void;
  onCancel: () => void;
  properties: Property[];
  tenants: Tenant[];
  cases: LegalCase[];
}

const FTPRForm: React.FC<FTPRFormProps> = ({
  onSubmitSuccess,
  onCancel,
  properties,
  tenants,
  cases,
}) => {
  const auth = useContext(AuthContext);

  // Form setup with Zod
  const form = useZodForm(ftprFormSchema, {
    defaultValues: {
      tenantId: "",
      propertyId: "",
      noRightOfRedemption: false,
      rentOwed: undefined,
      districtCourtCaseNumber: "",
      warrantOrderDate: "",
      initialEvictionDate: "",
      landlordSignature: "",
      thirtyDayNoticeFile: undefined,
    },
  });

  // Form submission handling
  const { isSubmitting, handleSubmit: handleFormSubmit } = useFormSubmission(
    async (data: FTPRFormData) => {
      if (!auth?.currentUser) {
        errorService.showError("User not logged in.");
        return;
      }

      // Additional business logic validation
      if (pricingError || price <= 0) {
        errorService.showError("Cannot submit with an invalid price.");
        return;
      }

      // Check for existing cases
      if (
        data.tenantId &&
        cases.some(
          (c) =>
            c.tenantId === data.tenantId &&
            c.paymentStatus !== PaymentStatus.PAID &&
            c.status !== LegalCaseStatus.COMPLETE &&
            c.status !== LegalCaseStatus.NOTICE_DRAFT
        )
      ) {
        errorService.showError(
          "An active or unpaid eviction letter request already exists for this tenant. Please complete payment or wait for the existing request to be resolved."
        );
        return;
      }

      // Validate subsidized tenant restrictions
      if (
        selectedTenant?.isSubsidized &&
        !data.noRightOfRedemption &&
        data.rentOwed &&
        selectedTenant.rentAmount &&
        selectedTenant.rentAmount > 0
      ) {
        const monthsOwed = Math.ceil(data.rentOwed / selectedTenant.rentAmount);
        if (monthsOwed > 12) {
          errorService.showError(
            "For subsidized tenancies, you can only claim up to 12 months of rent."
          );
          return;
        }
      }

      const resolvedRentOwed = data.noRightOfRedemption
        ? 0
        : data.rentOwed || 0;

      const newCase: LegalCase = {
        id: generateId(),
        landlordId: auth.currentUser.id,
        propertyId: data.propertyId,
        tenantId: data.tenantId,
        caseType: "FTPR",
        dateInitiated: new Date().toISOString().split("T")[0],
        rentOwedAtFiling: resolvedRentOwed,
        currentRentOwed: resolvedRentOwed,
        status: LegalCaseStatus.NOTICE_DRAFT,
        paymentStatus: PaymentStatus.UNPAID,
        price: price,
        noRightOfRedemption: data.noRightOfRedemption,
        lateFeesCharged: undefined,
        thirtyDayNoticeFileName:
          isThirtyDayNoticeRequired && thirtyDayNoticeFile
            ? thirtyDayNoticeFile.name
            : undefined,
        paymentsMade: [],
        noticeMailedDate: undefined,
        courtCaseNumber: undefined,
        trialDate: undefined,
        courtHearingDate: undefined,
        courtOutcomeNotes: undefined,
        generatedDocuments: { evictionNotice: undefined },
        districtCourtCaseNumber:
          data.districtCourtCaseNumber.trim() || undefined,
        warrantOrderDate: data.warrantOrderDate || undefined,
        initialEvictionDate: data.initialEvictionDate || undefined,
      };

      onSubmitSuccess(newCase);
    }
  );

  // State for file handling and derived data
  const [thirtyDayNoticeFile, setThirtyDayNoticeFile] = useState<File | null>(
    null
  );
  const [pricingError, setPricingError] = useState<string>("");

  // Watch form values for conditional logic
  const watchedValues = form.watch();
  const selectedTenantId = watchedValues.tenantId;
  const noRightOfRedemption = watchedValues.noRightOfRedemption;

  // Derived state from form values
  const selectedTenant = useMemo(() => {
    return tenants.find((t) => t.id === selectedTenantId) || null;
  }, [selectedTenantId, tenants]);

  const selectedProperty = useMemo(() => {
    if (!selectedTenant) return null;
    return properties.find((p) => p.id === selectedTenant.propertyId) || null;
  }, [selectedTenant, properties]);

  const selectedPropertyId = selectedProperty?.id || "";

  const price = useMemo(() => {
    if (!auth?.currentUser || !selectedProperty) {
      setPricingError("");
      return DEFAULT_REQUEST_PRICE; // Fallback before selection
    }

    const { priceOverrides, referralCode } = auth.currentUser;
    const county = selectedProperty.county;

    if (priceOverrides && priceOverrides[county]) {
      const countyPriceInfo = priceOverrides[county];
      if (!countyPriceInfo.unlocked) {
        setPricingError(
          `Service is not currently available for ${county} on your account. Please contact support.`
        );
        return 0; // Return 0 to indicate an invalid price
      }

      let basePrice = countyPriceInfo.price;

      if (referralCode) {
        basePrice -= DISCOUNT_AMOUNT;
      }

      setPricingError(""); // Clear previous errors
      return Math.max(0, basePrice); // Ensure price isn't negative
    }

    // Fallback if no specific price is set for the county, treat as locked
    setPricingError(
      `Pricing for ${county} is not configured for your account. Please contact support.`
    );
    return 0;
  }, [auth?.currentUser, selectedProperty]);

  const isThirtyDayNoticeRequired = useMemo(() => {
    return (
      selectedProperty?.propertyType === PropertyType.RESIDENTIAL &&
      selectedTenant?.isSubsidized === true &&
      selectedTenant?.subsidyType !== undefined &&
      selectedTenant?.subsidyType !== SUBSIDY_TYPES[0]
    );
  }, [selectedProperty, selectedTenant]);

  // Update property ID when tenant changes
  useEffect(() => {
    if (selectedTenant) {
      form.setValue("propertyId", selectedTenant.propertyId);
    }
  }, [selectedTenant, form]);

  // Clear file when notice is not required
  useEffect(() => {
    if (!isThirtyDayNoticeRequired) {
      setThirtyDayNoticeFile(null);
    }
  }, [isThirtyDayNoticeRequired]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    setThirtyDayNoticeFile(file);
  };

  if (isSubmitting) {
    return <LoadingSpinner text="Adding to Cart..." />;
  }

  const displayTenantNames = (names: string[] | undefined) => {
    if (!names || names.length === 0) return "N/A";
    return names.join(" & ");
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        {pricingError && (
          <p
            className="text-sm text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-500/20 p-3 rounded-md mb-4"
            role="alert"
          >
            {pricingError}
          </p>
        )}

        <div>
          <label
            htmlFor="ftprTenantId"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Tenant <span className="text-red-500">*</span>
          </label>
          <select
            id="ftprTenantId"
            {...form.register("tenantId")}
            required
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="" disabled>
              Select tenant
            </option>
            {tenants.map((ten) => {
              const prop = properties.find((p) => p.id === ten.propertyId);
              return (
                <option key={ten.id} value={ten.id}>
                  {displayTenantNames(ten.tenantNames)}
                  {prop
                    ? ` - ${prop.address}${
                        prop.unit ? `, ${prop.unit}` : ""
                      } (${prop.county})`
                    : " - (Property details missing)"}
                  {prop?.propertyType === PropertyType.RESIDENTIAL &&
                  ten.isSubsidized
                    ? ` (Subsidized: ${ten.subsidyType || "Yes"})`
                    : ""}
                </option>
              );
            })}
          </select>
          {selectedTenantId && !selectedProperty && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
              Warning: Could not find associated property for the selected
              tenant.
            </p>
          )}
        </div>

        {selectedTenant && selectedProperty && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Selected Property Details:
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Address: {selectedProperty.address}
              {selectedProperty.unit ? `, ${selectedProperty.unit}` : ""},{" "}
              {selectedProperty.city}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Type: {selectedProperty.propertyType} in {selectedProperty.county}
            </p>
          </div>
        )}

        <div className="space-y-2 my-4 p-4 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 rounded-md">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Was this case entered as a "No Right of Redemption"?{" "}
            <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This is a judgment where the tenant is not given the option to "pay
            and stay".
          </p>
          <div className="mt-2 flex items-center space-x-6 pt-1">
            <div className="flex items-center">
              <input
                id="nror-no"
                type="radio"
                {...form.register("noRightOfRedemption")}
                value="false"
                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 dark:border-gray-500 bg-gray-100 dark:bg-gray-600"
              />
              <label
                htmlFor="nror-no"
                className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                No (Tenant can pay to stay)
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="nror-yes"
                type="radio"
                {...form.register("noRightOfRedemption")}
                value="true"
                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 dark:border-gray-500 bg-gray-100 dark:bg-gray-600"
              />
              <label
                htmlFor="nror-yes"
                className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Yes (Tenant cannot pay to stay)
              </label>
            </div>
          </div>
        </div>

        {!noRightOfRedemption && (
          <FormInput
            name="rentOwed"
            label="Amount Due to Redeem the Property ($)"
            type="number"
            required
            min="0.01"
            step="0.01"
          />
        )}

        {isThirtyDayNoticeRequired && (
          <div className="space-y-2 p-4 border border-orange-300 dark:border-orange-500/70 bg-orange-50 dark:bg-orange-900/30 rounded-md">
            <label
              htmlFor="thirtyDayNoticeFile"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Upload 30-Day Notice to Tenant{" "}
              <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              A 30-day notice is required for tenants with subsidy type:{" "}
              <strong>{selectedTenant?.subsidyType}</strong>.
            </p>
            <input
              type="file"
              id="thirtyDayNoticeFile"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              aria-describedby="thirtyDayNoticeFileDesc"
              className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-300
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-md file:border-0
                              file:text-sm file:font-semibold
                              file:bg-primary-50 file:text-primary-700 dark:file:bg-primary-800/50 dark:file:text-primary-200
                              hover:file:bg-primary-100 dark:hover:file:bg-primary-700/50
                              border-gray-300 dark:border-gray-600"
            />
            <p
              id="thirtyDayNoticeFileDesc"
              className="text-xs text-gray-500 dark:text-gray-400 mt-1"
            >
              Accepted formats: PDF, DOC, DOCX, JPG, PNG.
            </p>
            {thirtyDayNoticeFile && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Selected file: {thirtyDayNoticeFile.name}
              </p>
            )}
          </div>
        )}

        <FormInput
          name="districtCourtCaseNumber"
          label="District Court Case Number (Full Case Number)"
          required
        />

        <FormInput
          name="warrantOrderDate"
          label="Date Warrant Was Ordered by Court"
          type="date"
          required
        />

        <FormInput
          name="initialEvictionDate"
          label="Initial Scheduled Date of Eviction"
          type="date"
          required
        />

        <div className="space-y-2 p-4 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
            Oath:
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 italic">
            "I do solemnly swear or affirm under the penalty of perjury that the
            matters and facts set forth above are true to the best of my
            knowledge, information, and belief."
          </p>
          <FormInput
            name="landlordSignature"
            label="Type Your Full Name as Signature"
            required
            placeholder="Your Full Name"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              !selectedTenantId ||
              (!noRightOfRedemption && !form.watch("rentOwed")) ||
              isSubmitting ||
              (isThirtyDayNoticeRequired && !thirtyDayNoticeFile) ||
              !form.watch("landlordSignature") ||
              !form.watch("districtCourtCaseNumber") ||
              !form.watch("warrantOrderDate") ||
              !form.watch("initialEvictionDate") ||
              !!pricingError ||
              price <= 0
            }
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 border border-transparent rounded-md shadow-sm disabled:opacity-50"
          >
            Add to Cart (
            {!pricingError && price > 0
              ? `$${price.toFixed(2)}`
              : "Invalid Price"}
            )
          </button>
        </div>
      </form>
    </FormProvider>
  );
};

export default FTPRForm;
