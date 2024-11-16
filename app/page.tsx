import { Suspense } from 'react';
import InvoiceForm from '@/components/InvoiceForm';
import InvoiceList from '@/components/InvoiceList';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Invoice Management System
        </h1>
        
        <div className="bg-white rounded-lg shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Create New Invoice
          </h2>
          <InvoiceForm />
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Recent Invoices
          </h2>
          <Suspense fallback={<div>Loading invoices...</div>}>
            <InvoiceList />
          </Suspense>
        </div>
      </div>
    </main>
  );
}