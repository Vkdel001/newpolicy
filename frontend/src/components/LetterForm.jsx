import { useState, useEffect } from 'react';
import { pdfAPI } from '../services/api';

// Signature mapping based on logged-in user
const SIGNATURE_MAP = {
  'vikas.khanna@zwennpay.com': {
    file: 'signature_vikas.png',
    name: 'Vikas Khanna',
    title: 'Vikas Khanna - Life Underwriting'
  },
  'ameetoo@nicl.mu': {
    file: 'signature_ameetoo.png',
    name: 'Ameetoo',
    title: 'Team Leader - Life Underwriting'
  },
  'bsobran@nicl.mu': {
    file: 'signature_bhoomika.png',
    name: 'Bhoomika Sobran',
    title: 'Team Leader - Life Underwriting'
  },
  'ldhoonah@nicl.mu': {
    file: 'signature_ameetoo.png',
    name: 'Ameetoo',
    title: 'Team Leader - Life Underwriting'
  },
  'dguzadhur@nicl.mu': {
    file: 'signature_ameetoo.png',
    name: 'Ameetoo',
    title: 'Team Leader - Life Underwriting'
  },
  'aahamudally@nicl.mu': {
    file: 'signature_bhoomika.png',
    name: 'Bhoomika Sobran',
    title: 'Team Leader - Life Underwriting'
  }
};

