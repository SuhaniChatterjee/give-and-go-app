import jsPDF from 'jspdf';

interface DonationReceipt {
  donationId: string;
  donorName: string;
  itemCategory: string;
  itemDescription: string;
  quantity: number;
  pickupAddress: string;
  pickupDate: string;
  volunteerName: string;
  completedAt: string;
}

export const generateDonationReceipt = (donation: DonationReceipt) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(45, 156, 136); // Primary color
  doc.text('DonateConnect', 105, 20, { align: 'center' });
  
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('Donation Receipt', 105, 35, { align: 'center' });
  
  // Horizontal line
  doc.setDrawColor(45, 156, 136);
  doc.setLineWidth(0.5);
  doc.line(20, 40, 190, 40);
  
  // Receipt details
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  
  let yPos = 55;
  const lineHeight = 10;
  
  // Donation ID
  doc.setFont(undefined, 'bold');
  doc.text('Donation ID:', 20, yPos);
  doc.setFont(undefined, 'normal');
  doc.text(donation.donationId, 70, yPos);
  yPos += lineHeight;
  
  // Date
  doc.setFont(undefined, 'bold');
  doc.text('Completed On:', 20, yPos);
  doc.setFont(undefined, 'normal');
  doc.text(new Date(donation.completedAt).toLocaleString(), 70, yPos);
  yPos += lineHeight + 5;
  
  // Donor section
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(45, 156, 136);
  doc.text('Donor Information', 20, yPos);
  yPos += lineHeight;
  
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, 'bold');
  doc.text('Name:', 20, yPos);
  doc.setFont(undefined, 'normal');
  doc.text(donation.donorName, 70, yPos);
  yPos += lineHeight;
  
  doc.setFont(undefined, 'bold');
  doc.text('Pickup Address:', 20, yPos);
  doc.setFont(undefined, 'normal');
  const addressLines = doc.splitTextToSize(donation.pickupAddress, 120);
  doc.text(addressLines, 70, yPos);
  yPos += lineHeight * addressLines.length + 5;
  
  // Donation section
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(45, 156, 136);
  doc.text('Donation Details', 20, yPos);
  yPos += lineHeight;
  
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, 'bold');
  doc.text('Category:', 20, yPos);
  doc.setFont(undefined, 'normal');
  doc.text(donation.itemCategory, 70, yPos);
  yPos += lineHeight;
  
  doc.setFont(undefined, 'bold');
  doc.text('Items:', 20, yPos);
  doc.setFont(undefined, 'normal');
  const descLines = doc.splitTextToSize(donation.itemDescription, 120);
  doc.text(descLines, 70, yPos);
  yPos += lineHeight * descLines.length;
  
  doc.setFont(undefined, 'bold');
  doc.text('Quantity:', 20, yPos);
  doc.setFont(undefined, 'normal');
  doc.text(donation.quantity.toString(), 70, yPos);
  yPos += lineHeight + 5;
  
  // Volunteer section
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(45, 156, 136);
  doc.text('Pickup By', 20, yPos);
  yPos += lineHeight;
  
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, 'bold');
  doc.text('Volunteer:', 20, yPos);
  doc.setFont(undefined, 'normal');
  doc.text(donation.volunteerName, 70, yPos);
  yPos += lineHeight;
  
  doc.setFont(undefined, 'bold');
  doc.text('Pickup Date:', 20, yPos);
  doc.setFont(undefined, 'normal');
  doc.text(new Date(donation.pickupDate).toLocaleDateString(), 70, yPos);
  yPos += lineHeight + 10;
  
  // Thank you message
  doc.setFontSize(14);
  doc.setTextColor(45, 156, 136);
  doc.setFont(undefined, 'bold');
  doc.text('Thank you for your generous donation!', 105, yPos, { align: 'center' });
  yPos += lineHeight;
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  doc.text('Your contribution makes a difference in our community.', 105, yPos, { align: 'center' });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('DonateConnect - Community Donation Pickup Scheduling System', 105, 280, { align: 'center' });
  doc.text('For inquiries, visit our website or contact support', 105, 285, { align: 'center' });
  
  // Generate filename and download
  const filename = `donation-receipt-${donation.donationId}.pdf`;
  doc.save(filename);
};
