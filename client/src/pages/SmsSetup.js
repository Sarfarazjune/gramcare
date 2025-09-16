import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const SmsSetup = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const handleSendCode = async () => {
    setError(null);
    setMessage(null);
    setIsSendingCode(true);
    try {
      const response = await axios.post('/api/sms/send-verification', { phoneNumber });
      if (response.data.success) {
        setMessage('Verification code sent to your phone!');
      } else {
        setError(response.data.error || 'Failed to send verification code.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error sending verification code.');
    }
    setIsSendingCode(false);
  };

  const handleVerifyCode = async () => {
    setError(null);
    setMessage(null);
    setIsVerifyingCode(true);
    try {
      const response = await axios.post('/api/sms/verify-code', { phoneNumber, code: verificationCode });
      if (response.data.success) {
        setMessage('Phone number verified successfully!');
        // Optionally, redirect or update user state
      } else {
        setError(response.data.error || 'Failed to verify code.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error verifying code.');
    }
    setIsVerifyingCode(false);
  };

  return (
    <div className="sms-setup-container">
      <h2>SMS Integration Setup</h2>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="form-group">
        <label htmlFor="phoneNumber">Phone Number:</label>
        <input
          type="text"
          id="phoneNumber"
          className="form-control"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="e.g., +1234567890"
        />
      </div>
      <button onClick={handleSendCode} className="btn btn-primary" disabled={isSendingCode}>
        {isSendingCode ? 'Sending...' : 'Send Verification Code'}
      </button>

      {phoneNumber && (
        <div className="form-group mt-3">
          <label htmlFor="verificationCode">Verification Code:</label>
          <input
            type="text"
            id="verificationCode"
            className="form-control"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter 4-digit code"
          />
          <button onClick={handleVerifyCode} className="btn btn-success mt-2" disabled={isVerifyingCode}>
            {isVerifyingCode ? 'Verifying...' : 'Verify Phone Number'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SmsSetup;