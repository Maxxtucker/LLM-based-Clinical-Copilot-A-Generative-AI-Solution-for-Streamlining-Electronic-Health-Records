import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export class PDFService {
  static async generatePDF(htmlContent, filename = 'report.pdf', options = {}) {
    try {
      // Create a temporary container for the HTML content
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = htmlContent;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm'; // A4 width
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.padding = '20mm';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      tempContainer.style.fontSize = '12px';
      tempContainer.style.lineHeight = '1.4';
      tempContainer.style.color = '#000';
      
      document.body.appendChild(tempContainer);

      // Configure html2canvas options
      const canvasOptions = {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: tempContainer.offsetWidth,
        height: tempContainer.offsetHeight,
        ...options.canvas
      };

      // Generate canvas from HTML
      const canvas = await html2canvas(tempContainer, canvasOptions);
      
      // Remove temporary container
      document.body.removeChild(tempContainer);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        ...options.pdf
      });

      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add new pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      pdf.save(filename);
      
      return pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  static formatReportHTML(patient, formData, reportType) {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    let html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 15px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 24px;">${reportType.toUpperCase()}</h1>
          <p style="margin: 5px 0; color: #666;">Generated on ${currentDate} at ${currentTime}</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Patient Information</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0; background-color: #f1f5f9; font-weight: bold; width: 30%;">Name:</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${patient.first_name} ${patient.last_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0; background-color: #f1f5f9; font-weight: bold;">Medical Record Number:</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${patient.medical_record_number}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0; background-color: #f1f5f9; font-weight: bold;">Date of Birth:</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0; background-color: #f1f5f9; font-weight: bold;">Gender:</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${patient.gender || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0; background-color: #f1f5f9; font-weight: bold;">Phone:</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${patient.phone || 'N/A'}</td>
            </tr>
          </table>
        </div>
    `;

    if (reportType === 'discharge') {
      html += `
        <div style="margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Admission Summary</h2>
          <p><strong>Chief Complaint:</strong> ${patient.chief_complaint || 'None provided'}</p>
          <p><strong>Admission Date:</strong> ${formData.admission_date || new Date().toLocaleDateString()}</p>
          <p><strong>Discharge Date:</strong> ${formData.discharge_date || new Date().toLocaleDateString()}</p>
          <p><strong>Attending Physician:</strong> ${formData.attending_physician || 'Not specified'}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Discharge Diagnosis</h2>
          <p><strong>Primary Diagnosis:</strong> ${formData.primary_diagnosis || 'To be determined'}</p>
          <p><strong>Secondary Diagnoses:</strong> ${formData.secondary_diagnoses || 'None'}</p>
          <p><strong>Discharge Condition:</strong> ${formData.discharge_condition || 'Not specified'}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Hospital Course</h2>
          <p>${formData.hospital_course || 'No details provided'}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Procedures Performed</h2>
          <p>${formData.procedures_performed || 'None documented'}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Complications</h2>
          <p>${formData.complications || 'None reported'}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Discharge Instructions</h2>
          <p><strong>Medications:</strong> ${formData.discharge_medications || 'None prescribed'}</p>
          <p><strong>Follow-up:</strong> ${formData.follow_up_instructions || 'Schedule follow-up appointment within 1-2 weeks'}</p>
          <p><strong>Discharge Disposition:</strong> ${formData.discharge_disposition || 'Home'}</p>
        </div>
      `;
    } else if (reportType === 'referral') {
      html += `
        <div style="margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Referral Information</h2>
          <p><strong>Referring Physician:</strong> ${formData.referring_physician || 'Not specified'}</p>
          <p><strong>Specialty Referred To:</strong> ${formData.specialty || 'Not specified'}</p>
          <p><strong>Reason for Referral:</strong> ${formData.reason || 'Not specified'}</p>
          <p><strong>Urgency:</strong> ${formData.urgency || 'Routine'}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Clinical Summary</h2>
          <p>${formData.clinical_summary || 'No clinical summary provided'}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Current Medications</h2>
          <p>${formData.current_medications || 'None documented'}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Specific Questions for Specialist</h2>
          <p>${formData.specialist_questions || 'None specified'}</p>
        </div>
      `;
    } else if (reportType === 'handover') {
      html += `
        <div style="margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Handover Information</h2>
          <p><strong>From:</strong> ${formData.from_team || 'Not specified'}</p>
          <p><strong>To:</strong> ${formData.to_team || 'Not specified'}</p>
          <p><strong>Handover Date:</strong> ${formData.handover_date || new Date().toLocaleDateString()}</p>
          <p><strong>Shift:</strong> ${formData.shift || 'Not specified'}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Current Status</h2>
          <p><strong>Condition:</strong> ${formData.current_condition || 'Not specified'}</p>
          <p><strong>Vital Signs:</strong> ${formData.vital_signs || 'Stable'}</p>
          <p><strong>Pain Level:</strong> ${formData.pain_level || 'Not assessed'}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Ongoing Care</h2>
          <p><strong>Medications:</strong> ${formData.ongoing_medications || 'None'}</p>
          <p><strong>Treatments:</strong> ${formData.ongoing_treatments || 'None'}</p>
          <p><strong>Monitoring:</strong> ${formData.monitoring_requirements || 'Routine'}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Action Items</h2>
          <p>${formData.action_items || 'None specified'}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Special Instructions</h2>
          <p>${formData.special_instructions || 'None'}</p>
        </div>
      `;
    }

    html += `
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 10px; color: #666; text-align: center;">
            This report was generated electronically and is valid without signature.
          </p>
        </div>
      </div>
    `;

    return html;
  }
}
