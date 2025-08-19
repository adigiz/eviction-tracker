import { Property, Tenant } from "../types";

export interface DocumentGeneratorService {
  generateEvictionNotice: (
    landlordName: string,
    property: Property,
    tenant: Tenant,
    rentOwed: number
  ) => string;
  
  generateWarrantRequest: (
    landlordName: string,
    property: Property,
    tenant: Tenant,
    caseId: string,
    judgmentDate: string
  ) => string;
}

class TemplateDocumentGenerator implements DocumentGeneratorService {
  generateEvictionNotice(
    landlordName: string,
    property: Property,
    tenant: Tenant,
    rentOwed: number
  ): string {
    const tenantNameString = tenant.tenantNames && tenant.tenantNames.length > 0 
      ? tenant.tenantNames.join(' and ') 
      : '[Tenant Name Missing]';
    
    const propertyAddress = `${property.address}${property.unit ? `, ${property.unit}` : ''}, ${property.city}, ${property.state} ${property.zipCode}`;
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return `EVICTION NOTICE FOR NON-PAYMENT OF RENT

To: ${tenantNameString}
From: ${landlordName}
Date: ${currentDate}

RE: Property at ${propertyAddress}

YOU ARE HEREBY NOTIFIED that you are in default under the terms of your lease agreement for non-payment of rent.

DEMAND IS HEREBY MADE for payment of the outstanding rent in the amount of $${rentOwed.toFixed(2)} within 10 days of receipt of this notice.

FAILURE TO COMPLY with this demand will result in legal action being initiated to evict you from the premises and recover possession of the property, along with any unpaid rent and court costs.

Contact Landlord at [Phone Number/Email] for payment arrangements.

This notice is given pursuant to Maryland law and serves as your formal notification of default.

Sincerely,
${landlordName}
Landlord`;
  }

  generateWarrantRequest(
    landlordName: string,
    property: Property,
    tenant: Tenant,
    caseId: string,
    judgmentDate: string
  ): string {
    const tenantNameString = tenant.tenantNames && tenant.tenantNames.length > 0 
      ? tenant.tenantNames.join(' and ') 
      : '[Tenant Name Missing]';
    
    const propertyAddress = `${property.address}${property.unit ? `, ${property.unit}` : ''}, ${property.city}, ${property.state} ${property.zipCode}`;
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const judgmentDateFormatted = new Date(judgmentDate + "T00:00:00").toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return `REQUEST FOR WARRANT OF RESTITUTION

Date: ${currentDate}

To: Clerk of the Court
    District Court of Maryland
    [County Name] County

RE: Case Number: ${caseId}

Dear Clerk:

I, ${landlordName}, am the landlord of the property located at:
${propertyAddress}

On ${judgmentDateFormatted}, a judgment for possession was entered in my favor against the tenant(s):
${tenantNameString}

The tenant(s) have failed to vacate the premises as ordered by the court. I hereby request that a Warrant of Restitution be issued to the Sheriff's Office to execute the judgment and restore possession of the property to me.

Please find attached the court order and judgment for your records.

Landlord Contact Information:
Name: ${landlordName}
Phone: [Phone Number]
Email: [Email Address]

Thank you for your attention to this matter.

Sincerely,
${landlordName}
Landlord`;
  }
}

// Export the service instance
export const documentGeneratorService = new TemplateDocumentGenerator();

// Export individual functions for backward compatibility
export const generateEvictionNoticeContent = (
  landlordName: string,
  property: Property,
  tenant: Tenant,
  rentOwed: number
): string => {
  return documentGeneratorService.generateEvictionNotice(landlordName, property, tenant, rentOwed);
};

export const generateWarrantRequestContent = (
  landlordName: string,
  property: Property,
  tenant: Tenant,
  caseId: string,
  judgmentDate: string
): string => {
  return documentGeneratorService.generateWarrantRequest(landlordName, property, tenant, caseId, judgmentDate);
};
