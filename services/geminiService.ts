
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_TEXT } from '../constants';
import { Property, Tenant } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY for Gemini is not set. AI features will not work. Ensure process.env.API_KEY is configured.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateEvictionNoticeContent = async ( // Renamed from generateFTPRNoticeContent
  landlordName: string,
  property: Property,
  tenant: Tenant,
  rentOwed: number
): Promise<string> => {
  if (!API_KEY) {
    return Promise.resolve("API Key not configured. Cannot generate document. This is a placeholder notice: Tenant [Tenant Name] owes [Amount Owed] for property [Property Address].");
  }

  const tenantNameString = tenant.tenantNames && tenant.tenantNames.length > 0 
    ? tenant.tenantNames.join(' and ') 
    : '[Tenant Name Missing]';
  
  const totalAmountDue = rentOwed;

  const prompt = `
Generate a formal "Eviction Notice" (also known as a "Notice to Vacate" for non-payment of rent) suitable for use in Maryland for a residential tenancy.
The notice must be addressed to the tenant(s) and clearly state the landlord's intent to seek repossession of the property if the outstanding rent is not paid.

Include the following specific details:
- Landlord Name: ${landlordName}
- Tenant Names: ${tenantNameString}
- Property Address: ${property.address}${property.unit ? `, ${property.unit}` : ''}, ${property.city}, ${property.state} ${property.zipCode}
- Amount of Rent Owed: $${rentOwed.toFixed(2)}
- Total Amount Due: $${totalAmountDue.toFixed(2)}
- A clear statement that the tenant(s) has/have 10 days from receipt of this notice to pay the total amount due or vacate the premises.
- A statement that if the tenant(s) neither pays nor vacates within the specified timeframe, legal action will be initiated to evict the tenant(s) and recover possession of the property, along with any unpaid rent and court costs.
- Landlord contact information for payment (you can use placeholder like "Contact Landlord at [Phone Number/Email]").
- Date of the notice: ${new Date().toLocaleDateString()}

The notice should be structured professionally and contain standard legal phrasing appropriate for such a document in Maryland.
Ensure the tone is formal and serious.
Do not include any introductory or concluding remarks that are not part of the notice itself. Output only the notice content.
Example phrases to consider: "YOU ARE HEREBY NOTIFIED...", "DEMAND IS HEREBY MADE...", "FAILURE TO COMPLY...".
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating Eviction Notice:", error); // Updated error message
    throw new Error("Failed to generate Eviction Notice content from AI. Please try again."); // Updated error message
  }
};

export const generateWarrantRequestContent = async (
  landlordName: string,
  property: Property,
  tenant: Tenant,
  caseId: string, 
  judgmentDate: string
): Promise<string> => {
  if (!API_KEY) {
    return Promise.resolve("API Key not configured. Placeholder warrant request content.");
  }
  const tenantNameString = tenant.tenantNames && tenant.tenantNames.length > 0 
    ? tenant.tenantNames.join(' and ') 
    : '[Tenant Name Missing]';

  const prompt = `
Generate a formal request letter for a Warrant of Restitution in Maryland.

Include the following specific details:
- Landlord Name: ${landlordName}
- Tenant Names: ${tenantNameString}
- Property Address: ${property.address}${property.unit ? `, ${property.unit}` : ''}, ${property.city}, ${property.state} ${property.zipCode}
- Court Case ID: ${caseId} 
- Date of Judgment for Possession: ${new Date(judgmentDate + "T00:00:00").toLocaleDateString()}
- A clear request to the court clerk or appropriate authority to issue a Warrant of Restitution for the aforementioned property.
- Landlord contact information (placeholder: "Landlord Contact: [Phone/Email]").
- Date of the request: ${new Date().toLocaleDateString()}

The letter should be formal and addressed to the appropriate court or sheriff's office.
Output only the letter content.
`;
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating Warrant Request:", error);
    throw new Error("Failed to generate Warrant Request content from AI.");
  }
};


export const generateEvictionPostingRequestContent = async (
  landlordName: string,
  property: Property,
  tenant: Tenant,
  warrantIssueDate: string 
): Promise<string> => {
  if (!API_KEY) {
    return Promise.resolve("API Key not configured. Placeholder eviction posting request content.");
  }
  const tenantNameString = tenant.tenantNames && tenant.tenantNames.length > 0 
    ? tenant.tenantNames.join(' and ') 
    : '[Tenant Name Missing]';

  const prompt = `
Generate a formal request letter to the Sheriff's office for scheduling an eviction posting in Maryland.

Include the following specific details:
- Landlord Name: ${landlordName}
- Tenant Names: ${tenantNameString}
- Property Address: ${property.address}${property.unit ? `, ${property.unit}` : ''}, ${property.city}, ${property.state} ${property.zipCode}
- Warrant of Restitution Issue Date: ${new Date(warrantIssueDate + "T00:00:00").toLocaleDateString()}
- A clear request to schedule and carry out the eviction at the earliest possible date.
- Landlord contact information for coordination (placeholder: "Landlord Contact: [Phone/Email]").
- Date of the request: ${new Date().toLocaleDateString()}

The letter should be formal. Output only the letter content.
`;
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating Eviction Posting Request:", error);
    throw new Error("Failed to generate Eviction Posting Request content from AI.");
  }
};
