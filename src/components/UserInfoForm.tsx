import React, { useState } from 'react';

interface UserInfoFormProps {
  onSubmit: (userInfo: { name: string; email: string; phone?: string; message?: string }) => void;
  loading?: boolean;
  error?: string;
  primaryColor: string;
  secondaryColor: string;
}

export function UserInfoForm({ onSubmit, loading, error, primaryColor, secondaryColor }: UserInfoFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        message: formData.message.trim() || undefined,
      });
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const containerStyle: React.CSSProperties = {
    padding: '20px 20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    background: '#fff',
  };

  const introStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: '#0f172a',
  };

  const subtitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 14,
    color: '#475569',
  };

  const alertStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    fontSize: 13,
  };

  const formStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: 6,
  };

  const getFieldStyle = (field: string, isMultiline = false): React.CSSProperties => {
    const hasError = Boolean(errors[field]);
    const isFocused = focusedField === field;
    const style: React.CSSProperties = {
      width: '100%',
      padding: '10px 12px',
      borderRadius: 12,
      border: `1px solid ${hasError ? '#f87171' : isFocused ? primaryColor : '#d1d5db'}`,
      fontSize: 14,
      lineHeight: 1.4,
      outline: 'none',
      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
      boxShadow: isFocused ? `0 0 0 3px ${primaryColor}1f` : 'none',
      backgroundColor: loading ? '#f8fafc' : '#fff',
    };
    if (isMultiline) {
      style.minHeight = 90;
      style.resize = 'none';
    }
    return style;
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 12,
    border: 'none',
    fontSize: 15,
    fontWeight: 600,
    color: '#fff',
    background: `linear-gradient(120deg, ${primaryColor}, ${secondaryColor})`,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
    boxShadow: '0 12px 24px rgba(15,23,42,0.12)',
  };

  const helperTextStyle: React.CSSProperties = {
    marginTop: 4,
    fontSize: 12,
    color: '#b91c1c',
  };

  return (
    <div style={containerStyle}>
      <div style={introStyle}>
        <h3 style={titleStyle}>Start a conversation</h3>
        <p style={subtitleStyle}>Please provide your information to connect with our support team.</p>
      </div>

      {error && (
        <div style={alertStyle}>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={formStyle}>
        <div>
          <label htmlFor="name" style={labelStyle}>
            Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={handleChange('name')}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            placeholder="Enter your full name"
            disabled={loading}
            style={getFieldStyle('name')}
          />
          {errors.name && <p style={helperTextStyle}>{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" style={labelStyle}>
            Email *
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleChange('email')}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            placeholder="Enter your email address"
            disabled={loading}
            style={getFieldStyle('email')}
          />
          {errors.email && <p style={helperTextStyle}>{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="phone" style={labelStyle}>
            Phone (Optional)
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={handleChange('phone')}
            onFocus={() => setFocusedField('phone')}
            onBlur={() => setFocusedField(null)}
            placeholder="Enter your phone number"
            disabled={loading}
            style={getFieldStyle('phone')}
          />
        </div>

        <div>
          <label htmlFor="message" style={labelStyle}>
            Initial Message (Optional)
          </label>
          <textarea
            id="message"
            value={formData.message}
            onChange={handleChange('message')}
            onFocus={() => setFocusedField('message')}
            onBlur={() => setFocusedField(null)}
            rows={3}
            placeholder="How can we help you today?"
            disabled={loading}
            style={getFieldStyle('message', true)}
          />
        </div>

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Starting chat...' : 'Start Chat'}
        </button>
      </form>
    </div>
  );
}