function LetterForm({ format }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [userSignature, setUserSignature] = useState({ 
    file: 'signature_bhoomika.png', 
    name: 'Bhoomika Sobran',
    title: 'Team Leader - Life Underwriting'
  });
  
  // Auto-select signature based on logged-in user
  useEffect(() => {
    const userEmail = localStorage.getItem('email');
    const signature = SIGNATURE_MAP[userEmail] || { 
      file: 'signature_bhoomika.png', 
      name: 'Bhoomika Sobran',
      title: 'Team Leader - Life Underwriting'
    };
    setUserSignature(signature);
    
    // Update form data with correct signature, name, and title
    setFormData(prev => ({
      ...prev,
      signatureFile: signature.file,
      signerName: signature.name,
      signerTitle: signature.title
    }));
  }, []);

  const [layoutVersion, setLayoutVersion] = useState(format === 'format1' ? 'v6' : 'v5');

  const [formData, setFormData] = useState({
    ref: 'BS',
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    customerTitle: '',
    firstName: '',
    surname: '',
    address1: '',
    address2: '',
    address3: '',
    policyNo: '',
    applicationDate: '',
    policyType: format === 'format1' ? 'NIC Prosperity Plan' : '',
    sumAssured: '',
    term: '',
    commencementDate: '',
    benefits: '',
    monthlyPremium: '',
    revisedPremium: '',
    extraPremium: '',
    remarks: '',
    option1: '',
    option2: '',
    returnDate: '',
    signerName: 'Bhoomika Sobran',
    signerTitle: 'Team Leader - Life Underwriting',
    advisorName: '',
    advisorEmail: '',
    customerEmail: '',
    signatureFile: 'signature_bhoomika.png',
    // Template texts
    introText: format === 'format1' 
      ? 'Please refer to your application for life assurance dated {applicationDate}, we wish to inform you that your life cover has been accepted as per details set below:'
      : 'Please refer to your application for life assurance. We wish to inform you that your life cover has been accepted as per details set below:',
    closingText: format === 'format1'
      ? 'We should be grateful if you could confirm your acceptance to the above terms by signing and returning this letter by {returnDate}. After this date we shall conclude that you are agreeable with our terms and subsequently, the policy contract will be issued on Option 2.'
      : 'We should be grateful if you could confirm your acceptance to the above terms by signing and returning this letter by {returnDate} along with the outstanding balance and new standing order.',
    agreementText: format === 'format1'
      ? 'I agree / do not agree with the terms and conditions as set above. Please proceed with Option...........'
      : 'I agree / do not agree with the terms and conditions as set above. Please proceed with the issue/cancel of my life insurance policy.',
    assuringText: 'Assuring you of our best services.'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Debug: Log form data being sent
    console.log('📋 Form Data being sent:', {
      advisorName: formData.advisorName,
      advisorEmail: formData.advisorEmail,
      customerEmail: formData.customerEmail,
      signerName: formData.signerName,
      signerTitle: formData.signerTitle
    });

    try {
      const pdfBlob = await pdfAPI.generatePDF(format, formData, layoutVersion);
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `NICL_Letter_${formData.policyNo}_${layoutVersion}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Enable email button after successful PDF generation
      setPdfGenerated(true);
      alert('PDF generated successfully! You can now send it via email.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate PDF');
      setPdfGenerated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setError('');

    // Double confirmation popup
    const userInput = prompt(
      'CONFIRMATION REQUIRED\n\n' +
      'I have checked the PDF content and it is ok to be sent by email.\n\n' +
      'To confirm, please type: Send email'
    );

    // Check if user typed exactly "Send email"
    if (userInput !== 'Send email') {
      if (userInput !== null) {
        // User didn't cancel but typed wrong text
        alert('Email sending cancelled. You must type "Send email" exactly to confirm.');
      }
      return;
    }

    // User confirmed, proceed with sending
    setLoading(true);
    try {
      await pdfAPI.sendEmail(format, formData, layoutVersion);
      alert('Email sent successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="letter-form">
      <h2>{format === 'format1' ? 'Letter with Options' : 'Letter with no Options'}</h2>
      
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Letter Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Layout Version *</label>
              <select 
                value={layoutVersion} 
                onChange={(e) => setLayoutVersion(e.target.value)}
                required
              >
                {format === 'format1' ? (
                  <option value="v6">Version 6 (Modern Format)</option>
                ) : (
                  <option value="v5">Version 5 (Standard Format)</option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label>Reference *</label>
              <input
                type="text"
                name="ref"
                value={formData.ref}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input
                type="text"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Customer Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Title * (e.g., MR, MRS, MISS, MS, DR, HONORABLE)</label>
              <input
                type="text"
                name="customerTitle"
                value={formData.customerTitle}
                onChange={handleChange}
                placeholder="MRS"
                required
              />
            </div>
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Surname *</label>
              <input
                type="text"
                name="surname"
                value={formData.surname}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Address Line 1 *</label>
            <input
              type="text"
              name="address1"
              value={formData.address1}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Address Line 2 *</label>
            <input
              type="text"
              name="address2"
              value={formData.address2}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Address Line 3 (Optional)</label>
            <input
              type="text"
              name="address3"
              value={formData.address3}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Policy Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Policy Number *</label>
              <input
                type="text"
                name="policyNo"
                value={formData.policyNo}
                onChange={handleChange}
                required
              />
            </div>
            {format === 'format1' && (
              <div className="form-group">
                <label>Application Date *</label>
                <input
                  type="text"
                  name="applicationDate"
                  value={formData.applicationDate}
                  onChange={handleChange}
                  placeholder="13/06/2025"
                  required
                />
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Type of Policy *</label>
            <input
              type="text"
              name="policyType"
              value={formData.policyType}
              onChange={handleChange}
              placeholder="type of policy"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Sum Assured *</label>
              <input
                type="text"
                name="sumAssured"
                value={formData.sumAssured}
                onChange={handleChange}
                placeholder="MUR 144,006.00"
                required
              />
            </div>
            <div className="form-group">
              <label>Term *</label>
              <input
                type="text"
                name="term"
                value={formData.term}
                onChange={handleChange}
                placeholder="20 Years"
                required
              />
            </div>
          </div>
          {format === 'format1' && (
            <div className="form-group">
              <label>Date of Commencement *</label>
              <input
                type="text"
                name="commencementDate"
                value={formData.commencementDate}
                onChange={handleChange}
                placeholder="01/07/2025"
                required
              />
            </div>
          )}
          {format === 'format2' && (
            <div className="form-group">
              <label>Benefits Covered *</label>
              <textarea
                name="benefits"
                value={formData.benefits}
                onChange={handleChange}
                rows="3"
                placeholder="Death Cover, Additional Death Benefit, Total and Permanent Disability Benefit..."
                required
              />
            </div>
          )}
          {format === 'format1' ? (
            <div className="form-group">
              <label>Monthly Premium *</label>
              <input
                type="text"
                name="monthlyPremium"
                value={formData.monthlyPremium}
                onChange={handleChange}
                placeholder="MUR 2,563.89"
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label>Revised Monthly Premium *</label>
              <input
                type="text"
                name="revisedPremium"
                value={formData.revisedPremium}
                onChange={handleChange}
                placeholder="MUR 793.32 (Original Premium MUR 679.00)"
                required
              />
            </div>
          )}
          {format === 'format2' && (
            <div className="form-group">
              <label>Extra Premium *</label>
              <input
                type="text"
                name="extraPremium"
                value={formData.extraPremium}
                onChange={handleChange}
                placeholder="MUR 114.32 (Due to medical conditions)"
                required
              />
            </div>
          )}
          {format === 'format1' && (
            <>
              <div className="form-group">
                <label>Revised Premium (Option 1) *</label>
                <input
                  type="text"
                  name="option1"
                  value={formData.option1}
                  onChange={handleChange}
                  placeholder="MUR [new amount]"
                  required
                />
              </div>
              <div className="form-group">
                <label>Adjusted Sum Assured (Option 2) *</label>
                <input
                  type="text"
                  name="option2"
                  value={formData.option2}
                  onChange={handleChange}
                  placeholder="MUR [new amount]"
                  required
                />
              </div>
            </>
          )}
          <div className="form-group">
            <label>Return Date *</label>
            <input
              type="text"
              name="returnDate"
              value={formData.returnDate}
              onChange={handleChange}
              placeholder="15 November 2025"
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Signature Details</h3>
          <div className="form-group">
            <label>Signer Name *</label>
            <input
              type="text"
              name="signerName"
              value={formData.signerName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Signer Title *</label>
            <input
              type="text"
              name="signerTitle"
              value={formData.signerTitle}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Your Signature (Auto-selected)</label>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '15px',
              padding: '10px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '2px solid #e0e0e0'
            }}>
              <img 
                src={`/${userSignature.file}`} 
                alt="Signature Preview" 
                style={{ 
                  maxWidth: '120px', 
                  maxHeight: '60px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: 'white',
                  padding: '5px'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div>
                <div style={{ fontWeight: '600', color: '#2c3e50' }}>{userSignature.name}</div>
                <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Signature will be used in the letter</div>
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Insurance Advisor & Email Details</h3>
          <div className="form-group">
            <label>Insurance Advisor Name *</label>
            <input
              type="text"
              name="advisorName"
              value={formData.advisorName}
              onChange={handleChange}
              placeholder="e.g., Byronshon Kouroo Bibi Zaina Alyesha"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Insurance Advisor Email *</label>
              <input
                type="email"
                name="advisorEmail"
                value={formData.advisorEmail}
                onChange={handleChange}
                placeholder="advisor@nicl.mu"
                required
              />
            </div>
            <div className="form-group">
              <label>Customer Email (Optional)</label>
              <input
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                placeholder="customer@example.com"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Letter Template Texts</h3>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              {showAdvanced ? 'Hide' : 'Show'} Template Texts
            </button>
          </div>
          
          {showAdvanced && (
            <>
              <div className="form-group">
                <label>Introduction Text</label>
                <textarea
                  name="introText"
                  value={formData.introText}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Opening paragraph text..."
                />
                <small>Use {'{applicationDate}'} and {'{returnDate}'} as placeholders</small>
              </div>
              <div className="form-group">
                <label>Closing Text</label>
                <textarea
                  name="closingText"
                  value={formData.closingText}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Closing paragraph before signature..."
                />
                <small>Use {'{returnDate}'} as placeholder</small>
              </div>
              <div className="form-group">
                <label>Agreement Text</label>
                <textarea
                  name="agreementText"
                  value={formData.agreementText}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Agreement statement at bottom..."
                />
              </div>
              <div className="form-group">
                <label>Assuring Text</label>
                <input
                  type="text"
                  name="assuringText"
                  value={formData.assuringText}
                  onChange={handleChange}
                  placeholder="Assuring you of our best services."
                />
              </div>
            </>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Generating PDF...' : 'Generate PDF'}
          </button>
          <button 
            type="button" 
            onClick={handleSendEmail} 
            className="btn-primary" 
            disabled={loading || !pdfGenerated} 
            style={{ 
              marginLeft: '15px',
              opacity: pdfGenerated ? 1 : 0.5,
              cursor: pdfGenerated ? 'pointer' : 'not-allowed'
            }}
            title={!pdfGenerated ? 'Please generate PDF first' : 'Send letter via email'}
          >
            {loading ? 'Sending Email...' : 'Send Letter on Email'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default LetterForm;
