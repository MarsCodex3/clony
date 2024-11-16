"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FormError {
  field: string;
  message: string;
}

export default function InvoiceForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [formData, setFormData] = useState({
    amount: '',
    clientEmail: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setSuccessMessage('');

    try {
      const response = await fetch('/api/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          clientEmail: formData.clientEmail,
          description: formData.description || 'Invoice payment',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setErrors(data.details);
        } else if (data.error === 'Stripe error') {
          setErrors([{ 
            field: 'general',
            message: `Payment processing error: ${data.message}. Please check your Stripe configuration.`
          }]);
        } else {
          throw new Error(data.message || 'Failed to create invoice');
        }
        return;
      }

      if (data.success) {
        setSuccessMessage(`Invoice created successfully! Payment link: ${data.paymentUrl}`);
        setFormData({ amount: '', clientEmail: '', description: '' });
        router.refresh();
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      setErrors([{ 
        field: 'general',
        message: 'Failed to create invoice. Please try again or contact support.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (fieldName: string) => {
    return errors.find(error => error.field === fieldName)?.message;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {getFieldError('general') && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{getFieldError('general')}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Amount (USD)
        </label>
        <input
          type="number"
          id="amount"
          step="0.01"
          required
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm
            ${getFieldError('amount') 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
            }`}
          placeholder="0.00"
        />
        {getFieldError('amount') && (
          <p className="mt-1 text-sm text-red-600">{getFieldError('amount')}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Client Email
        </label>
        <input
          type="email"
          id="email"
          required
          value={formData.clientEmail}
          onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm
            ${getFieldError('clientEmail')
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
            }`}
          placeholder="client@example.com"
        />
        {getFieldError('clientEmail') && (
          <p className="mt-1 text-sm text-red-600">{getFieldError('clientEmail')}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm
            ${getFieldError('description')
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
            }`}
          rows={3}
          placeholder="Invoice description..."
        />
        {getFieldError('description') && (
          <p className="mt-1 text-sm text-red-600">{getFieldError('description')}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Invoice'}
      </button>
    </form>
  );
}