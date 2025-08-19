import React, { useEffect, useContext, useMemo } from "react";
import { Property, PropertyType, County, Tenant } from "../../types";
import { AuthContext } from "../../App";
import { generateId } from "../../services/localStorageService";
import { MARYLAND_STATE_CODE } from "../../constants";
import { useZodForm, useFormSubmission } from "../../hooks/useZodForm";
import { FormProvider } from "react-hook-form";
import { FormInput } from "../ui/FormInput";
import { propertyFormSchema, PropertyFormData } from "../../lib/validations";
import { errorService } from "../../services/errorService";

interface PropertyFormProps {
  onSubmit: (data: { property: Property; tenant?: Tenant }) => void;
  onCancel: () => void;
  initialProperty?: Property | null;
  initialTenant?: Tenant | null;
}

const PropertyForm: React.FC<PropertyFormProps> = ({
  onSubmit,
  onCancel,
  initialProperty,
  initialTenant,
}) => {
  const auth = useContext(AuthContext);

  const form = useZodForm(propertyFormSchema, {
    defaultValues: {
      property: {
        propertyType: "RESIDENTIAL" as const,
        address: "",
        unit: "",
        county: "",
        city: "",
        zipCode: "",
        description: "",
      },
      tenant: {
        tenantNames: ["", "", "", ""],
        email: "",
        phone: "",
      },
    },
  });

  const { isSubmitting, handleSubmit: handleFormSubmit } = useFormSubmission(
    async (data: any) => {
      const typedData = data as PropertyFormData;
      if (!auth?.currentUser) {
        errorService.showError("User not logged in.");
        return;
      }

      const propertyData: Property = {
        id: initialProperty?.id || generateId(),
        landlordId: auth.currentUser.id,
        propertyType: typedData.property.propertyType as PropertyType,
        address: typedData.property.address.trim(),
        unit: typedData.property.unit?.trim() || undefined,
        county: typedData.property.county as County,
        city: typedData.property.city.trim(),
        state: MARYLAND_STATE_CODE,
        zipCode: typedData.property.zipCode,
        description: typedData.property.description.trim(),
        builtBefore1978: undefined,
        leadCertificateNumber: undefined,
        isAACountyMultipleDwelling: undefined,
        rentalLicenseNumber: undefined,
        rentalLicenseExpirationDate: undefined,
      };

      let tenantData: Tenant | undefined = undefined;
      if (
        typedData.tenant &&
        typedData.tenant.tenantNames.some((name) => name.trim() !== "")
      ) {
        const activeTenantNamesRaw = typedData.tenant.tenantNames
          .map((name) => name.trim())
          .filter((name) => name !== "");

        if (activeTenantNamesRaw.length > 0) {
          const finalTenantNames =
            typedData.property.propertyType === "COMMERCIAL"
              ? [activeTenantNamesRaw[0]].filter(Boolean)
              : activeTenantNamesRaw;

          if (finalTenantNames.length > 0) {
            tenantData = {
              id: initialTenant?.id || generateId(),
              landlordId: auth.currentUser.id,
              propertyId: propertyData.id,
              tenantNames: finalTenantNames,
              email: typedData.tenant.email?.trim() || undefined,
              phone: typedData.tenant.phone?.trim() || undefined,
            };
          }
        }
      }

      onSubmit({ property: propertyData, tenant: tenantData });
    }
  );

  const availableCounties = useMemo(() => {
    if (!auth?.currentUser?.priceOverrides) {
      return [];
    }

    const unlockedCounties = Object.entries(auth.currentUser.priceOverrides)
      .filter(([, details]) => (details as any).unlocked)
      .map(([countyName]) => countyName as County);

    // If we are editing a property, ensure its current county is in the list,
    // even if it has been locked since creation. This allows saving other edits
    // without being forced to change the county.
    if (
      initialProperty?.county &&
      !unlockedCounties.includes(initialProperty.county)
    ) {
      return [initialProperty.county, ...unlockedCounties].sort();
    }

    return unlockedCounties.sort();
  }, [auth?.currentUser, initialProperty]);

  useEffect(() => {
    // Initialize form with initial values
    if (initialProperty || initialTenant) {
      form.reset({
        property: {
          propertyType: (initialProperty?.propertyType ||
            PropertyType.RESIDENTIAL) as "RESIDENTIAL" | "COMMERCIAL",
          address: initialProperty?.address || "",
          unit: initialProperty?.unit || "",
          county: initialProperty?.county || "",
          city: initialProperty?.city || "",
          zipCode: initialProperty?.zipCode || "",
          description: initialProperty?.description || "",
        },
        tenant: {
          tenantNames: initialTenant
            ? [...(initialTenant.tenantNames || []), "", "", "", ""].slice(0, 4)
            : ["", "", "", ""],
          email: initialTenant?.email || "",
          phone: initialTenant?.phone || "",
        },
      });
    }
  }, [initialProperty, initialTenant, form]);

  useEffect(() => {
    const county = form.watch("property.county");
    if (county === County.BALTIMORE_CITY) {
      form.setValue("property.city", "Baltimore");
    }
  }, [form.watch("property.county"), form]);

  useEffect(() => {
    const propertyType = form.watch("property.propertyType");
    if (propertyType === "COMMERCIAL") {
      const currentNames = form.getValues("tenant.tenantNames");
      form.setValue("tenant.tenantNames", [currentNames[0], "", "", ""]);
    }
  }, [form.watch("property.propertyType"), form, initialTenant]);

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    form.handleSubmit(handleFormSubmit)();
  };

  const headingClass =
    "text-lg font-semibold text-gray-700 dark:text-gray-200 border-b pb-2 dark:border-gray-600";

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmitForm} className="space-y-6">
        <h2 className={headingClass}>Property Type</h2>

        {/* Property Type - Moved to Top */}
        <FormInput
          name="property.propertyType"
          label="Property Type"
          type="select"
          required
          options={[
            { value: "RESIDENTIAL", label: "Residential" },
            { value: "COMMERCIAL", label: "Commercial" },
          ]}
        />

        {form.watch("property.propertyType") === "COMMERCIAL" && (
          <div className="p-3 my-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-500/50 rounded-md">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> A notice to the tenant is not required for
              Commercial properties, but you can still generate one if you wish.
            </p>
          </div>
        )}

        {/* Tenant Details Section - Moved Up */}
        <h2 className={`${headingClass} mt-8`}>
          Tenant Details{" "}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            (Optional - fill Tenant 1 Name to add/edit tenant)
          </span>
        </h2>

        <FormInput
          name="tenant.tenantNames.0"
          label="Tenant 1 (First & Last Name)"
          type="text"
          placeholder="Enter tenant name"
        />

        {form.watch("property.propertyType") === "RESIDENTIAL" && (
          <FormInput
            name="tenant.tenantNames.1"
            label="Tenant 2 (First & Last Name)"
            type="text"
            placeholder="Enter tenant name"
            isOptional
          />
        )}

        {form.watch("property.propertyType") === "RESIDENTIAL" &&
          form.watch("tenant.tenantNames.1")?.trim() && (
            <FormInput
              name="tenant.tenantNames.2"
              label="Tenant 3 (First & Last Name)"
              type="text"
              placeholder="Enter tenant name"
              isOptional
            />
          )}

        {form.watch("property.propertyType") === "RESIDENTIAL" &&
          form.watch("tenant.tenantNames.2")?.trim() && (
            <FormInput
              name="tenant.tenantNames.3"
              label="Tenant 4 (First & Last Name)"
              type="text"
              placeholder="Enter tenant name"
              isOptional
            />
          )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            name="tenant.email"
            label="Email"
            type="email"
            placeholder="Enter email address"
            isOptional
          />
          <FormInput
            name="tenant.phone"
            label="Phone"
            type="tel"
            placeholder="Enter phone number"
            isOptional
          />
        </div>

        {/* Remaining Property Fields - Moved Down */}
        <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 border-b pb-1 mt-8 dark:border-gray-600">
          Property Location & Description
        </h3>

        <FormInput
          name="property.address"
          label="Address"
          type="text"
          placeholder="Enter property address"
          required
        />

        <FormInput
          name="property.unit"
          label="Unit / Apt / Suite"
          type="text"
          placeholder="Enter unit number (optional)"
          isOptional
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            name="property.county"
            label="County"
            type="select"
            required
            options={
              availableCounties.length > 0
                ? availableCounties.map((countyVal) => ({
                    value: countyVal,
                    label: countyVal,
                  }))
                : [
                    {
                      value: "",
                      label: "No counties available for your account",
                    },
                  ]
            }
          />

          <FormInput
            name="property.city"
            label="City"
            type="text"
            placeholder="Enter city"
            required
          />

          <FormInput
            name="property.zipCode"
            label="Zip Code"
            type="text"
            placeholder="Enter 5-digit zip code"
            required
            transform={(value) => value.replace(/\D/g, "").slice(0, 5)}
          />
        </div>

        <FormInput
          name="property.description"
          label="For Eviction Posting"
          type="textarea"
          rows={3}
          placeholder="How can our agent gain access to the front door of the property so they can post an eviction notice on the door of the property"
          required
        />

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? "Saving..."
              : initialTenant
              ? "Update Tenant & Property"
              : "Add Tenant & Property"}
          </button>
        </div>
      </form>
    </FormProvider>
  );
};

export default PropertyForm;
